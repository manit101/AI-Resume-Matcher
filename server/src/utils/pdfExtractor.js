const pdfParse = require('pdf-parse');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Minimum character threshold — if pdf-parse extracts fewer chars than this,
 * we assume the PDF is scanned/image-based and fall back to OCR.
 */
const MIN_TEXT_THRESHOLD = 100;

/**
 * Max number of PDF pages to process via OCR (to control API costs).
 */
const MAX_OCR_PAGES = 5;

/**
 * Check if poppler-utils (pdftoppm) is available on the system.
 * Cached after first check to avoid repeated shell calls.
 */
let _popplerAvailable = null;
const isPopplerAvailable = () => {
  if (_popplerAvailable !== null) return _popplerAvailable;
  try {
    execSync('which pdftoppm', { stdio: 'ignore' });
    _popplerAvailable = true;
  } catch {
    _popplerAvailable = false;
  }
  return _popplerAvailable;
};

/**
 * Convert a PDF buffer to PNG images using pdftoppm (poppler-utils).
 * Returns paths to generated image files and the temp directory for cleanup.
 * 
 * @param {Buffer} pdfBuffer - Raw PDF file buffer
 * @returns {{ imageFiles: string[], tmpDir: string }}
 */
const pdfToImages = (pdfBuffer) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'resume-ocr-'));
  const pdfPath = path.join(tmpDir, 'input.pdf');
  const outputPrefix = path.join(tmpDir, 'page');

  fs.writeFileSync(pdfPath, pdfBuffer);

  // Convert PDF to JPEG at 150 DPI — JPEG is much smaller than PNG for scanned docs
  // 150 DPI is sufficient for Vision API text recognition
  execSync(`pdftoppm -jpeg -jpegopt quality=85 -r 150 "${pdfPath}" "${outputPrefix}"`, {
    stdio: 'ignore',
    timeout: 30000, // 30s timeout
  });

  const imageFiles = fs.readdirSync(tmpDir)
    .filter(f => f.endsWith('.jpg'))
    .sort()
    .slice(0, MAX_OCR_PAGES)
    .map(f => path.join(tmpDir, f));

  return { imageFiles, tmpDir };
};

/**
 * Extract text from resume images using OpenAI Vision API.
 * Handles multi-column layouts and scanned documents.
 * 
 * @param {string[]} imageFiles - Paths to PNG images of PDF pages
 * @returns {Promise<string>} - Extracted text
 */
const ocrWithVisionAPI = async (imageFiles) => {
  const imageMessages = imageFiles.map(imgPath => {
    const base64 = fs.readFileSync(imgPath).toString('base64');
    return {
      type: 'image_url',
      image_url: {
        url: `data:image/jpeg;base64,${base64}`,
        detail: 'high'
      }
    };
  });

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are a document text extractor. Extract ALL text from the provided document images.
        
CRITICAL RULES:
- For MULTI-COLUMN layouts: read each column separately, left column first then right column, top to bottom
- Preserve section structure (e.g., Professional Summary, Skills, Experience, Education, Projects)
- Preserve bullet points and list formatting
- Extract ALL text — names, contact info, skills, experience, education, certifications, projects, achievements
- Do NOT add commentary, headers, or explanations — output ONLY the raw extracted text
- If text is blurry or unclear, extract your best interpretation`
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Extract all text from this resume/document. Carefully handle multi-column layouts by reading left column first, then right column. Output only the extracted text.'
          },
          ...imageMessages
        ]
      }
    ],
    max_tokens: 4000,
    temperature: 0,
  });

  return response.choices[0].message.content || '';
};

/**
 * Cleanup temporary files and directory.
 * @param {string} tmpDir 
 */
const cleanupTempDir = (tmpDir) => {
  try {
    if (tmpDir && fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  } catch (e) {
    console.warn(`Failed to cleanup temp dir ${tmpDir}:`, e.message);
  }
};

/**
 * Downloads a PDF from a given URL and extracts its raw text.
 * 
 * Uses a two-tier extraction strategy:
 *   1. pdf-parse (fast, free) — works for standard text-based PDFs
 *   2. Vision API OCR (accurate, handles any PDF) — fallback for scanned PDFs
 *      and multi-column layouts where pdf-parse returns poor results
 * 
 * @param {string} fileUrl - URL to the PDF file (e.g., Firebase Storage URL)
 * @returns {Promise<string>} - Extracted text content
 */
exports.extractTextFromPdfUrl = async (fileUrl) => {
  let tmpDir = null;

  try {
    // 1. Download PDF into buffer
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 2. Try pdf-parse first (fast, handles most text-based PDFs)
    let text = '';
    try {
      const data = await pdfParse(buffer);
      text = data.text || '';
    } catch (parseError) {
      console.warn(`pdf-parse failed for ${fileUrl}:`, parseError.message);
    }

    // 3. Check text quality — is it sufficient?
    const cleanText = text.replace(/\s+/g, ' ').trim();
    if (cleanText.length >= MIN_TEXT_THRESHOLD) {
      console.log(`[PDF] Text extracted via pdf-parse (${cleanText.length} chars)`);
      return text;
    }

    // 4. Fallback: OCR via Vision API for scanned/image PDFs
    console.log(`[PDF] Text extraction insufficient (${cleanText.length} chars). Attempting Vision API OCR...`);

    if (!isPopplerAvailable()) {
      console.warn('[PDF] poppler-utils not installed. Install with: sudo apt-get install poppler-utils');
      // Return whatever we have, even if it's poor
      if (text) return text;
      throw new Error('PDF text extraction failed and OCR fallback unavailable (poppler-utils not installed)');
    }

    // Convert PDF pages to images
    const result = pdfToImages(buffer);
    tmpDir = result.tmpDir;
    const imageFiles = result.imageFiles;

    if (imageFiles.length === 0) {
      throw new Error('Failed to convert PDF to images for OCR');
    }

    console.log(`[PDF] Converted ${imageFiles.length} page(s) to images. Running Vision API OCR...`);

    // Extract text from images using OpenAI Vision API
    const ocrText = await ocrWithVisionAPI(imageFiles);

    if (ocrText && ocrText.trim().length > 0) {
      console.log(`[PDF] Vision API OCR successful (${ocrText.trim().length} chars)`);
      return ocrText;
    }

    // If Vision API also fails, return whatever pdf-parse gave us
    return text || '';

  } catch (error) {
    console.error(`Failed to extract text from PDF: ${fileUrl}`, error);
    throw new Error('PDF extraction failed');
  } finally {
    // Always cleanup temp files
    cleanupTempDir(tmpDir);
  }
};
