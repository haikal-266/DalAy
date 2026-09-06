import { detectCategory } from './categories.js';

/**
 * Escape special regex characters in a string
 */
const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Automatically inserts commas after price/number patterns so multiple items are cleanly separated.
 * 
 * Examples:
 * - "teh hijau 12 ribu bakso 13k kuota 50 ribu" -> "teh hijau 12 ribu, bakso 13k, kuota 50 ribu"
 * - "mie ayam 90k bakso 20 ribu teh 90k" -> "mie ayam 90k, bakso 20 ribu, teh 90k"
 * - "kopi 15rb roti 10k" -> "kopi 15rb, roti 10k"
 */
export const autoInsertCommasAfterPrices = (text) => {
  if (!text || typeof text !== 'string') return '';

  let formatted = text;

  // 1. Regex to match price with unit (e.g. "90k", "20 ribu", "15rb", "1.5jt", "2 juta", "13k") followed by words
  const priceWithUnitRegex = /(\b(?:rp\.?\s*)?\d+(?:[.,]\d+)?\s*(?:k|rb|ribu|jt|juta|m|milyar|miliar)\b)(?!\s*[,.\n])(\s+)(?=[a-zA-Z])/gi;
  formatted = formatted.replace(priceWithUnitRegex, '$1,$2');

  // 2. Regex to match prices formatted with dot thousands separator (e.g. "12.000", "1.500.000", "30.000", "rp11.000", "rp 12.000") followed by words
  const dotPriceRegex = /(\b(?:rp\.?\s*)?\d{1,3}(?:\.\d{3})+(?:,\d+)?\b)(?!\s*[,.\n])(\s+)(?=[a-zA-Z])/gi;
  formatted = formatted.replace(dotPriceRegex, '$1,$2');

  // 3. Regex to match rp-prefixed prices without dots (e.g. "rp11000", "rp 15000", "rp500") followed by words
  const rpPriceRegex = /(\brp\.?\s*\d+\b)(?!\s*[,.\n])(\s+)(?=[a-zA-Z])/gi;
  formatted = formatted.replace(rpPriceRegex, '$1,$2');

  // 4. Regex to match standalone numeric amounts >= 3 digits (e.g. "50000", "12000", "5000", "500") followed by words
  const rawNumberRegex = /(\b\d{3,}\b)(?!\s*[,.\n])(\s+)(?=[a-zA-Z])/gi;
  formatted = formatted.replace(rawNumberRegex, '$1,$2');

  // Clean up any double commas or commas at edges
  formatted = formatted.replace(/,\s*,/g, ', ').trim();
  formatted = formatted.replace(/^,|,$/g, '').trim();

  return formatted;
};

/**
 * Detects if a wallet is mentioned at the tail/end of the spoken sentence.
 * Returns the matched wallet, walletId, walletName, and the remaining item text without the tail wallet.
 * 
 * Example:
 * - "teh hijau 12 ribu, bakso 13k, kuota 50 ribu rekening bank"
 *   -> matchedWallet: { id: "wallet_bank", name: "Rekening Bank" }, cleanText: "teh hijau 12 ribu, bakso 13k, kuota 50 ribu"
 */
export const extractTailWallet = (text, wallets = [], defaultWalletId = null) => {
  if (!text || typeof text !== 'string') {
    return {
      wallet: null,
      walletId: defaultWalletId || (wallets[0]?.id ?? null),
      walletName: wallets.find((w) => w.id === defaultWalletId)?.name || wallets[0]?.name || '',
      cleanText: text || '',
    };
  }

  let cleanText = text.trim();
  let matchedWallet = null;

  if (Array.isArray(wallets) && wallets.length > 0) {
    // Sort wallets by name length descending so specific names match before shorter ones
    const sortedWallets = [...wallets].sort((a, b) => (b.name?.length || 0) - (a.name?.length || 0));

    // 1. Check if tail matches full wallet name
    for (const wallet of sortedWallets) {
      if (!wallet.name) continue;
      const rawName = wallet.name.toLowerCase().replace(/[\(\)\/]/g, ' ').trim();

      const fullTailRegex = new RegExp(`(?:\\s*(?:bayar\\s+)?(?:pakai|pake|dari|ke|di|lewat|via|dengan)?\\s*)?\\b${escapeRegex(rawName)}\\b[.:;,\\s]*$`, 'i');
      if (fullTailRegex.test(cleanText)) {
        matchedWallet = wallet;
        cleanText = cleanText.replace(fullTailRegex, '').trim();
        break;
      }

      // Check significant individual tokens at tail (e.g. "bank", "bca", "tunai", "cash", "gopay")
      const tokens = rawName.split(/\s+/).filter((t) => t.length >= 2);
      for (const token of tokens) {
        if (['rekening', 'dompet', 'wallet', 'akun'].includes(token) && tokens.length > 1) {
          continue;
        }
        const tokenTailRegex = new RegExp(`(?:\\s*(?:bayar\\s+)?(?:pakai|pake|dari|ke|di|lewat|via|dengan)?\\s*)?\\b${escapeRegex(token)}\\b[.:;,\\s]*$`, 'i');
        if (tokenTailRegex.test(cleanText)) {
          matchedWallet = wallet;
          cleanText = cleanText.replace(tokenTailRegex, '').trim();
          break;
        }
      }

      if (matchedWallet) break;
    }

    // 2. Generic Tail Aliases (e.g. "rekening bank", "rekening bang", "rekening", "bank", "bang", "tunai", "gopay")
    if (!matchedWallet) {
      const genericTailMatches = [
        { regex: /(?:\s*(?:bayar\s+)?(?:pakai|pake|di|via|ke)?\s*)?\b(?:rekening\s*bank|rekening\s*bang|rekening|bank|bang)\b[.:;,\s]*$/i, type: 'bank' },
        { regex: /(?:\s*(?:bayar\s+)?(?:pakai|pake|di|via|ke)?\s*)?\b(?:tunai|cash|uang\s*tunai)\b[.:;,\s]*$/i, type: 'cash' },
        { regex: /(?:\s*(?:bayar\s+)?(?:pakai|pake|di|via|ke)?\s*)?\b(?:gopay|ovo|dana|shopeepay|qris|ewallet|e-wallet)\b[.:;,\s]*$/i, type: 'ewallet' },
      ];

      for (const g of genericTailMatches) {
        if (g.regex.test(cleanText)) {
          const found = wallets.find((w) => {
            const wName = (w.name || '').toLowerCase();
            const wType = (w.type || '').toLowerCase();
            if (g.type === 'bank' && (wType === 'bank' || /bank|bca|mandiri|bri|bni|jago|seabank|rekening/.test(wName))) return true;
            if (g.type === 'cash' && (wType === 'cash' || /tunai|cash|dompet/.test(wName))) return true;
            if (g.type === 'ewallet' && (wType === 'ewallet' || /gopay|ovo|dana|shopee|qris|wallet/.test(wName))) return true;
            return false;
          });

          if (found) {
            matchedWallet = found;
            cleanText = cleanText.replace(g.regex, '').trim();
            break;
          }
        }
      }
    }
  }

  // Clean trailing punctuation left behind after removing tail wallet
  cleanText = cleanText.replace(/[,;.:\s]+$/, '').trim();

  const resolvedWalletId = matchedWallet?.id || defaultWalletId || wallets[0]?.id || null;
  const resolvedWalletName = matchedWallet?.name || wallets.find((w) => w.id === resolvedWalletId)?.name || '';

  return {
    wallet: matchedWallet || wallets.find((w) => w.id === resolvedWalletId) || null,
    walletId: resolvedWalletId,
    walletName: resolvedWalletName,
    cleanText,
  };
};

/**
 * Detects if any known wallet name exists in the text.
 */
export const detectWalletInText = (text, wallets = [], defaultWalletId = null) => {
  return extractTailWallet(text, wallets, defaultWalletId);
};

/**
 * Converts Indonesian and English spoken number words to digits.
 */
export const convertSpokenNumbersToDigits = (text) => {
  if (!text || typeof text !== 'string') return '';

  let normalized = text.toLowerCase();

  // Normalize spoken conjunctions that separate items
  normalized = normalized.replace(/\s+(?:dan|lalu|kemudian|sama|plus|terus)\s+(?=[a-z0-9])/gi, ', ');

  // Clean "rupiah", "sebesar", "sebanyak"
  normalized = normalized.replace(/\brupiah\b/gi, '');
  normalized = normalized.replace(/\b(?:sebesar|sebanyak|seharga|total|senilai)\b/gi, '');

  // Word number mappings
  const DIGITS = {
    nol: 0,
    kosong: 0,
    zero: 0,
    satu: 1,
    se: 1,
    one: 1,
    dua: 2,
    two: 2,
    tiga: 3,
    three: 3,
    empat: 4,
    four: 4,
    lima: 5,
    five: 5,
    enam: 6,
    six: 6,
    tujuh: 7,
    seven: 7,
    delapan: 8,
    eight: 8,
    sembilan: 9,
    nine: 9,
    sepuluh: 10,
    ten: 10,
    sebelas: 11,
    eleven: 11,
    twelve: 12,
    thirteen: 13,
    fourteen: 14,
    fifteen: 15,
    sixteen: 16,
    seventeen: 17,
    eighteen: 18,
    nineteen: 19,
    twenty: 20,
    thirty: 30,
    forty: 40,
    fifty: 50,
    sixty: 60,
    seventy: 70,
    eighty: 80,
    ninety: 90,
    seratus: 100,
    seribu: 1000,
    sejuta: 1000000,
    setengah: 0.5,
  };

  const evaluateNumberPhrase = (phrase) => {
    const tokens = phrase.trim().split(/\s+/);
    let total = 0;
    let current = 0;
    let hasKoma = false;
    let decimalPart = 0;
    let decimalDivisor = 10;

    for (const token of tokens) {
      if (/^\d+(?:[.,]\d+)?(?:k|rb|ribu|jt|juta|m|milyar)?$/i.test(token)) {
        return phrase;
      }

      if (token === 'koma' || token === 'point' || token === 'dot') {
        hasKoma = true;
        continue;
      }

      if (hasKoma && DIGITS[token] !== undefined) {
        decimalPart += DIGITS[token] / decimalDivisor;
        decimalDivisor *= 10;
        continue;
      }

      if (token === 'belas') {
        current = (current > 0 ? current : 1) + 10;
      } else if (token === 'puluh') {
        current = (current > 0 ? current : 1) * 10;
      } else if (token === 'ratus' || token === 'hundred') {
        current = (current > 0 ? current : 1) * 100;
      } else if (token === 'ribu' || token === 'rb' || token === 'k' || token === 'thousand') {
        const sub = (current || 1) + decimalPart;
        total += sub * 1000;
        current = 0;
        decimalPart = 0;
        hasKoma = false;
      } else if (token === 'juta' || token === 'jt' || token === 'million') {
        const sub = (current || 1) + decimalPart;
        total += sub * 1000000;
        current = 0;
        decimalPart = 0;
        hasKoma = false;
      } else if (token === 'milyar' || token === 'miliar' || token === 'billion') {
        const sub = (current || 1) + decimalPart;
        total += sub * 1000000000;
        current = 0;
        decimalPart = 0;
        hasKoma = false;
      } else if (DIGITS[token] !== undefined) {
        current += DIGITS[token];
      } else if (/^\d+$/.test(token)) {
        current += Number.parseInt(token, 10);
      }
    }

    const result = total + current + decimalPart;
    return result > 0 ? Math.round(result).toString() : phrase;
  };

  const spokenSeqRegex = /\b(?:(?:nol|kosong|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|sepuluh|sebelas|seratus|seribu|sejuta|setengah|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|\d+)(?:\s+(?:koma|point|dot|\d+|nol|kosong|satu|dua|tiga|empat|lima|enam|tujuh|delapan|sembilan|belas|puluh|ratus|ribu|rb|k|juta|jt|milyar|miliar|hundred|thousand|million))+)\b/gi;

  normalized = normalized.replace(spokenSeqRegex, (match) => {
    const val = evaluateNumberPhrase(match);
    return val || match;
  });

  normalized = normalized.replace(/(\d+(?:[.,]\d+)?)\s*(?:ribu|rb|k)\b/gi, (_, num) => {
    const parsed = Number.parseFloat(num.replace(',', '.'));
    return Math.round(parsed * 1000).toString();
  });
  normalized = normalized.replace(/(\d+(?:[.,]\d+)?)\s*(?:juta|jt)\b/gi, (_, num) => {
    const parsed = Number.parseFloat(num.replace(',', '.'));
    return Math.round(parsed * 1000000).toString();
  });
  normalized = normalized.replace(/(\d+(?:[.,]\d+)?)\s*(?:milyar|miliar)\b/gi, (_, num) => {
    const parsed = Number.parseFloat(num.replace(',', '.'));
    return Math.round(parsed * 1000000000).toString();
  });

  normalized = normalized.replace(/\bseratus\s*ribu\b/gi, '100000');
  normalized = normalized.replace(/\bseribu\b/gi, '1000');
  normalized = normalized.replace(/\bsejuta\b/gi, '1000000');

  return normalized.trim();
};

/**
 * Detects whether the input text specifies income or expense (pemasukan vs pengeluaran).
 * Works regardless of whether the user speaks it at the beginning, middle, or end of dialog.
 * Returns the detected type ('income' | 'expense') and the text stripped of the directive keywords.
 * 
 * Examples:
 * - "Pemasukan gaji 5jt bca" -> type: 'income', cleanText: 'gaji 5jt bca'
 * - "Mie ayam 20k bca pengeluaran" -> type: 'expense', cleanText: 'Mie ayam 20k bca'
 * - "Catat uang masuk freelance 1.5jt" -> type: 'income', cleanText: 'freelance 1.5jt'
 * - "Uang keluar beli bensin 20k" -> type: 'expense', cleanText: 'beli bensin 20k'
 */
export const extractTypeDirective = (text, defaultType = 'expense') => {
  if (!text || typeof text !== 'string') {
    return { type: defaultType, cleanText: '' };
  }

  let cleanText = text.trim();
  let detectedType = defaultType;

  // Keyword patterns for Income
  const incomeDirectiveRegex = /\b(?:catat\s+)?(?:pemasukan|uang\s*masuk|income|penghasilan|penerimaan|dana\s*masuk|masuk|terima\s*uang)\b[:\s-]*/gi;

  // Keyword patterns for Expense
  const expenseDirectiveRegex = /\b(?:catat\s+)?(?:pengeluaran|uang\s*keluar|expense|biaya|keluar)\b[:\s-]*/gi;

  const hasIncome = incomeDirectiveRegex.test(cleanText);
  incomeDirectiveRegex.lastIndex = 0;

  const hasExpense = expenseDirectiveRegex.test(cleanText);
  expenseDirectiveRegex.lastIndex = 0;

  if (hasIncome && !hasExpense) {
    detectedType = 'income';
    cleanText = cleanText.replace(incomeDirectiveRegex, ' ').trim();
  } else if (hasExpense && !hasIncome) {
    detectedType = 'expense';
    cleanText = cleanText.replace(expenseDirectiveRegex, ' ').trim();
  } else if (hasIncome && hasExpense) {
    const incomeIdx = text.toLowerCase().search(incomeDirectiveRegex);
    const expenseIdx = text.toLowerCase().search(expenseDirectiveRegex);
    if (incomeIdx !== -1 && (expenseIdx === -1 || incomeIdx < expenseIdx)) {
      detectedType = 'income';
      cleanText = cleanText.replace(incomeDirectiveRegex, ' ').trim();
    } else {
      detectedType = 'expense';
      cleanText = cleanText.replace(expenseDirectiveRegex, ' ').trim();
    }
  }

  // Clean remaining spaces and edge punctuation
  cleanText = cleanText.replace(/\s+/g, ' ').replace(/^[,:;\s]+|[,:;\s]+$/g, '').trim();

  return {
    type: detectedType,
    cleanText,
  };
};

/**
 * Natural Language Financial Input Parser
 * Automatically detects income vs expense directive, extracts tail wallet, auto-inserts commas after prices,
 * and separates multi-item inputs into individual transactions.
 * 
 * Example:
 * - "pemasukan gaji 5jt, freelance 1.5jt bca"
 *   -> 2 income items (Gaji Rp 5.000.000, Freelance Rp 1.500.000) tagged to "BCA"
 */
export const parseFinancialInput = (input, defaultType = 'expense', wallets = [], defaultWalletId = null) => {
  if (!input || typeof input !== 'string' || input.trim() === '') {
    return [];
  }

  // 1. Detect and extract income/expense directive (pemasukan vs pengeluaran)
  const { type, cleanText: textAfterType } = extractTypeDirective(input, defaultType);

  // 2. Detect and extract tail wallet
  const { walletId, walletName, cleanText } = extractTailWallet(textAfterType, wallets, defaultWalletId);

  // 3. Pre-process spoken numbers into digits
  const preprocessed = convertSpokenNumbersToDigits(cleanText);

  // 4. Automatically insert commas after price patterns to separate multiple products
  const commaSeparated = autoInsertCommasAfterPrices(preprocessed);

  // 5. Split items by comma or newline
  const rawItems = commaSeparated
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  const parsedResults = [];

  for (const itemText of rawItems) {
    const parsed = parseSingleItem(itemText, type, wallets, walletId, walletName);
    if (parsed && parsed.amount > 0) {
      parsedResults.push(parsed);
    }
  }

  return parsedResults;
};

/**
 * Parse single line / segment with category detection
 */
export const parseSingleItem = (
  text,
  type = 'expense',
  wallets = [],
  explicitWalletId = null,
  explicitWalletName = null
) => {
  if (!text || typeof text !== 'string') return null;
  let trimmed = text.trim();
  if (!trimmed) return null;

  let resolvedWalletId = explicitWalletId;
  let resolvedWalletName = explicitWalletName;

  // If wallet wasn't provided from tail extraction, check within item
  if (!resolvedWalletId) {
    const walletResult = extractTailWallet(trimmed, wallets, explicitWalletId);
    trimmed = walletResult.cleanText;
    resolvedWalletId = walletResult.walletId;
    resolvedWalletName = walletResult.walletName;
  }

  // Regex to extract nominal with optional multiplier (k, rb, ribu, jt, juta, m)
  const priceRegex = /(?:rp\.?\s*)?(\d+(?:[.,]\d+)*)\s*(k|rb|ribu|jt|juta|m|milyar)?\b/i;
  const match = trimmed.match(priceRegex);

  let amount = 0;
  let title = trimmed;

  if (match) {
    const rawNumberStr = match[1];
    const rawUnit = match[2] ? match[2].toLowerCase() : '';

    let baseNumber = 0;
    if (rawUnit === 'k' || rawUnit === 'rb' || rawUnit === 'ribu') {
      baseNumber = Number.parseFloat(rawNumberStr.replace(',', '.')) * 1_000;
    } else if (rawUnit === 'jt' || rawUnit === 'juta') {
      baseNumber = Number.parseFloat(rawNumberStr.replace(',', '.')) * 1_000_000;
    } else if (rawUnit === 'm' || rawUnit === 'milyar') {
      baseNumber = Number.parseFloat(rawNumberStr.replace(',', '.')) * 1_000_000_000;
    } else {
      const normalized = rawNumberStr.replace(/[.,]/g, '');
      baseNumber = Number.parseInt(normalized, 10) || 0;
    }

    amount = Math.round(baseNumber);

    // Remove price substring from text to get clean item title
    title = trimmed.replace(match[0], '').trim();

    // Clean leading/trailing punctuation or prefixes like "beli", "bayar"
    title = title.replace(/^[-:;.,\/\s]+|[-:;.,\/\s]+$/g, '');
    title = title.replace(/^(?:beli|bayar|pesan|jajan|buat|untuk)\s+/i, '');
  }

  // Clean remaining punctuation
  title = title.replace(/^[-:;.,\/\s]+|[-:;.,\/\s]+$/g, '').trim();

  // Fallback title if empty
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
    walletId: resolvedWalletId || wallets[0]?.id || null,
    walletName: resolvedWalletName || wallets[0]?.name || '',
    categoryId: category.id,
    categoryName: category.name,
    iconName: category.iconName || 'cube',
    iconFamily: category.iconFamily || 'Ionicons',
    categoryColor: category.color,
    categoryBgColor: category.bgColor || '#F1F5F9',
    rawText: text.trim(),
    date: new Date().toISOString(),
  };
};

export default {
  extractTailWallet,
  detectWalletInText,
  convertSpokenNumbersToDigits,
  autoInsertCommasAfterPrices,
  parseFinancialInput,
  parseSingleItem,
};
