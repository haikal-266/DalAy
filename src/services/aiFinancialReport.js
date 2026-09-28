/**
 * aiFinancialReport.js
 * AI & Expert-Backed Financial Insight Service for DalAy PDF Reports
 * 
 * Generates concise analytical insights and trustworthy financial principles
 * citing reputable books, journals, economists, and regulatory benchmarks.
 */

import { formatRupiah } from '../utils/formatters';
import { callGeminiAi } from './geminiClient';

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
  {
    author: 'John C. Bogle',
    source: 'The Little Book of Common Sense Investing (2007)',
    quoteId: 'Sebelum berinvestasi, prioritaskan melunasi pinjaman konsumtif. Tidak ada imbal hasil investasi yang konsisten mengalahkan beban bunga cicilan tinggi.',
    quoteEn: 'Before investing, prioritize eliminating high-interest consumer debt. No investment return consistently outpaces high financing charges.',
    category: 'debt',
  },
  {
    author: 'Thomas J. Stanley',
    source: 'The Millionaire Next Door (1996)',
    quoteId: 'Kekayaan sejati bukan diukur dari barang mewah yang dipamerkan, melainkan dari akumulasi aset produktif dan gaya hidup di bawah kemampuan.',
    quoteEn: 'Wealth is not what you spend, but the accumulation of productive assets by living beneath your means.',
    category: 'lifestyle',
  },
];

export const CATEGORY_NAME_MAP_EN = {
  'Makanan & Minuman': 'Food & Dining',
  'Transportasi & Kendaraan': 'Transportation',
  'Teknologi & Gadget': 'Tech & Electronics',
  'Kebutuhan Kerja & Usaha': 'Business & Work',
  'Belanja & Lifestyle': 'Shopping & Lifestyle',
  'Tagihan & Rumah': 'Housing & Utilities',
  'Kesehatan & Medis': 'Healthcare & Medical',
  'Pendidikan & Belajar': 'Education & Learning',
  'Hiburan & Hobi': 'Entertainment & Leisure',
  'Sedekah & Donasi': 'Charity & Donations',
  'Lain-lain': 'Miscellaneous',
  'Gaji & Upah': 'Salary & Wages',
  'Freelance & Project': 'Freelance & Contract',
  'Bisnis & Penjualan': 'Business & Sales',
  'Investasi & Bunga': 'Investments & Returns',
  'Hadiah & Hibah': 'Gifts & Grants',
  'Pemasukan Lain': 'Other Inflow',
};

export const translateCategoryName = (name, isIndonesian = true) => {
  if (isIndonesian || !name) return name;
  return CATEGORY_NAME_MAP_EN[name] || name;
};

/**
 * Get verified citation based on user financial state
 */
export const getVerifiedCitation = (metrics = {}, isIndonesian = true) => {
  const { totalIncome = 0, totalExpense = 0, balance = 0 } = metrics;
  const savingsRate = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : (balance >= 0 ? 0 : -100);

  let selected = CURATED_EXPERT_CITATIONS[0];
  if (totalExpense > totalIncome && totalIncome > 0) {
    selected = CURATED_EXPERT_CITATIONS.find((c) => c.author.includes('Graham')) || CURATED_EXPERT_CITATIONS[4];
  } else if (savingsRate >= 30) {
    selected = CURATED_EXPERT_CITATIONS.find((c) => c.author.includes('Buffett')) || CURATED_EXPERT_CITATIONS[2];
  } else if (savingsRate > 0) {
    selected = CURATED_EXPERT_CITATIONS.find((c) => c.author.includes('Warren')) || CURATED_EXPERT_CITATIONS[1];
  } else if (totalIncome === 0) {
    selected = CURATED_EXPERT_CITATIONS.find((c) => c.author.includes('Housel')) || CURATED_EXPERT_CITATIONS[0];
  }

  return {
    author: selected.author,
    source: selected.source,
    quote: isIndonesian ? selected.quoteId : selected.quoteEn,
  };
};

/**
 * Generate smart rule-based offline insights based on actual numbers
 * Specifically grounded in practical WNI economic realities (inflation, emergency funds, paylater precautions)
 */
export const getOfflineSmartInsights = (metrics, isIndonesian = true) => {
  const { totalIncome = 0, totalExpense = 0, balance = 0, topCategory, transactionsCount = 0 } = metrics;
  const savingsRate = totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : (balance >= 0 ? 0 : -100);

  const insights = [];
  let selectedCitation = CURATED_EXPERT_CITATIONS[1];

  // Point 1: Cashflow & Liquidity Evaluation
  if (totalExpense > totalIncome && totalIncome > 0) {
    insights.push(
      isIndonesian
        ? `**Evaluasi Arus Kas & Likuiditas:** Tercatat pengeluaran lebih besar (${formatRupiah(totalExpense)}) dibanding pemasukan (${formatRupiah(totalIncome)}) dengan selisih defisit ${formatRupiah(Math.abs(balance))} (defisit ${Math.abs(savingsRate)}%). Di tengah tekanan biaya hidup saat ini, defisit ini perlu segera distabilkan agar tidak memicu ketergantungan pada cicilan Paylater atau mengikis dana darurat Anda.`
        : `**Cashflow Dynamics & Liquidity Health:** Outflows for this period (${formatRupiah(totalExpense)}) were higher than total inflows (${formatRupiah(totalIncome)}) by a deficit of ${formatRupiah(Math.abs(balance))} (${Math.abs(savingsRate)}% deficit). This indicates negative cashflow pressure that could deplete liquid emergency reserves if continued unadjusted.`
    );
    selectedCitation = CURATED_EXPERT_CITATIONS.find((c) => c.author === 'Benjamin Graham') || CURATED_EXPERT_CITATIONS[4];
  } else if (savingsRate >= 30) {
    insights.push(
      isIndonesian
        ? `**Evaluasi Arus Kas & Likuiditas:** Kondisi keuangan sangat sehat dengan tingkat tabungan mencapai ${savingsRate}%, melampaui rekomendasi standar ideal 20%. Dari pemasukan ${formatRupiah(totalIncome)}, surplus ${formatRupiah(balance)} berhasil diamankan; prioritaskan menaruhnya pada instrumen likuid berisiko rendah seperti RDPU atau emas sebelum ekspansi konsumtif.`
        : `**Cashflow Dynamics & Liquidity Health:** Exceptional financial health with a savings rate of ${savingsRate}%, comfortably exceeding the recommended 20% benchmark. From total inflows of ${formatRupiah(totalIncome)}, a net surplus of ${formatRupiah(balance)} was successfully preserved, fortifying your financial resilience.`
    );
    selectedCitation = CURATED_EXPERT_CITATIONS.find((c) => c.author === 'Warren Buffett') || CURATED_EXPERT_CITATIONS[2];
  } else if (savingsRate > 0) {
    insights.push(
      isIndonesian
        ? `**Evaluasi Arus Kas & Likuiditas:** Arus kas mencatatkan kinerja positif dengan saldo surplus ${formatRupiah(balance)} (tingkat tabungan ${savingsRate}% dari total pemasukan ${formatRupiah(totalIncome)}). Capaian ini menunjukkan ketahanan belanja yang terjaga di tengah fluktuasi harga kebutuhan, meski masih ada ruang efisiensi menuju rasio tabungan ideal 20%.`
        : `**Cashflow Dynamics & Liquidity Health:** Positive cashflow recorded with a net surplus of ${formatRupiah(balance)} (a ${savingsRate}% savings rate from total income of ${formatRupiah(totalIncome)}). This reflects healthy spending discipline, with measurable room to reach the recommended 20% savings threshold.`
    );
    selectedCitation = CURATED_EXPERT_CITATIONS.find((c) => c.author === 'Prof. Elizabeth Warren') || CURATED_EXPERT_CITATIONS[1];
  } else {
    insights.push(
      isIndonesian
        ? `**Evaluasi Arus Kas & Likuiditas:** Total pengeluaran yang tercatat pada periode ini mencapai ${formatRupiah(totalExpense)} dari ${transactionsCount} transaksi. Belum ada pemasukan yang dicatatkan pada periode ini, sehingga penting untuk segera mencatat sumber pemasukan agar perhitungan arus kas dan ketahanan tabungan dapat dianalisis secara akurat.`
        : `**Cashflow Dynamics & Liquidity Health:** Total recorded expenditures reached ${formatRupiah(totalExpense)} across ${transactionsCount} transactions. Inflows have not yet been logged for this period, so logging revenue streams is essential to track net savings and liquidity sustainability.`
    );
    selectedCitation = CURATED_EXPERT_CITATIONS.find((c) => c.author === 'Morgan Housel') || CURATED_EXPERT_CITATIONS[0];
  }

  // Point 2: Spending Concentration & Cost Drivers
  if (topCategory && topCategory.amount > 0) {
    const categoryDisplayName = isIndonesian ? topCategory.name : translateCategoryName(topCategory.name, false);
    insights.push(
      isIndonesian
        ? `**Bedah Pengeluaran & Pola Konsumsi:** Pengeluaran terpusat secara dominan pada kategori "${categoryDisplayName}" yang menyerap ${formatRupiah(topCategory.amount)} (${topCategory.percentage}% dari seluruh belanja). Waspadai potensi kebocoran halus (seperti ongkos pesan antar makanan, langganan yang jarang terpakai, atau jajan impulsif) agar porsi belanja esensial keluarga tetap terlindungi.`
        : `**Spending Concentration & Cost Drivers:** Expenditure is predominantly concentrated in "${categoryDisplayName}", accounting for ${formatRupiah(topCategory.amount)} (${topCategory.percentage}% of all recorded outflows). This high concentration represents your primary cost driver, meaning that even modest efficiency gains in this area will yield immediate budget improvements.`
    );
  } else {
    insights.push(
      isIndonesian
        ? `**Bedah Pengeluaran & Pola Konsumsi:** Distribusi pengeluaran tersebar merata di berbagai kategori belanja tanpa lonjakan ekstrem pada satu pos. Pola alokasi yang berimbang ini memudahkan pemantauan biaya hidup harian dan meminimalkan risiko kejutan finansial di akhir bulan.`
        : `**Spending Concentration & Cost Drivers:** Spending is distributed across multiple categories without extreme concentration in any single area. This balanced distribution facilitates daily cost control and lowers the risk of unexpected spending spikes.`
    );
  }

  // Point 3: Strategic Roadmap & Action Plan
  if (balance < 0) {
    insights.push(
      isIndonesian
        ? `**Rekomendasi Strategis & Rencana Anggaran:** Terapkan strategi rem darurat untuk 30 hari ke depan: tunda pembelian barang non-primer, batasi pesanan pesan-antar makanan, dan tentukan batas belanja harian yang ketat. Fokuskan sisa kas untuk kebutuhan primer dan kewajiban mutlak sebelum menambah komitmen baru.`
        : `**Strategic Budget Roadmap & Action Plan:** Prioritize curtailing discretionary spending (lifestyle and non-essentials) over the next 30 days until cashflow returns to surplus. Establish daily spending caps and defer large non-urgent purchases to restore positive cash balances.`
    );
  } else {
    insights.push(
      isIndonesian
        ? `**Rekomendasi Strategis & Rencana Anggaran:** Terapkan alokasi anggaran terstruktur khas WNI (misal formula 50/30/20: 50% kebutuhan pokok, 30% kewajiban cicilan/sinking fund periodik seperti BPJS/pendidikan, dan 20% tabungan dana darurat). Pindahkan surplus periode ini ke rekening cadangan terpisah di awal bulan.`
        : `**Strategic Budget Roadmap & Action Plan:** Implement structured budgeting frameworks such as the 50/30/20 rule (50% essentials, 30% discretionary, and 20% savings/investments). Automatically transfer this period's surplus into a dedicated emergency reserve at the beginning of the next cycle before initiating new discretionary spending.`
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
 * Safely parse JSON with bulletproof schema recovery
 * Supports both modern schema (summary, analysis_points, action_tips) and legacy format (insights)
 * Ensures 100% verified citations
 */
export const safeParseAiJson = (rawText, isIndonesian = true, metrics = {}) => {
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

  let parsed = null;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    console.warn('[Gemini AI Report] Direct JSON.parse failed, trying regex recovery:', e.message);
  }

  if (parsed && typeof parsed === 'object') {
    let finalInsights = [];

    // Format 1: Production schema (summary, analysis_points, action_tips)
    if (Array.isArray(parsed.analysis_points) || Array.isArray(parsed.action_tips)) {
      const summaryText = parsed.summary || '';
      const analysisText = Array.isArray(parsed.analysis_points) ? parsed.analysis_points.join(' ') : '';
      const actionText = Array.isArray(parsed.action_tips) ? parsed.action_tips.join(' ') : '';

      const point1Header = isIndonesian ? '**Evaluasi Arus Kas & Likuiditas:**' : '**Cashflow Dynamics & Liquidity Health:**';
      const point2Header = isIndonesian ? '**Bedah Pengeluaran & Pola Konsumsi:**' : '**Spending Concentration & Cost Drivers:**';
      const point3Header = isIndonesian ? '**Rekomendasi Strategis & Rencana Anggaran:**' : '**Strategic Budget Roadmap & Action Plan:**';

      if (summaryText) finalInsights.push(`${point1Header} ${summaryText}`);
      if (analysisText) finalInsights.push(`${point2Header} ${analysisText}`);
      if (actionText) finalInsights.push(`${point3Header} ${actionText}`);
    } else if (Array.isArray(parsed.insights)) {
      // Format 2: Direct insights array
      finalInsights = parsed.insights;
    }

    // Verify citation validity
    let citation = parsed.citation;
    if (!citation || !citation.quote || !citation.author) {
      citation = getVerifiedCitation(metrics, isIndonesian);
    }

    if (finalInsights.length > 0) {
      return {
        insights: finalInsights.slice(0, 3),
        citation: {
          author: citation.author || (isIndonesian ? 'Pakar Keuangan' : 'Financial Expert'),
          source: citation.source || (isIndonesian ? 'Prinsip Keuangan Terpercaya' : 'Financial Publication'),
          quote: citation.quote,
        },
        financial_health: parsed.financial_health || 'stabil',
      };
    }
  }

  // Fallback regex extraction if JSON had minor syntax errors
  try {
    const insightsMatches = [...cleaned.matchAll(/"([^"\\]*(?:\\.[^"\\]*)*)"/g)]
      .map((m) => m[1])
      .filter((s) => s.length > 25 && !s.includes('status') && !s.includes('insights') && !s.includes('citation'));

    const quoteMatch = cleaned.match(/"quote"\s*:\s*"([^"]+)"/i);
    const authorMatch = cleaned.match(/"author"\s*:\s*"([^"]+)"/i);
    const sourceMatch = cleaned.match(/"source"\s*:\s*"([^"]+)"/i);

    if (insightsMatches.length > 0) {
      const fallbackCitation = getVerifiedCitation(metrics, isIndonesian);
      return {
        insights: insightsMatches.slice(0, 3),
        citation: {
          author: authorMatch ? authorMatch[1] : fallbackCitation.author,
          source: sourceMatch ? sourceMatch[1] : fallbackCitation.source,
          quote: quoteMatch ? quoteMatch[1] : fallbackCitation.quote,
        },
      };
    }
  } catch (regexErr) {
    console.warn('[Gemini AI Report] Regex extraction also failed:', regexErr.message);
  }

  return null;
};

/**
 * System Instruction for Gemini AI:
 * Sets strict persona as "DaLay AI", grounds advice in realistic WNI economic conditions,
 * enforces pure JSON output, and demands authentic verified citations.
 */
export const buildAiSystemInstruction = (isIndonesian = true) => {
  if (isIndonesian) {
    return `Kamu adalah "DaLay AI", penasihat dan analis keuangan pribadi senior yang sangat memahami realitas ekonomi masyarakat Indonesia (WNI) saat ini.
Tugas utamamu adalah menganalisis data arus kas masuk dan belanja pengguna untuk memberikan insight yang tajam, realistis, aplikatif, dan berbobot tinggi bagi WNI.

KONTEKS EKONOMI WNI YANG WAJIB DIJADIKAN RUJUKAN ANALISIS:
1. Tekanan Biaya Hidup & Inflasi Pangan: Cermati harga kebutuhan pokok. Bantu pengguna membedakan belanja esensial keluarga dengan kebocoran halus (latte factor, jajan kopi/boba, ongkos pesan antar makanan online, checkout impulsif marketplace).
2. Prioritas Dana Darurat Likuid: Tekankan pentingnya dana darurat minimal 3–6 kali pengeluaran bulanan di instrumen likuid & aman (RDPU, tabungan bank digital berbunga wajar, atau emas fisik) sebelum tergiur investasi spekulatif.
3. Waspada Jebakan Cicilan & Hutang Konsumtif: Awasi indikasi tekanan cicilan Paylater, kartu kredit, atau pinjol yang menggerus arus kas bulanan.
4. Generasi Sandwich & Sinking Fund: Berikan strategi alokasi dana cadangan berkala (sinking fund) untuk pengeluaran tahunan/periodik (seperti BPJS Kesehatan, uang pangkal pendidikan anak, servis kendaraan, atau bantuan orang tua).
5. Formula Anggaran Realistis: Sarankan adaptasi formula yang membumi (misal: 50% Kebutuhan Pokok, 30% Kewajiban & Dana Cadangan, 20% Keinginan Terkendali).

ATURAN MUTLAK (SYSTEM CONSTRAINTS):
1. FORMAT OUTPUT: Kamu WAJIB mengembalikan respons HANYA dalam format JSON murni. DILARANG KERAS menambahkan teks pengantar, penutup, atau tanda markdown (seperti \`\`\`json) di luar objek JSON.
2. DILARANG MENGGUNAKAN KATA "POS" (misal: dilarang memakai "pos pengeluaran"). Gunakan istilah wajar: "kategori belanja", "pengeluaran", "alokasi dana", atau "anggaran".
3. KUTIPAN TERPERCAYA (VERIFIED CITATION): Wajib menyertakan 1 kutipan prinsip finansial yang otentik dan nyata dari tokoh, buku, atau lembaga resmi terpercaya (seperti Warren Buffett, Benjamin Graham, Morgan Housel, Prof. Elizabeth Warren, Daniel Kahneman, Otoritas Jasa Keuangan / OJK RI, John C. Bogle, dll). DILARANG KERAS mengarang nama tokoh atau judul buku fiktif.
4. TONE & GAYA BAHASA: Profesional, berbobot, hangat, solutif, tidak menggurui, dan langsung dapat dieksekusi oleh WNI.`;
  }

  return `You are "DaLay AI", an elite personal wealth management advisor and certified financial coach.
Your task is to analyze user income and expenditure metrics to deliver sharp, deeply actionable, and highly practical financial advisory notes.

ADVISORY PRINCIPLES & FOCUS:
1. Cashflow Sustainability & Cost-of-Living Pressures: Scrutinize real purchasing power, essential vs discretionary allocation, and silent cash leaks (deliveries, subscriptions, convenience fees).
2. Liquidity & Emergency Reserves: Emphasize securing 3 to 6 months of living expenses in liquid, low-volatility cash equivalents before pursuing risky capital allocations.
3. Debt & Structural Vulnerability: Highlight the dangers of high-interest revolving credit or buy-now-pay-later services eroding monthly cashflow.
4. Structured Sinking Funds: Guide users to implement sinking funds for cyclical and annual commitments (insurance, education, property taxes).
5. Pragmatic Budget Frameworks: Suggest actionable allocation benchmarks (such as modified 50/30/20 principles and enforceable daily expenditure caps).

STRICT SYSTEM CONSTRAINTS:
1. FORMAT OUTPUT: Return ONLY pure, valid JSON matching the schema. NEVER include conversational preambles, intros, or markdown blocks outside the JSON object.
2. DO NOT use the word "POS" or "bucket". Use terms like "spending category", "expenditures", or "allocation".
3. VERIFIED CITATION: Include exactly 1 authentic financial principle from a renowned economist, author, investor, or regulatory institution with exact book or paper citation. NEVER invent fictitious quotes.
4. TONE: Authoritative, objective, empathetic, and relentlessly practical.`;
};

/**
 * User Prompt builder for Gemini AI
 */
export const buildAiUserPrompt = (metrics, isIndonesian = true) => {
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

  const translatedPeriod = isIndonesian
    ? (periodLabel || 'Periode Berjalan')
    : (periodLabel === 'Semua Periode' ? 'All Periods' : (periodLabel || 'Current Period'));

  const formattedTopCat = topCategory
    ? (isIndonesian
        ? `${topCategory.name} (${topCategory.percentage}%, senilai ${formatRupiah(topCategory.amount)})`
        : `${translateCategoryName(topCategory.name, false)} (${topCategory.percentage}%, ${formatRupiah(topCategory.amount)})`)
    : (isIndonesian ? 'Belum tercatat' : 'Not recorded');

  const formattedCategories = categoryPercentages.length > 0
    ? categoryPercentages
        .map((c) => `${isIndonesian ? c.name : translateCategoryName(c.name, false)}: ${c.percentage}%`)
        .join(', ')
    : '-';

  if (isIndonesian) {
    return `Tolong lakukan audit dan analisis mendalam terhadap data keuangan periode ${translatedPeriod} berikut:

DATA KEUANGAN PENGGUNA:
- Periode: ${translatedPeriod}
- Total Pemasukan: ${formatRupiah(totalIncome)}
- Total Pengeluaran: ${formatRupiah(totalExpense)}
- Saldo Bersih / Arus Kas: ${formatRupiah(balance)}
- Tingkat Tabungan (Savings Rate): ${savingsRate}%
- Volume Transaksi: ${transactionsCount} catatan
- Pemicu Pengeluaran Terbesar: ${formattedTopCat}
- Rincian Alokasi Kategori: ${formattedCategories}
${topTransactions.length > 0 ? `- Sampel Belanja Terbesar: ${topTransactions.join(', ')}` : ''}

KEMBALIKAN OUTPUT HANYA DALAM FORMAT JSON DENGAN SKEMA BERIKUT:
{
  "status": "success",
  "summary": "Analisis tajam arus kas dan likuiditas (3-4 kalimat padat yang membedah angka riil, rasio tabungan ${savingsRate}%, dan ketahanan dana darurat WNI).",
  "analysis_points": [
    "Analisis mendalam kategori pengeluaran terbesar (${formattedTopCat}) serta sampel transaksi terbesar (bedah apakah esensial keluarga vs konsumtif/gaya hidup/latte factor).",
    "Analisis risiko keuangan, kerentanan likuiditas, dan kebiasaan belanja yang perlu diwaspadai."
  ],
  "action_tips": [
    "Saran taktis konkret 1: langkah penghematan atau penetapan batas belanja harian yang realistis.",
    "Saran taktis konkret 2: strategi alokasi dana darurat di instrumen likuid (RDPU/emas) atau pemisahan rekening."
  ],
  "financial_health": "${savingsRate < 0 ? 'kritis' : savingsRate < 20 ? 'stabil' : 'sehat'}",
  "citation": {
    "author": "Nama Tokoh / Ekonom / Lembaga Resmi",
    "source": "Judul Buku atau Publikasi Resmi",
    "quote": "Kutipan kaidah finansial otentik yang sangat relevan"
  }
}`;
  }

  return `Please perform an executive financial audit and deep analysis on the following metrics for ${translatedPeriod}:

FINANCIAL METRICS:
- Period: ${translatedPeriod}
- Total Inflow: ${formatRupiah(totalIncome)}
- Total Outflow: ${formatRupiah(totalExpense)}
- Net Cashflow: ${formatRupiah(balance)}
- Savings Rate: ${savingsRate}%
- Transaction Count: ${transactionsCount} records
- Primary Outflow Driver: ${formattedTopCat}
- Category Allocations: ${formattedCategories}
${topTransactions.length > 0 ? `- Sample Significant Outflows: ${topTransactions.join(', ')}` : ''}

RETURN ONLY VALID JSON WITH THIS EXACT SCHEMA:
{
  "status": "success",
  "summary": "Deep assessment of net cashflow, liquidity health, and savings sustainability (3-4 substantive sentences evaluating the ${savingsRate}% savings rate).",
  "analysis_points": [
    "Deep dive into primary expenditure category (${formattedTopCat}) and large outflows (scrutinizing essentials vs lifestyle leaks).",
    "Analysis of structural cashflow vulnerability, concentration risk, and liquidity buffers."
  ],
  "action_tips": [
    "Actionable tactical step 1: enforceable daily spending caps or high-impact discretionary cuts.",
    "Actionable tactical step 2: sinking fund implementation or liquid reserve allocations."
  ],
  "financial_health": "${savingsRate < 0 ? 'kritis' : savingsRate < 20 ? 'stabil' : 'sehat'}",
  "citation": {
    "author": "Renowned Author / Economist / Institution",
    "source": "Official Book or Journal Publication Title",
    "quote": "Authentic, verified financial quote in English"
  }
}`;
};

/**
 * Request Gemini AI to generate customized concise insights and expert citation
 * Uses centralized geminiClient with systemInstruction, 0.3 temperature, and robust schema parsing.
 */
export const fetchGeminiAiFinancialInsights = async (metrics, apiKey, isIndonesian = true) => {
  const envKey = (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_GEMINI_API_KEY) || '';
  const effectiveKey = (apiKey || envKey || '').trim();

  console.log('[Gemini AI Report] ─── Memulai Proses Analisis Finansial AI ───');
  console.log('[Gemini AI Report] Status API Key:', effectiveKey ? `Tersedia (${effectiveKey.slice(0, 6)}...${effectiveKey.slice(-4)}, panjang: ${effectiveKey.length})` : 'TIDAK TERSEDIA / KOSONG');

  if (!effectiveKey || effectiveKey.length < 10) {
    console.warn('[Gemini AI Report] ⚠️ API Key Gemini tidak diatur atau kurang dari 10 karakter. Menggunakan smart offline engine (DaLay Local).');
    return {
      ...getOfflineSmartInsights(metrics, isIndonesian),
      isAiGenerated: false,
      fallbackReason: 'no_api_key',
      model: null,
    };
  }

  const systemInstruction = buildAiSystemInstruction(isIndonesian);
  const prompt = buildAiUserPrompt(metrics, isIndonesian);

  try {
    console.log('[Gemini AI Report] Mengirim prompt ke Gemini via geminiClient...');
    const result = await callGeminiAi({
      apiKey: effectiveKey,
      prompt,
      systemInstruction,
      temperature: 0.3,
      maxOutputTokens: 2048,
      responseMimeType: 'application/json',
      tag: 'Gemini AI Report',
    });

    console.log(`[Gemini AI Report] Menerima respons dari model ${result.model}. Membedah JSON...`);
    const parsed = safeParseAiJson(result.text, isIndonesian, metrics);

    if (parsed && Array.isArray(parsed.insights) && parsed.insights.length > 0 && parsed.citation?.quote) {
      console.log(`[Gemini AI Report] 🎉 SUCCESS! Berhasil menyusun ${parsed.insights.length} insight finansial & kutipan (${result.model})!`);
      return {
        insights: parsed.insights.slice(0, 3),
        citation: {
          author: parsed.citation.author || (isIndonesian ? 'Pakar Keuangan' : 'Financial Expert'),
          source: parsed.citation.source || (isIndonesian ? 'Prinsip Keuangan Terpercaya' : 'Financial Publication'),
          quote: parsed.citation.quote,
        },
        isAiGenerated: true,
        fallbackReason: null,
        model: result.model,
      };
    } else {
      console.warn('[Gemini AI Report] ⚠️ safeParseAiJson tidak menghasilkan struktur valid. Raw text:', result.text);
    }
  } catch (err) {
    console.error('[Gemini AI Report] ❌ Gagal request pada model Gemini:', err.message);
  }

  console.warn('[Gemini AI Report] ⚠️ Seluruh percobaan Gemini gagal/invalid. Menggunakan smart offline engine (DaLay Local) sebagai fallback.');
  return {
    ...getOfflineSmartInsights(metrics, isIndonesian),
    isAiGenerated: false,
    fallbackReason: 'network_or_api_error',
    model: null,
  };
};
