/**
 * aiFinancialReport.js
 * AI & Expert-Backed Financial Insight Service for DalAy PDF Reports
 * 
 * Generates concise analytical insights and trustworthy financial principles
 * citing reputable books, journals, economists, and regulatory benchmarks.
 */

import { formatRupiah } from '../utils/formatters';
import { getAvailableGeminiModels, CANDIDATE_MODELS, fetchWithTimeout } from './receiptScanner';

export const CURATED_EXPERT_CITATIONS = [
  {
    author: 'Morgan Housel',
    source: 'The Psychology of Money (2020)',
    quoteId: 'Mengelola uang dengan baik bukan hanya soal seberapa pintar Anda, melainkan tentang bagaimana perilaku Anda sehari-hari mengendalikan impuls belanja.',
    quoteEn: 'Doing well with money has a little to do with how smart you are and a lot to do with how you behave.',
    category: 'behavioral',
  },
  {
    author: 'Prof. Elizabeth Warren',
    source: 'Harvard Law School / All Your Worth (2005)',
    quoteId: 'Aturan 50/30/20: Alokasikan 50% pendapatan untuk kebutuhan pokok, 30% untuk keinginan, dan 20% mutlak untuk tabungan serta investasi.',
    quoteEn: 'The 50/30/20 Rule: Allocate 50% of your income to needs, 30% to wants, and 20% strictly to savings and debt repayment.',
    category: 'budgeting',
  },
  {
    author: 'Warren Buffett',
    source: 'Berkshire Hathaway Annual Shareholder Letter',
    quoteId: 'Jangan menabung dari apa yang tersisa setelah berbelanja; sebaliknya, belanjakanlah apa yang tersisa setelah Anda menabung di awal.',
    quoteEn: 'Do not save what is left after spending, but spend what is left after saving.',
    category: 'savings',
  },
  {
    author: 'Daniel Kahneman',
    source: 'Nobel Memorial Prize in Economics / Thinking, Fast and Slow',
    quoteId: 'Waspadai kebiasaan membedakan perlakuan uang: kita cenderung lebih mudah menghabiskan uang tak terduga dibanding uang dari gaji rutin.',
    quoteEn: 'Beware of mental accounting: we tend to treat money differently depending on its origin and intended use, leading to irrational spending.',
    category: 'behavioral',
  },
  {
    author: 'Benjamin Graham',
    source: 'The Intelligent Investor (1949)',
    quoteId: 'Kunci ketahanan finansial terletak pada Margin of Safety (ruang aman): selalu siapkan cadangan uang di atas perkiraan pengeluaran terburuk.',
    quoteEn: 'The secret of financial sound navigation is the Margin of Safety: always keep cash reserves exceeding worst-case projections.',
    category: 'risk',
  },
  {
    author: 'Otoritas Jasa Keuangan (OJK RI)',
    source: 'Panduan Perencanaan Keuangan Sehat (2023)',
    quoteId: 'Fondasi keuangan yang sehat mensyaratkan dana darurat likuid minimal 3 hingga 6 kali pengeluaran bulanan sebelum memulai investasi agresif.',
    quoteEn: 'A sound financial foundation requires liquid emergency funds of 3 to 6 months of living expenses before starting aggressive investing.',
    category: 'emergency_fund',
  },
];

/**
 * Generate smart rule-based offline insights based on actual numbers (Without 'POS' or technical jargon)
 */
export const getOfflineSmartInsights = (metrics, isIndonesian = true) => {
  const { totalIncome = 0, totalExpense = 0, balance = 0, topCategory } = metrics;
  const savingsRate = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : (balance >= 0 ? 0 : -100);

  const insights = [];
  let selectedCitation = CURATED_EXPERT_CITATIONS[1];

  if (totalExpense > totalIncome && totalIncome > 0) {
    insights.push(
      isIndonesian
        ? `Bulan ini pengeluaran lebih besar ${formatRupiah(Math.abs(balance))} dibanding pemasukan (selisih ${Math.abs(savingsRate)}%).`
        : `Your expenses exceeded income by ${formatRupiah(Math.abs(balance))} this period (${Math.abs(savingsRate)}% difference).`
    );
    insights.push(
      isIndonesian
        ? `Saran langkah: Tinjau kembali belanjaan sekunder dan tunda belanja non-esensial sampai kondisi keuangan kembali surplus.`
        : `Helpful tip: Review secondary spending categories and pause non-essential purchases until your balance turns positive.`
    );
    selectedCitation = CURATED_EXPERT_CITATIONS.find((c) => c.author === 'Benjamin Graham') || CURATED_EXPERT_CITATIONS[4];
  } else if (savingsRate >= 30) {
    insights.push(
      isIndonesian
        ? `Kondisi keuangan sangat sehat! Anda berhasil menyisihkan ${savingsRate}% dari pemasukan untuk tabungan (melebihi standar ideal 20%).`
        : `Great financial health! You saved ${savingsRate}% of your income, comfortably beating the recommended 20% benchmark.`
    );
    insights.push(
      isIndonesian
        ? `Sisa uang sebesar ${formatRupiah(balance)} siap dialokasikan untuk mempertebal dana darurat atau investasi jangka panjang.`
        : `Your surplus of ${formatRupiah(balance)} is ready to strengthen your emergency fund or long-term investments.`
    );
    selectedCitation = CURATED_EXPERT_CITATIONS.find((c) => c.author === 'Warren Buffett') || CURATED_EXPERT_CITATIONS[2];
  } else if (savingsRate > 0) {
    insights.push(
      isIndonesian
        ? `Arus kas tetap surplus ${formatRupiah(balance)} (${savingsRate}% dari total pemasukan berhasil disisihkan).`
        : `Positive cashflow with a net surplus of ${formatRupiah(balance)} (${savingsRate}% of income saved).`
    );
    insights.push(
      isIndonesian
        ? `Tingkat tabungan Anda sudah bagus dan mendekati 20%. Sedikit efisiensi pada jajan santai akan mempercepat pertumbuhan tabungan.`
        : `Your savings rate is approaching the 20% target. Small tweaks to casual spending will accelerate your savings.`
    );
    selectedCitation = CURATED_EXPERT_CITATIONS.find((c) => c.author === 'Prof. Elizabeth Warren') || CURATED_EXPERT_CITATIONS[1];
  } else {
    insights.push(
      isIndonesian
        ? `Total belanja tercatat sebesar ${formatRupiah(totalExpense)}. Pastikan mencatat pemasukan juga agar perbandingan uang masuk dan keluar terlihat jelas.`
        : `Total recorded spending is ${formatRupiah(totalExpense)}. Be sure to log all income so your balance tracking stays accurate.`
    );
    selectedCitation = CURATED_EXPERT_CITATIONS.find((c) => c.author === 'Morgan Housel') || CURATED_EXPERT_CITATIONS[0];
  }

  if (topCategory && topCategory.percentage >= 35) {
    insights.push(
      isIndonesian
        ? `Kategori belanja "${topCategory.name}" memakan porsi terbesar (${topCategory.percentage}% atau ${formatRupiah(topCategory.amount)}).`
        : `The "${topCategory.name}" category is your largest spending area (${topCategory.percentage}% or ${formatRupiah(topCategory.amount)}).`
    );
  }

  return {
    insights,
    citation: {
      author: selectedCitation.author,
      source: selectedCitation.source,
      quote: isIndonesian ? selectedCitation.quoteId : selectedCitation.quoteEn,
    },
    isAiGenerated: false,
  };
};

/**
 * Safely parse JSON or extract using regex fallback
 */
const safeParseAiJson = (rawText) => {
  if (!rawText || typeof rawText !== 'string') return null;

  let cleaned = rawText
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    cleaned = cleaned.substring(start, end + 1);
  }

  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && Array.isArray(parsed.insights)) {
      return parsed;
    }
  } catch (e) {
    console.warn('[Gemini AI Report] Direct JSON.parse failed, trying regex extraction:', e.message);
  }

  try {
    const insightsMatches = [...cleaned.matchAll(/"([^"\\]*(?:\\.[^"\\]*)*)"/g)]
      .map((m) => m[1])
      .filter((s) => s.length > 25 && !s.includes('insights') && !s.includes('citation'));

    const quoteMatch = cleaned.match(/"quote"\s*:\s*"([^"]+)"/i);
    const authorMatch = cleaned.match(/"author"\s*:\s*"([^"]+)"/i);
    const sourceMatch = cleaned.match(/"source"\s*:\s*"([^"]+)"/i);

    if (insightsMatches.length > 0) {
      return {
        insights: insightsMatches.slice(0, 3),
        citation: {
          author: authorMatch ? authorMatch[1] : 'Pakar Keuangan',
          source: sourceMatch ? sourceMatch[1] : 'Prinsip Finansial Terpercaya',
          quote: quoteMatch ? quoteMatch[1] : 'Kendalikan pengeluaran sebelum pengeluaran mengendalikan hidup Anda.',
        },
      };
    }
  } catch (regexErr) {
    console.warn('[Gemini AI Report] Regex extraction also failed:', regexErr.message);
  }

  return null;
};

/**
 * Request Gemini AI to generate customized concise insights and expert citation
 * Uses the exact same robust endpoint hitting & retry architecture as receiptScanner.js
 */
export const fetchGeminiAiFinancialInsights = async (metrics, apiKey, isIndonesian = true) => {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 10) {
    console.log('[Gemini AI Report] API Key Gemini tidak tersedia/kosong. Menggunakan smart offline engine.');
    return getOfflineSmartInsights(metrics, isIndonesian);
  }

  const {
    totalIncome = 0,
    totalExpense = 0,
    balance = 0,
    topCategory,
    categoryPercentages = [],
    periodLabel = '',
    topTransactions = [],
    transactionsCount = 0,
  } = metrics;

  const savingsRate = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : (balance >= 0 ? 0 : -100);

  const prompt = isIndonesian
    ? `Anda adalah penasihat keuangan pribadi yang bersahabat, santai, dan praktis.
Tugas Anda: Berikan ulasan singkat mengenai situasi keuangan pengguna berdasarkan data angka di bawah ini.

DATA KEUANGAN PENGGUNA:
- Periode: ${periodLabel || 'Periode Berjalan'}
- Pemasukan: ${formatRupiah(totalIncome)}
- Pengeluaran: ${formatRupiah(totalExpense)}
- Sisa Uang / Saldo Bersih: ${formatRupiah(balance)}
- Tingkat Tabungan: ${savingsRate}%
- Total Transaksi: ${transactionsCount} transaksi
- Kategori Belanja Terbesar: ${topCategory ? `${topCategory.name} (${topCategory.percentage}%, senilai ${formatRupiah(topCategory.amount)})` : 'Belum tercatat'}
- Pembagian Kategori: ${categoryPercentages.length > 0 ? categoryPercentages.map((c) => `${c.name}: ${c.percentage}%`).join(', ') : '-'}
${topTransactions.length > 0 ? `- Sampel Belanjaan Terbesar: ${topTransactions.join(', ')}` : ''}

ATURAN GAYA BAHASA & KATA:
1. Gunakan gaya bahasa yang santai, bersahabat, jelas, dan mudah dipahami orang awam. JANGAN gunakan bahasa yang kaku atau terlalu teknis.
2. DILARANG KERAS menggunakan kata "POS" (misal: jangan sebut "pos pengeluaran" atau "pos belanja"). Gunakan istilah umum dan natural seperti "kategori belanja", "pengeluaran", atau "belanjaan".
3. Hindari istilah perbankan/akuntansi yang rumit (hindari kata: "defisit struktural", "amortisasi", "alokasi diskresioner", dll.). Gunakan kata sehari-hari: "uang masuk", "uang keluar", "sisa uang", "tabungan", atau "dana cadangan".
4. Buatlah 3 poin ringkasan yang ramah dan to-the-point (maksimal 2 kalimat per poin):
   - Poin 1: Ulasan santai tentang kondisi uang masuk vs uang keluar serta sisa tabungan.
   - Poin 2: Ulasan tentang belanjaan yang paling banyak memakan biaya dan tips hemat yang realistis.
   - Poin 3: Saran langkah praktis yang bisa dicoba di bulan berikutnya.
5. Berikan 1 kutipan bijak atau kaidah keuangan terpercaya dari tokoh/buku/pakar ternama yang relevan dengan kondisi pengguna.

KEMBALIKAN OUTPUT HANYA DALAM FORMAT JSON VALID BERIKUT:
{
  "insights": [
    "Ulasan 1...",
    "Ulasan 2...",
    "Tips praktis 3..."
  ],
  "citation": {
    "author": "Nama Tokoh / Ekonom / Penulis",
    "source": "Judul Buku / Sumber",
    "quote": "Kutipan kaidah finansial yang menginspirasi"
  }
}`
    : `You are a friendly, practical personal financial coach.
Review the user's financial numbers below using clear, everyday, easy-to-understand language.

USER FINANCIAL DATA:
- Period: ${periodLabel || 'Current Period'}
- Income: ${formatRupiah(totalIncome)}
- Expenses: ${formatRupiah(totalExpense)}
- Net Balance: ${formatRupiah(balance)}
- Savings Rate: ${savingsRate}%
- Total Transactions: ${transactionsCount}
- Top Category: ${topCategory ? `${topCategory.name} (${topCategory.percentage}%, ${formatRupiah(topCategory.amount)})` : '-'}
- Category Breakdown: ${categoryPercentages.length > 0 ? categoryPercentages.map((c) => `${c.name}: ${c.percentage}%`).join(', ') : '-'}
${topTransactions.length > 0 ? `- Sample Largest Expenses: ${topTransactions.join(', ')}` : ''}

TONE & STYLE RULES:
1. Use warm, straightforward, everyday language that anyone can easily digest. Avoid stiff or academic jargon.
2. DO NOT use the word "POS" or "bucket". Use natural terms like "spending category", "expenses", or "purchases".
3. Avoid complicated accounting terms. Use simple words like "income", "spending", "savings", "money left over", and "emergency buffer".
4. Provide 3 concise points (maximum 2 sentences each):
   - Point 1: Friendly assessment of money in vs money out and savings.
   - Point 2: Highlight of the biggest spending category and realistic saving ideas.
   - Point 3: Actionable next step for next month.
5. Provide 1 inspiring, reputable financial quote or principle from a well-known expert/book.

RETURN ONLY VALID JSON:
{
  "insights": [
    "Friendly insight 1...",
    "Spending analysis 2...",
    "Actionable tip 3..."
  ],
  "citation": {
    "author": "Expert Name",
    "source": "Book or Publication",
    "quote": "Inspiring financial quote"
  }
}`;

  console.log('[Gemini AI Report] Memulai proses generate insight dengan Gemini AI...');
  const availableModels = await getAvailableGeminiModels(apiKey);
  const modelsToTry = Array.from(new Set([...availableModels, ...CANDIDATE_MODELS]));
  console.log('[Gemini AI Report] Antrean model yang akan dicoba:', modelsToTry);

  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

  for (const modelName of modelsToTry) {
    const versions = ['v1beta', 'v1'];
    for (const ver of versions) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/${ver}/models/${modelName}:generateContent?key=${apiKey.trim()}`;
        console.log(`[Gemini AI Report] Mengirim prompt ke ${modelName} (${ver})...`);

        let reqBody = {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 2048,
            responseMimeType: 'application/json',
          },
        };

        let response = await fetchWithTimeout(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reqBody),
        }, 30000);

        console.log(`[Gemini AI Report] Status respons ${modelName} (${ver}): ${response.status}`);

        // Handle Rate Limit (HTTP 429) with exponential backoff retry (same as receipt scanner)
        if (response.status === 429) {
          console.warn(`[Gemini AI Report] Model ${modelName} (${ver}) hit Rate Limit (429). Retrying after backoff delay...`);
          await sleep(2500);
          response = await fetchWithTimeout(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reqBody),
          }, 30000);
          console.log(`[Gemini AI Report] ${modelName} (${ver}) Backoff retry HTTP status:`, response.status);
        }

        // If responseMimeType fails with 400 Bad Request, retry without responseMimeType (same as receipt scanner)
        if (!response.ok && response.status === 400) {
          console.log(`[Gemini AI Report] Retrying ${modelName} (${ver}) without responseMimeType...`);
          reqBody = {
            contents: [{ parts: [{ text: prompt + '\nPastikan hanya mengembalikan JSON valid.' }] }],
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: 2048,
            },
          };
          response = await fetchWithTimeout(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reqBody),
          }, 30000);
          console.log(`[Gemini AI Report] Retry status without responseMimeType:`, response.status);
        }

        if (!response.ok) {
          const errText = await response.text().catch(() => '');
          console.warn(`[Gemini AI Report] Model ${modelName} (${ver}) gagal (status ${response.status}):`, errText.slice(0, 120));
          continue;
        }

        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) {
          console.warn(`[Gemini AI Report] Model ${modelName} mengembalikan parts kosong`);
          continue;
        }

        const parsed = safeParseAiJson(rawText);
        if (parsed && Array.isArray(parsed.insights) && parsed.insights.length > 0 && parsed.citation?.quote) {
          console.log(`[Gemini AI Report] SUCCESS! Insight finansial berhasil digenerate oleh Gemini AI (${modelName})!`);
          return {
            insights: parsed.insights.slice(0, 3),
            citation: {
              author: parsed.citation.author || 'Pakar Keuangan',
              source: parsed.citation.source || 'Prinsip Keuangan Terpercaya',
              quote: parsed.citation.quote,
            },
            isAiGenerated: true,
            model: modelName,
          };
        }
      } catch (err) {
        console.warn(`[Gemini AI Report] Gagal request pada model ${modelName} (${ver}):`, err.message);
      }
    }
  }

  console.warn('[Gemini AI Report] Seluruh model Gemini gagal dihubungi. Menggunakan smart offline engine sebagai fallback aman.');
  return getOfflineSmartInsights(metrics, isIndonesian);
};
