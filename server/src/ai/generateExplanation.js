const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Batches explanation generation to reduce API calls.
 * @param {Array<Object>} matchDataList - Array of objects: { id, matchedSkills, missingSkills, experienceGap }
 * @returns {Promise<Array<Object>>} - Array of objects: { id, explanation }
 */
exports.generateExplanationsBatch = async (matchDataList) => {
  if (!matchDataList || matchDataList.length === 0) return [];

  try {
    const prompt = `You are an expert recruiter. For each candidate match below, generate a concise 1-line explanation (max 20 words) summarizing their fit based on the provided skills and experience gap.
    
    Respond STRICTLY with a JSON object containing an array called "explanations", where each element has the candidate's "id" and their "explanation".
    
    Candidates:
    ${JSON.stringify(matchDataList, null, 2)}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Very capable of returning batched JSON for cheaper
      messages: [
        { role: "system", content: "You are an AI assistant that only outputs valid JSON matching the requested schema." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const parsedJson = JSON.parse(response.choices[0].message.content);
    return parsedJson.explanations || [];
  } catch (err) {
    console.error("Failed to generate batched explanations:", err);
    // Fallback: return empty explanations
    return matchDataList.map(m => ({ id: m.id, explanation: "Match calculated but explanation generation failed." }));
  }
};
