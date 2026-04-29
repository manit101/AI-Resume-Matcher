/**
 * Compares a parsed resume against a parsed job description.
 * @param {Object} parsedResume
 * @param {Object} parsedJD
 * @returns {Promise<Object>}
 */
exports.calculateMatch = async (parsedResume, parsedJD) => {
  // TODO: Implement cosine similarity using embeddings or direct OpenAI prompt
  // Needs to return: score, explanation, matchedSkills, missingSkills, experienceGap
  
  return {
    score: 85.5,
    explanation: "Candidate has strong React experience but lacks deep AWS knowledge.",
    matchedSkills: ["React", "Node.js", "Express"],
    missingSkills: ["AWS", "Docker"],
    experienceGap: "Candidate has 5 years overall, meeting the 3-year requirement."
  };
};
