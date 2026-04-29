const pdfParse = require('pdf-parse');

/**
 * Downloads a PDF from a given URL and extracts its raw text.
 * @param {string} fileUrl
 * @returns {Promise<string>}
 */
exports.extractTextFromPdfUrl = async (fileUrl) => {
  try {
    // Download the file into a buffer using native fetch (Node.js 18+)
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Parse the PDF buffer
    const data = await pdfParse(buffer);
    
    // Return the extracted text
    return data.text;
  } catch (error) {
    console.error(`Failed to extract text from PDF: ${fileUrl}`, error);
    throw new Error('PDF extraction failed');
  }
};
