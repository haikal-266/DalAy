/**
 * Utility functions for smart text formatting, paragraph segmenting,
 * and typography adjustments for Quran Ayat & Hadith translations.
 */

const TRANSITION_PATTERN = /^(Dan |Jika |Jikalau |Apabila |Wahai |Maka |Janganlah |Hendaklah |Telah |Barangsiapa |Sesungguhnya |Katakanlah |Adapun |Dan janganlah |Dan persaksikanlah |Dan bertakwalah |Padahal |Sedangkan |Tetapi |Bahkan |Namun |Kemudian |Lalu |Ingatlah |Kecuali |Mereka |Dialah |Hai )/i;

/**
 * Splits a text block into individual sentences by standard punctuation delimiters,
 * including sentences ending inside quotation marks or parentheses (e.g. .", .)", !").
 * @param {string} block
 * @returns {string[]}
 */
const extractSentences = (block) => {
  // Matches punctuation (. ! ? ; :) followed by optional closing quotes/brackets and whitespace
  const pieces = block.split(/([.!?;:][\)\]”"’'»]*\s+)/);
  const sentences = [];
  let buffer = '';

  for (const piece of pieces) {
    if (!piece) continue;
    buffer += piece;
    if (/[.!?;:][\)\]”"’'»]*\s*$/.test(piece)) {
      if (buffer.trim()) {
        sentences.push(buffer.trim());
      }
      buffer = '';
    }
  }

  if (buffer.trim()) {
    sentences.push(buffer.trim());
  }

  return sentences;
};

/**
 * Groups sentences into balanced readable paragraphs.
 * @param {string[]} sentences
 * @param {number} maxParagraphLength
 * @returns {string[]}
 */
const groupSentences = (sentences, maxParagraphLength = 130) => {
  const paragraphs = [];
  let current = '';

  for (const sentence of sentences) {
    if (!current) {
      current = sentence;
      continue;
    }

    const combinedLength = current.length + sentence.length;
    const isTransition = TRANSITION_PATTERN.test(sentence);

    // Break into new paragraph if combined length exceeds threshold
    // or if current has enough substance (>50 chars) and next is a logical transition
    if (combinedLength > maxParagraphLength || (current.length > 50 && isTransition)) {
      paragraphs.push(current.trim());
      current = sentence;
    } else {
      current += ' ' + sentence;
    }
  }

  if (current.trim()) {
    paragraphs.push(current.trim());
  }

  return paragraphs;
};

/**
 * Splits monolithic translation text into comfortable, readable paragraph blocks
 * based on punctuation marks (., !, ?, ;, :) and logical conjunctions.
 *
 * @param {string} rawText - The unformatted raw translation text
 * @param {number} maxParagraphLength - Target max characters before starting a new paragraph (default ~130)
 * @returns {string[]} Array of readable paragraph strings
 */
export const splitIntoReadableParagraphs = (rawText, maxParagraphLength = 130) => {
  if (!rawText || typeof rawText !== 'string') return [];

  const text = rawText.trim();
  if (text.length < 90 && !text.includes('\n')) {
    return [text];
  }

  const rawBlocks = text.split(/\n+/).map((b) => b.trim()).filter(Boolean);
  const result = [];

  for (const block of rawBlocks) {
    if (block.length < 90) {
      result.push(block);
      continue;
    }

    const sentences = extractSentences(block);
    if (sentences.length <= 1) {
      result.push(block);
      continue;
    }

    const grouped = groupSentences(sentences, maxParagraphLength);
    result.push(...grouped);
  }

  return result.length > 0 ? result : [text];
};

/**
 * Calculates optimal line height for a given font size
 * to maximize reading comfort.
 *
 * @param {number} fontSize
 * @returns {number}
 */
export const getOptimalLineHeight = (fontSize = 15) => {
  return Math.round(fontSize * 1.65);
};

export default {
  splitIntoReadableParagraphs,
  getOptimalLineHeight,
};
