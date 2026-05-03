/**
 * textOptimizer.js
 * Utility to reduce token usage by stripping unnecessary whitespace while preserving structure.
 * Maintains line breaks and document hierarchy for better LLM parsing.
 */

exports.optimizeText = (text) => {
  if (!text) return '';
  
  // Split by lines to preserve document structure
  const lines = text.split('\n');
  
  // Process each line: remove extra spaces/tabs but keep line breaks
  const cleanedLines = lines
    .map(line => line.replace(/\s+/g, ' ').trim()) // Normalize spaces within lines
    .filter(line => line.length > 0); // Remove empty lines
  
  // Rejoin with newlines to preserve structure
  return cleanedLines.join('\n');
};
