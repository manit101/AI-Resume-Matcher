/**
 * textOptimizer.js
 * Utility to reduce token usage by stripping unnecessary whitespace and normalizing text before sending to LLM.
 */

exports.optimizeText = (text) => {
  if (!text) return '';
  // Replace multiple newlines, spaces, or tabs with a single space
  return text.replace(/\s+/g, ' ').trim();
};
