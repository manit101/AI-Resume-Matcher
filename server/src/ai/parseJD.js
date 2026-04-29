const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const { optimizeText } = require('../utils/textOptimizer');

/**
 * Extracts and structures key requirements from a Job Description using OpenAI JSON mode.
 * @param {string} title
 * @param {string} description
 * @param {string} requirements
 * @returns {Promise<Object>} - parsedData JSON object
 */
exports.parseJD = async (title, description, requirements) => {
  try {
    const optimizedTitle = optimizeText(title);
    const optimizedDescription = optimizeText(description);
    const optimizedRequirements = optimizeText(requirements);

    const prompt = `You are an expert technical recruiter. Parse the following Job Description into structured JSON.
    
    The JSON structure MUST follow exactly this schema:
    {
      "required_skills": ["Array", "of", "required", "skills"],
      "optional_skills": ["Array", "of", "nice-to-have", "skills"],
      "experience_required": "Summary string of required experience level (e.g. '3-5 years', 'Senior Level')"
    }
    
    Job Title: ${optimizedTitle}
    Job Description: ${optimizedDescription}
    Requirements: ${optimizedRequirements || "N/A"}
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
    console.error("OpenAI JD parsing failed:", error);
    throw new Error('JD parsing failed');
  }
};
