/**
 * Computes the cosine similarity between two vectors.
 * Returns a value between -1 and 1.
 * @param {Array<number>} vecA 
 * @param {Array<number>} vecB 
 * @returns {number}
 */
exports.cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * Computes cosine similarity and scales it to 0-100.
 * @param {Array<number>} vecA 
 * @param {Array<number>} vecB 
 * @returns {number} Score from 0 to 100
 */
exports.cosineSimilarityScaled = (vecA, vecB) => {
  const sim = exports.cosineSimilarity(vecA, vecB);
  // OpenAI text-embedding-3-small vectors are highly clustered.
  // A similarity of < 0.20 is usually completely unrelated.
  // Scale it: (sim - 0.20) / 0.80 * 100
  const scaled = (sim - 0.20) / 0.80;
  return Math.max(0, Math.min(100, scaled * 100));
};
