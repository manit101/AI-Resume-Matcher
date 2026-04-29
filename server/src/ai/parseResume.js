const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const { optimizeText } = require('../utils/textOptimizer');

/**
 * Extracts raw text and structures it into skills, experience, and full text
 * using OpenAI chat completions API with JSON mode.
 * 
 * @param {string} rawText - Extracted text from the Resume PDF
 * @returns {Promise<Object>} - Structured JSON representation
 */
exports.parseResume = async (rawText) => {
  try {
    const optimizedText = optimizeText(rawText);

    const prompt = `You are an expert technical recruiter. Your task is to parse the following resume text and extract the key information in JSON format.
    
    The JSON structure MUST follow exactly this schema:
    {
      "skills": ["Array", "of", "all", "technical", "and", "soft", "skills"],
      "experiencesummary": "A cohesive summary paragraph of all work experiences.",
      "total_years_experience": "An integer representing the total years of professional experience. Calculate it based on the work history dates if necessary. If not found, use 0.",
      "projects": ["Array of project descriptions"],
      "education": "Summary of educational background",
      "summary": "A brief overview or objective of the candidate"
    }
    
    Resume Text:
    ---
    ${optimizedText}
    ---
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Cost efficient model
      messages: [
        { role: "system", content: "You are an AI assistant that only outputs valid JSON." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const parsedJson = JSON.parse(response.choices[0].message.content);
    return parsedJson;

  } catch (error) {
    console.error("OpenAI Resume parsing failed:", error);
    throw new Error('Resume parsing failed');
  }
};
