const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Extracts the number of years of experience from a text string using Regex.
 * If regex fails, falls back to an LLM call.
 * @param {string} text 
 * @returns {Promise<number>} - years of experience (0 if not found)
 */
exports.extractYearsOfExperience = async (text) => {
  if (!text) return 0;

  // Attempt regex first: Look for "X years", "X+ years", "X yrs"
  const regex = /(\d+)(?:\+|\s*\+)?\s*(?:years|yrs|yr|year)(?:\s+of\s+experience)?/i;
  const match = text.match(regex);
  if (match && match[1]) {
    const years = parseInt(match[1], 10);
    if (!isNaN(years)) return years;
  }

  // Fallback to LLM if regex fails
  try {
    const prompt = `Extract the total years of professional experience from the following text. 
    Respond with ONLY a single integer representing the number of years. If you cannot determine it, respond with 0.
    
    Text: "${text}"`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // cheaper model is sufficient for this
      messages: [
        { role: "system", content: "You are a precise data extractor. Output only an integer." },
        { role: "user", content: prompt }
      ],
      temperature: 0,
      max_tokens: 10,
    });

    const parsed = parseInt(response.choices[0].message.content.trim(), 10);
    return isNaN(parsed) ? 0 : parsed;
  } catch (err) {
    console.error("LLM experience extraction failed:", err);
    return 0; // fallback to 0 if everything fails
  }
};

/**
 * Safely parses the required years of experience from a string (e.g. "3-5", "at least 5 years")
 * @param {number|string} requiredYearsInput
 * @returns {number}
 */
const parseRequiredYears = (requiredYearsInput) => {
  if (requiredYearsInput == null || requiredYearsInput === '') return 0;
  
  if (typeof requiredYearsInput === 'string') {
    const lowerInput = requiredYearsInput.toLowerCase();
    
    // Check for months first
    const monthMatch = lowerInput.match(/(\d+)\s*(?:month|months)/);
    if (monthMatch) {
      const months = parseInt(monthMatch[1], 10);
      // Return fractional years (e.g., 6 months = 0.5)
      // Or we can round it. But keeping it as float is fine.
      return months / 12;
    }
    
    // Then check for years
    const yearMatch = lowerInput.match(/(\d+)/);
    if (yearMatch) return parseInt(yearMatch[1], 10);
  } else if (typeof requiredYearsInput === 'number') {
    return requiredYearsInput;
  }
  
  return 0;
};

exports.parseRequiredYears = parseRequiredYears;

/**
 * Computes an experience score scaled from 0-100 based on candidate vs required years.
 * @param {number} candidateYears 
 * @param {number|string} requiredYearsInput - e.g. 5, "5", "3-5"
 * @returns {number} Score from 0 to 100
 */
exports.scoreExperience = (candidateYears, requiredYearsInput) => {
  if (requiredYearsInput == null || requiredYearsInput === '') return 100; // No requirement = perfect score

  const requiredYears = parseRequiredYears(requiredYearsInput);

  if (requiredYears === 0) return 100;

  if (candidateYears >= requiredYears) {
    return 100; // full score
  }

  const gap = requiredYears - candidateYears;
  if (gap <= 2 && gap > 0) {
    return 50; // slightly less -> partial score
  }

  return 0; // much less -> low score
};
