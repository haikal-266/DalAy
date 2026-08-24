import { detectCategory } from './categories.js';

/**
 * Natural Language Financial Input Parser
 * Parses strings like:
 * - "makan 5k, bensin 15k"
 * - "nasi padang 25.000\nbayar parkir 3rb\npulsa 50k"
 * - "gaji 8.5jt, freelance web 3jt"
 * 
 * @param {string} input - Raw user input string
 * @param {string} type - 'expense' | 'income'
 * @returns {Array<{id: string, name: string, amount: number, categoryId: string, categoryName: string, categoryIcon: string, categoryColor: string, rawText: string, date: string}>}
 */
export const parseFinancialInput = (input, type = 'expense') => {
  if (!input || typeof input !== 'string' || input.trim() === '') {
    return [];
  }

  // Split by comma or newline
  const rawItems = input
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  const parsedResults = [];

  for (const itemText of rawItems) {
    const parsed = parseSingleItem(itemText, type);
    if (parsed) {
      parsedResults.push(parsed);
    }
  }

  return parsedResults;
};

/**
 * Parse single line / segment
 */
export const parseSingleItem = (text, type = 'expense') => {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();
  if (!trimmed) return null;

  // Regex to extract nominal with optional multiplier (k, rb, ribu, jt, juta, m)
  // Supports: "5k", "15rb", "25.000", "25,000", "1.5jt", "1,5 juta", "50000", "Rp 50.000", "Rp. 50k"
  const priceRegex = /(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(k|rb|ribu|jt|juta|m|milyar)?\b/i;

  // Find all matches for price in the text
  const match = trimmed.match(priceRegex);

  let amount = 0;
  let title = trimmed;

  if (match) {
    const rawNumberStr = match[1];
    const rawUnit = match[2] ? match[2].toLowerCase() : '';

    // Handle decimal vs thousand separator:
    // If unit is 'k', 'rb', 'ribu', 'jt', 'juta': dot or comma is decimal (e.g. 1.5jt = 1.5 * 1000000)
    // If no unit and has multiple dots/commas or 3 digits after dot (e.g. 25.000): dot is thousand separator
    let baseNumber = 0;

    if (rawUnit === 'k' || rawUnit === 'rb' || rawUnit === 'ribu') {
      baseNumber = parseFloat(rawNumberStr.replace(',', '.')) * 1_000;
    } else if (rawUnit === 'jt' || rawUnit === 'juta') {
      baseNumber = parseFloat(rawNumberStr.replace(',', '.')) * 1_000_000;
    } else if (rawUnit === 'm' || rawUnit === 'milyar') {
      baseNumber = parseFloat(rawNumberStr.replace(',', '.')) * 1_000_000_000;
    } else {
      // Plain number without unit
      const normalized = rawNumberStr.replace(/[.,]/g, '');
      baseNumber = parseInt(normalized, 10) || 0;
    }

    amount = Math.round(baseNumber);

    // Remove price substring from text to get clean item title
    title = trimmed.replace(match[0], '').trim();

    // Clean leading/trailing punctuation or prefixes like "beli", "bayar" if empty
    title = title.replace(/^[-:;\s]+|[-:;\s]+$/g, '');
  }

  // If title became empty after removing price, fallback to "Pengeluaran" / "Pemasukan"
  if (!title) {
    title = type === 'expense' ? 'Pengeluaran' : 'Pemasukan';
  }

  // Capitalize first letter of title
  title = title.charAt(0).toUpperCase() + title.slice(1);

  // Auto-detect category
  const category = detectCategory(title, type);

  return {
    id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    type,
    name: title,
    amount,
    categoryId: category.id,
    categoryName: category.name,
    iconName: category.iconName || 'cube',
    iconFamily: category.iconFamily || 'Ionicons',
    categoryColor: category.color,
    categoryBgColor: category.bgColor || '#F1F5F9',
    rawText: trimmed,
    date: new Date().toISOString(),
  };
};

export default {
  parseFinancialInput,
  parseSingleItem,
};
