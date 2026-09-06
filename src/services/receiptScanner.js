import * as FileSystem from 'expo-file-system/legacy';
import { EXPENSE_CATEGORIES, detectCategory } from '../utils/categories';
import { getFriendlyErrorMessage } from '../utils/errorHandler';

/**
 * Helper to fetch with an AbortController timeout
 */
export const fetchWithTimeout = async (url, options = {}, timeoutMs = 30000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    if (err.name === 'AbortError') {
      throw new Error(`Request timeout (${timeoutMs / 1000}s)`);
    }
    throw err;
  }
};

export const CANDIDATE_MODELS = [
  'gemini-3.6-flash-lite',
  'gemini-3.6-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
  'gemini-1.5-flash-8b',
  'gemini-1.5-flash',
];

/**
 * Dynamically fetch all active generateContent models for this specific API key
 * @param {string} apiKey 
 * @returns {Promise<string[]>}
 */
export const getAvailableGeminiModels = async (apiKey) => {
  if (!apiKey || !apiKey.trim()) return CANDIDATE_MODELS;

  try {
    const res = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`,
      { method: 'GET' },
      8000
    );
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.models)) {
        const generateModels = data.models
          .filter(
            (m) =>
              Array.isArray(m.supportedGenerationMethods) &&
              m.supportedGenerationMethods.includes('generateContent')
          )
          .map((m) => m.name.replace(/^models\//, ''));

        console.log('[Gemini Models] Discovered API models for key:', generateModels);
        if (generateModels.length > 0) {
          // Prioritize by candidate precedence (gemini-3.6-flash first)
          const prioritized = [];
          for (const cand of CANDIDATE_MODELS) {
            const match = generateModels.find((m) => m.toLowerCase() === cand.toLowerCase());
            if (match && !prioritized.includes(match)) {
              prioritized.push(match);
            }
          }
          // Append any other discovered models
          generateModels.forEach((m) => {
            if (!prioritized.includes(m)) {
              prioritized.push(m);
            }
          });
          return prioritized;
        }
      }
    }
  } catch (e) {
    console.warn('[Gemini Models] Models lookup error:', e.message);
  }
  return CANDIDATE_MODELS;
};

/**
 * Validate Gemini API key by making a lightweight request
 * @param {string} apiKey 
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const validateGeminiKey = async (apiKey) => {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 10) {
    console.error('[Gemini Validation] Key format invalid');
    return { success: false, message: 'Format API key tidak valid' };
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`;
    console.log('[Gemini Validation] Querying Google AI models list endpoint...');
    const response = await fetchWithTimeout(url, { method: 'GET' }, 10000);
    const data = await response.json();
    console.log('[Gemini Validation] HTTP response status:', response.status);

    if (response.ok && data.models) {
      console.log('[Gemini Validation] Key validation SUCCESS! Found models count:', data.models.length);
      return { success: true, message: 'API Key valid dan terhubung!' };
    }

    const rawErrMsg = data?.error?.message || 'API Key tidak valid atau dinonaktifkan';
    console.warn('[Gemini Validation] Key validation FAILED:', rawErrMsg);
    return { success: false, message: getFriendlyErrorMessage(rawErrMsg, 'general', true) };
  } catch (err) {
    console.error('[Gemini Validation] Error validating Gemini key:', err.message);
    return { success: false, message: getFriendlyErrorMessage(err, 'general', true) };
  }
};

/**
 * Resilient JSON Parser & Salvager for AI Receipt Extraction
 * Recovers core transaction fields even if receipt items are truncated.
 * @param {string} rawText 
 * @returns {Object|null}
 */
export const repairAndParseReceiptJson = (rawText) => {
  if (!rawText || typeof rawText !== 'string') return null;

  // 1. Clean markdown code blocks
  const clean = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();

  // 2. Direct Parse
  try {
    return JSON.parse(clean);
  } catch (_) {}

  // 3. Attempt structural repair on truncated JSON (e.g. cut off at "items":)
  try {
    let fixed = clean;
    // Remove unclosed trailing key or dangling colon/comma
    fixed = fixed.replace(/,\s*"[^"]*":?\s*$/g, '');
    fixed = fixed.replace(/,\s*$/g, '');

    // Close open square brackets
    const openBrackets = (fixed.match(/\[/g) || []).length;
    const closeBrackets = (fixed.match(/\]/g) || []).length;
    if (openBrackets > closeBrackets) {
      fixed += ']'.repeat(openBrackets - closeBrackets);
    }

    // Close open curly braces
    const openBraces = (fixed.match(/\{/g) || []).length;
    const closeBraces = (fixed.match(/\}/g) || []).length;
    if (openBraces > closeBraces) {
      fixed += '}'.repeat(openBraces - closeBraces);
    }

    const repaired = JSON.parse(fixed);
    if (repaired && (repaired.merchant || repaired.totalAmount)) {
      console.log('[Gemini Scan] Structural JSON repair SUCCESS!');
      return repaired;
    }
  } catch (_) {}

  // 4. Regex extraction fallback
  try {
    const merchantMatch = clean.match(/"merchant"\s*:\s*"([^"]+)"/i);
    const dateMatch = clean.match(/"date"\s*:\s*"([^"]+)"/i);
    const totalMatch = clean.match(/"totalAmount"\s*:\s*(\d+)/i) || clean.match(/"total"\s*:\s*(\d+)/i);
    const categoryMatch = clean.match(/"categoryId"\s*:\s*"([^"]+)"/i);
    const typeMatch = clean.match(/"type"\s*:\s*"([^"]+)"/i);

    if (merchantMatch || totalMatch) {
      console.log('[Gemini Scan] Regex JSON recovery SUCCESS!');
      return {
        merchant: merchantMatch ? merchantMatch[1] : 'Struk Belanja',
        date: dateMatch ? dateMatch[1] : new Date().toISOString().split('T')[0],
        totalAmount: totalMatch ? parseInt(totalMatch[1], 10) : 0,
        type: typeMatch ? typeMatch[1] : 'expense',
        categoryId: categoryMatch ? categoryMatch[1] : 'other_expense',
        items: [],
      };
    }
  } catch (_) {}

  return null;
};

/**
 * Scan and extract structured financial data from receipt image using Gemini Vision AI
 * @param {string} imageUri - Local file URI of the image
 * @param {string} apiKey - Google Gemini API Key
 * @returns {Promise<{merchant: string, date: string, totalAmount: number, type: string, categoryId: string, categoryName: string, items: Array, notes: string}>}
 */
export const scanReceiptWithGemini = async (imageUri, apiKey) => {
  console.log('[Gemini Scan] Starting receipt scan for imageUri:', imageUri);

  if (!apiKey || !apiKey.trim()) {
    console.error('[Gemini Scan] Error: API Key is missing.');
    throw new Error('API Key Gemini belum diatur. Silakan atur di Pengaturan.');
  }

  // 1. Convert Image to Base64
  let base64Data = '';
  try {
    base64Data = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    console.log('[Gemini Scan] Base64 conversion successful. Data length:', base64Data.length);
  } catch (err) {
    console.error('[Gemini Scan] Failed to read image as base64:', err);
    throw new Error('Gagal membaca file gambar struk. Pastikan file gambar dapat diakses.');
  }

  // Determine mime type
  let mimeType = 'image/jpeg';
  if (imageUri.toLowerCase().endsWith('.png')) {
    mimeType = 'image/png';
  } else if (imageUri.toLowerCase().endsWith('.webp')) {
    mimeType = 'image/webp';
  } else if (imageUri.toLowerCase().endsWith('.pdf')) {
    mimeType = 'application/pdf';
  }
  console.log('[Gemini Scan] Detected mimeType:', mimeType);

  // 2. Prepare Prompt with strict schema
  const categoriesListStr = EXPENSE_CATEGORIES.map((c) => `"${c.id}" (${c.name})`).join(', ');

  const systemPrompt = `Anda adalah asisten keuangan pintar dan ahli pembaca struk / invoice belanja (Indonesia & Internasional).
Analisis gambar struk/nota/invoice berikut dan ekstrak data finansialnya ke dalam format JSON murni TANPA markdown backticks atau penjelasan apapun.

Daftar categoryId yang diizinkan: [${categoriesListStr}].

Format Output JSON yang WAJIB dipatuhi:
{
  "merchant": "Nama Toko / Brand / Merchant / Platform (contoh: Salford & Co., Indomaret, Alfamart, Tokopedia)",
  "date": "YYYY-MM-DD (tanggal transaksi jika tertera, cth 2022-03-28, atau tanggal hari ini)",
  "totalAmount": 880000 (angka integer total akhir yang harus dibayar / grand total / total invoice, tanpa titik atau koma),
  "type": "expense",
  "categoryId": "shopping", (pilih salah satu categoryId yang paling cocok dari daftar di atas: food, transport, shopping, bills, tech, work, health, education, entertainment, other_expense),
  "items": [
    { "name": "Nama Produk 1", "price": 100000, "qty": 1 },
    { "name": "Nama Produk 2", "price": 200000, "qty": 1 }
  ],
  "tax": 80000,
  "subtotal": 800000,
  "notes": "Ringkasan singkat pembelian atau nomor invoice"
}

Perhatian Khusus:
- Jika ada SUB TOTAL, PAJAK/TAX, dan TOTAL, pastikan totalAmount adalah TOTAL AKHIR (Grand Total) yang dibayarkan.
- Pastikan totalAmount adalah angka murni (number), bukan string.
- HANYA kembalikan JSON valid.`;

  // 3. Dynamically discover supported models for this user's API key
  const availableModels = await getAvailableGeminiModels(apiKey);
  const modelsToTry = Array.from(new Set([...availableModels, ...CANDIDATE_MODELS]));
  console.log('[Gemini Scan] Final models to try queue:', modelsToTry);

  let responseJson = null;
  let lastError = null;

  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  for (const modelName of modelsToTry) {
    const versions = ['v1beta', 'v1'];

    for (const ver of versions) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/${ver}/models/${modelName}:generateContent?key=${apiKey.trim()}`;
        console.log(`[Gemini Scan] Trying model: ${modelName} (${ver})...`);

        let reqBody = {
          contents: [
            {
              parts: [
                { text: systemPrompt },
                {
                  inlineData: {
                    mimeType,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 4096,
            responseMimeType: 'application/json',
          },
        };

        // Reliable 30s timeout
        let response = await fetchWithTimeout(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reqBody),
        }, 30000);

        console.log(`[Gemini Scan] ${modelName} (${ver}) Response HTTP status:`, response.status);

        // Handle Rate Limit (HTTP 429) with Exponential Backoff Retry
        if (response.status === 429) {
          console.warn(`[Gemini Scan] Model ${modelName} (${ver}) hit Rate Limit (429). Retrying after backoff delay...`);
          await sleep(2500);
          response = await fetchWithTimeout(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reqBody),
          }, 30000);
          console.log(`[Gemini Scan] ${modelName} (${ver}) Backoff retry HTTP status:`, response.status);
        }

        // If responseMimeType fails with 400 Bad Request, retry without responseMimeType
        if (!response.ok && response.status === 400) {
          console.log(`[Gemini Scan] Retrying ${modelName} (${ver}) without responseMimeType...`);
          reqBody = {
            contents: [
              {
                parts: [
                  { text: systemPrompt + '\nKembalikan output murni dalam format JSON.' },
                  {
                    inlineData: {
                      mimeType,
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 4096,
            },
          };
          response = await fetchWithTimeout(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reqBody),
          }, 30000);
          console.log(`[Gemini Scan] Retry status without responseMimeType:`, response.status);
        }

        const resData = await response.json();

        if (response.ok && resData?.candidates?.[0]?.content?.parts?.[0]?.text) {
          console.log(`[Gemini Scan] SUCCESS with model ${modelName} (${ver})!`);
          responseJson = resData;
          break;
        } else {
          const apiErr = resData?.error;
          console.warn(`[Gemini Scan] Model ${modelName} (${ver}) failed:`, apiErr || resData);
          lastError = apiErr?.message || `Model ${modelName} status ${response.status}`;
          // Continue to try next model in loop
        }
      } catch (err) {
        console.error(`[Gemini Scan] Fetch exception for ${modelName} (${ver}):`, err.message);
        lastError = err.message;
        // Continue to try next model in loop
      }
    }

    if (responseJson) {
      break;
    }
  }

  if (!responseJson) {
    const friendlyMsg = getFriendlyErrorMessage(lastError, 'receipt_scan', true);
    throw new Error(friendlyMsg);
  }

  const rawText = responseJson?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('AI tidak dapat membaca teks struk. Pastikan foto struk terang dan jelas.');
  }

  // Parse JSON response with robust recovery
  const parsedData = repairAndParseReceiptJson(rawText);
  if (!parsedData) {
    console.log('JSON Parse error from Gemini response:', rawText);
    throw new Error('AI belum dapat menyusun data struk. Pastikan foto struk terlihat jelas.');
  }

  // Validate and normalize fields
  const normalizedMerchant = parsedData.merchant || 'Struk Belanja';
  const normalizedTotal = typeof parsedData.totalAmount === 'number' ? Math.round(parsedData.totalAmount) : (parseInt(String(parsedData.totalAmount).replace(/\D/g, ''), 10) || 0);
  
  // Validate category
  let matchedCat = EXPENSE_CATEGORIES.find((c) => c.id === parsedData.categoryId);
  if (!matchedCat) {
    matchedCat = detectCategory(normalizedMerchant, 'expense');
  }

  let formattedDate = parsedData.date;
  if (!formattedDate || !/^\d{4}-\d{2}-\d{2}$/.test(formattedDate)) {
    formattedDate = new Date().toISOString().split('T')[0];
  }

  return {
    merchant: normalizedMerchant,
    totalAmount: normalizedTotal,
    date: formattedDate,
    type: 'expense',
    categoryId: matchedCat.id,
    categoryName: matchedCat.name,
    categoryIcon: matchedCat.iconName,
    categoryColor: matchedCat.color,
    items: Array.isArray(parsedData.items) ? parsedData.items : [],
    notes: parsedData.notes || `Scan struk: ${normalizedMerchant}`,
    rawResponse: parsedData,
  };
};

/**
 * Extract text from receipt image using automated OCR
 * @param {string} imageUri 
 * @returns {Promise<string>}
 */
export const extractTextFromImageOcr = async (imageUri) => {
  try {
    const base64Data = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    let mimeType = 'image/jpeg';
    if (imageUri.toLowerCase().endsWith('.png')) mimeType = 'image/png';
    else if (imageUri.toLowerCase().endsWith('.webp')) mimeType = 'image/webp';

    const formData = new FormData();
    formData.append('base64Image', `data:${mimeType};base64,${base64Data}`);
    formData.append('language', 'eng');
    formData.append('isOverlayRequired', 'false');
    formData.append('detectOrientation', 'true');
    formData.append('scale', 'true');
    formData.append('OCREngine', '2');

    const response = await fetch('https://api.ocr.space/parse/image', {
      method: 'POST',
      headers: {
        apikey: 'K88924294888957',
      },
      body: formData,
    });

    if (response.ok) {
      const data = await response.json();
      const parsedText = data?.ParsedResults?.[0]?.ParsedText;
      if (parsedText && parsedText.trim().length > 0) {
        return parsedText;
      }
    }
  } catch (err) {
    console.log('OCR Error:', err);
  }
  return '';
};

const INDO_MONTHS = {
  januari: '01', jan: '01',
  februari: '02', feb: '02',
  maret: '03', mar: '03',
  april: '04', apr: '04',
  mei: '05', may: '05',
  juni: '06', jun: '06',
  juli: '07', jul: '07',
  agustus: '08', agu: '08', ags: '08', aug: '08',
  september: '09', sep: '09',
  oktober: '10', okt: '10', oct: '10',
  november: '11', nov: '11',
  desember: '12', des: '12', dec: '12',
};

/**
 * DaLay Automated OCR Receipt Parser
 * Parses recognized text or extracts text via OCR from receipt image automatically
 * @param {Object} options - { rawText, imageUri }
 * @returns {Promise<Object>} Extracted transaction data
 */
export const scanReceiptOffline = async ({ rawText = '', imageUri = null }) => {
  let extractedText = rawText;

  if (!extractedText && imageUri) {
    extractedText = await extractTextFromImageOcr(imageUri);
  }

  let merchant = '';
  let totalAmount = 0;
  let detectedDate = new Date().toISOString().split('T')[0];
  const items = [];

  if (extractedText && typeof extractedText === 'string') {
    const lines = extractedText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const fullUpperText = extractedText.toUpperCase();

    // 1. Detect Merchant Name (Key retail brand check)
    if (fullUpperText.includes('INDOMARET') || fullUpperText.includes('INDOMARCO')) {
      merchant = 'Indomaret';
    } else if (fullUpperText.includes('ALFAMART') || fullUpperText.includes('SUMBER ALFARIA')) {
      merchant = 'Alfamart';
    } else if (fullUpperText.includes('TRANSMRT') || fullUpperText.includes('TRANSMART')) {
      merchant = 'Transmart';
    } else if (fullUpperText.includes('SUPERINDO')) {
      merchant = 'Superindo';
    } else {
      const ignoreHeaders = [
        'invoice', 'receipt', 'nota', 'struk', 'tagihan', 'kepada', 'tanggal',
        'no invoice', 'no.', 'cash receipt', 'bill', 'customer', 'alamat', 'keterangan',
        'pt ', 'jl.', 'jlancol', 'npwp', 'rt ', 'rw ', 'kab ', 'kec ', 'sleman', 'jakarta'
      ];
      for (const line of lines.slice(0, 10)) {
        const lower = line.toLowerCase();
        const isIgnored = ignoreHeaders.some((h) => lower.includes(h) || lower.startsWith(h + ':'));
        if (!isIgnored && line.length >= 3 && !/^\d+$/.test(line) && !line.includes('@') && !/^\d{2}\.\d{2}/.test(line)) {
          merchant = line.replace(/[:_#]/g, '').replace(/\s+[A-Z]$/, '').trim();
          break;
        }
      }
    }

    // 2. Detect Date
    for (const line of lines) {
      const indoDateMatch = line.match(/(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})/i);
      if (indoDateMatch) {
        const d = String(indoDateMatch[1]).padStart(2, '0');
        const mStr = indoDateMatch[2].toLowerCase();
        const y = indoDateMatch[3];
        const m = INDO_MONTHS[mStr];
        if (m) {
          detectedDate = `${y}-${m}-${d}`;
          break;
        }
      }

      const slashDateMatch = line.match(/(\d{1,2})[/\.\-](\d{1,2})[/\.\-](\d{2,4})/);
      if (slashDateMatch) {
        const d = String(slashDateMatch[1]).padStart(2, '0');
        const m = String(slashDateMatch[2]).padStart(2, '0');
        let y = slashDateMatch[3];
        if (y.length === 2) y = '20' + y;
        detectedDate = `${y}-${m}-${d}`;
        break;
      }
    }

    // 3. Detect Grand Total (Harga Jual / Total Bayar / Grand Total)
    const grandTotalRegex = /(?:^|\b)(?:harga\s*jual|grand\s*total|total\s*akhir|total\s*bayar|total\s*belanja|total\s*tagihan|net\s*total|total)[\s:]*(?:rp\.?\s*)?([\d.,]+)/i;
    for (const line of lines) {
      const lower = line.toLowerCase();
      const isSubtotalOrCancel = /cancel|voucher|diskon|discount|pajak|tax|sub\s*total/i.test(lower);
      if (!isSubtotalOrCancel) {
        const match = line.match(grandTotalRegex);
        if (match) {
          const rawNum = match[1].replace(/\D/g, '');
          const val = Number.parseInt(rawNum, 10);
          if (val > 0 && val < 100000000) {
            totalAmount = val;
            break;
          }
        }
      }
    }

    // 4. Retail Line-Item Parsing
    const nonProductKeywords = [
      'total', 'harga jual', 'sub total', 'subtotal', 'pajak', 'tax', 'diskon', 'discount',
      'voucher', 'cancel', 'kembalian', 'bayar', 'tunai', 'pembayaran', 'keterangan', 'harga', 'jml',
      'terimakasih', 'thank you', 'no rek', 'rek', 'kepada', 'tanggal', 'no invoice', 'invoice',
      'pt ', 'indomarco', 'prismatama', 'npwp', 'jl.', 'jlancol', 'rt 0', 'rw 1', 'sleman', 'sukoharjo',
      'ngaglik', 'mindi', 'besi jangkang', '301135', 'ratih', 'customer', 'alamat', 'item', 'qty',
      'deskripsi', 'description', 'unit price', 'amount', 'no.'
    ];

    for (const line of lines) {
      const lower = line.toLowerCase();

      // Skip canceled items or vouchers or headers
      if (lower.includes('cancel') || lower.includes('voucher') || lower.includes('npwp')) continue;

      const isHeaderOrFooter = nonProductKeywords.some((kw) => lower.includes(kw));
      if (isHeaderOrFooter) continue;

      // Skip lines that look like cashier codes or timestamps (e.g., 2.1.27 or 16.06.18-17:08)
      if (/^\d{1,2}\.\d{1,2}\.\d{1,2}/.test(line) || /^\d{2}\.\d{2}\.\d{2}/.test(line)) continue;

      // Indomaret/Alfamart item format: "ABC ORANGE 525ML 1 13500 13,500" or "KOPIKO 78C 240ML 2 5500 11,000"
      const retailMatch = line.match(/^([a-zA-Z0-9\s/.\-&]{3,35})\s+(\d+)\s+([\d.,]+)(?:\s+([\d.,]+))?$/i);
      if (retailMatch) {
        const rawName = retailMatch[1].trim();
        const qty = Number.parseInt(retailMatch[2], 10) || 1;
        const price1 = Number.parseInt(retailMatch[3].replace(/\D/g, ''), 10) || 0;
        const price2 = retailMatch[4] ? Number.parseInt(retailMatch[4].replace(/\D/g, ''), 10) : 0;

        // Choose valid unit price
        let unitPrice = price1;
        if (price2 > 0 && price1 > 0 && price2 === price1 * qty) {
          unitPrice = price1;
        } else if (price2 > 0 && price1 === 0) {
          unitPrice = price2;
        }

        if (rawName.length >= 3 && unitPrice >= 100 && unitPrice < 50000000) {
          items.push({
            name: rawName,
            price: unitPrice,
            qty,
          });
        }
        continue;
      }

      // Standard table row format: "NAMA_BARANG RP 10.000 1"
      const tableRowMatch = line.match(/^([a-zA-Z\s&/\-]{2,25}?)\s+(?:rp\.?\s*)?([\d.,]+)(?:\s+(\d+))?$/i);
      if (tableRowMatch) {
        const rawName = tableRowMatch[1].trim();
        const price = Number.parseInt(tableRowMatch[2].replace(/\D/g, ''), 10);
        const qty = tableRowMatch[3] ? Number.parseInt(tableRowMatch[3], 10) : 1;

        if (rawName.length >= 2 && price >= 500 && price < 50000000) {
          items.push({
            name: rawName,
            price,
            qty,
          });
        }
      }
    }

    // Recalculate total if totalAmount was not found in headers
    if (totalAmount === 0 && items.length > 0) {
      totalAmount = items.reduce((sum, it) => sum + (it.price * (it.qty || 1)), 0);
    }
  }

  const category = detectCategory((merchant || '') + ' ' + (extractedText || ''), 'expense');

  return {
    merchant: merchant || 'Struk Belanja',
    totalAmount: totalAmount || 0,
    date: detectedDate,
    type: 'expense',
    categoryId: category.id,
    categoryName: category.name,
    categoryIcon: category.iconName,
    categoryColor: category.color,
    items,
    notes: `Otomasi OCR: ${merchant || 'Struk Belanja'}`,
    isOffline: true,
  };
};
