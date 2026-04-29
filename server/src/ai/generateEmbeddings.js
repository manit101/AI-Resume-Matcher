const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const { cleanTextForEmbedding } = require('../utils/textProcessing');

/**
 * Generates vector embeddings for an array of texts using OpenAI.
 * Implements batching to handle larger payloads and reduce API calls.
 * 
 * @param {Array<string>} texts - The array of texts to embed.
 * @returns {Promise<Array<Array<number>>>} - Array of embedding vectors.
 */
exports.generateEmbeddingsBatched = async (texts) => {
  if (!texts || texts.length === 0) return [];

  // Pre-process texts (lowercase, trim, remove extra spaces)
  const cleanedTexts = texts.map(t => cleanTextForEmbedding(t));

  const BATCH_SIZE = 20; // OpenAI allows up to 2048 in a single array, but smaller batches are safer
  const allEmbeddings = [];

  for (let i = 0; i < cleanedTexts.length; i += BATCH_SIZE) {
    const batch = cleanedTexts.slice(i, i + BATCH_SIZE);
    
    // Some texts might be empty after cleaning, handle them safely
    const validBatch = batch.filter(t => t.length > 0);
    if (validBatch.length === 0) {
      allEmbeddings.push(...batch.map(() => null));
      continue;
    }

    try {
      const response = await openai.embeddings.create({
        model: 'text-embedding-3-small', // Defaulting to the newer, cheaper model
        input: validBatch,
      });

      // Map back embeddings to their original positions in the batch
      let validIndex = 0;
      for (const text of batch) {
        if (text.length > 0) {
          allEmbeddings.push(response.data[validIndex].embedding);
          validIndex++;
        } else {
          allEmbeddings.push(null); // Return null for empty texts
        }
      }
    } catch (error) {
      console.error("OpenAI Embedding generation failed for batch:", error);
      throw error;
    }
  }

  return allEmbeddings;
};
