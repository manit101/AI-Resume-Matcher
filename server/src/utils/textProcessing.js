/**
 * Normalizes text for better embedding generation.
 * - lowercase
 * - trim
 * - remove extra spaces
 * @param {string} text
 * @returns {string}
 */
exports.cleanTextForEmbedding = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' '); // replaces multiple spaces/newlines with a single space
};
