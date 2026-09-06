/**
 * pdfReportGenerator.js
 * Mobile-First AI Financial Report PDF Generator for DalAy
 * 
 * Features:
 * - Mobile-first responsive layout (comfortable on phone screens & desktop)
 * - Rich visual graphics (SVG Donut Chart, Cashflow Ratio Bar, Top Category Progress Bars)
 * - AI-powered insights & verified economist/journal citations
 * - Detailed transaction audit table at the bottom
 */

import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { formatRupiah, formatDateIndo } from '../utils/formatters';
import { fetchGeminiAiFinancialInsights } from './aiFinancialReport';

/**
 * Generate Pure SVG Donut Chart Segments
 */
const renderSvgDonutChart = (categories = [], totalExpense = 0, isIndonesian = true) => {
  if (!categories || categories.length === 0 || totalExpense <= 0) {
    return `
      <div style="text-align: center; padding: 24px 0; color: #94A3B8; font-size: 8.5pt;">
        ${isIndonesian ? 'Tidak ada pengeluaran pada periode ini' : 'No expenses recorded in this period'}
      </div>
    `;
  }

  const radius = 50;
  const circumference = 2 * Math.PI * radius; // ~314.16
  let accumulatedOffset = 0;

  const segmentsHtml = categories.slice(0, 6).map((cat) => {
    const percentage = (cat.amount / totalExpense) * 100;
    const strokeDash = (percentage / 100) * circumference;
    const offset = accumulatedOffset;
    accumulatedOffset += strokeDash;

    return `
      <circle
        cx="75"
        cy="75"
        r="${radius}"
        fill="transparent"
        stroke="${cat.color || '#3B82F6'}"
        stroke-width="22"
        stroke-dasharray="${strokeDash.toFixed(2)} ${circumference.toFixed(2)}"
        stroke-dashoffset="-${offset.toFixed(2)}"
        transform="rotate(-90 75 75)"
      />
    `;
  }).join('\n');

  const legendHtml = categories.slice(0, 5).map((cat) => {
    const percentage = Math.round((cat.amount / totalExpense) * 100);
    return `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; font-size: 8pt;">
        <div style="display: flex; align-items: center; gap: 6px; overflow: hidden; max-width: 140px;">
          <span style="width: 8px; height: 8px; border-radius: 2px; background-color: ${cat.color || '#3B82F6'}; display: inline-block; flex-shrink: 0;"></span>
          <span style="font-weight: 600; color: #1E293B; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${cat.name}</span>
        </div>
        <span style="font-weight: 700; color: #64748B; margin-left: 8px;">${percentage}%</span>
      </div>
    `;
  }).join('\n');

  return `
    <div style="display: flex; align-items: center; justify-content: space-around; gap: 16px; margin: 6px 0;">
      <svg width="150" height="150" viewBox="0 0 150 150">
        <!-- Background track -->
        <circle cx="75" cy="75" r="${radius}" fill="transparent" stroke="#F1F5F9" stroke-width="22" />
        ${segmentsHtml}
        <!-- Inner Center Badge -->
        <circle cx="75" cy="75" r="36" fill="#FFFFFF" />
        <text x="75" y="72" text-anchor="middle" font-size="8pt" font-weight="700" fill="#64748B">TOTAL</text>
        <text x="75" y="85" text-anchor="middle" font-size="8pt" font-weight="900" fill="#0F172A">${categories.length} ${isIndonesian ? 'KATEGORI' : 'CATEGORIES'}</text>
      </svg>
      <div style="flex: 1; min-width: 130px; max-width: 200px;">
        ${legendHtml}
      </div>
    </div>
  `;
};

/**
 * Generate Classic Professional A4 PDF HTML Template
 */
export const buildReportHtml = ({
  transactions = [],
  summary = { totalIncome: 0, totalExpense: 0, balance: 0 },
  categoryStats = [],
  periodLabel = 'Bulan Ini',
  isIndonesian = true,
  aiData = null,
}) => {
  const totalIncome = summary.totalIncome || 0;
  const totalExpense = summary.totalExpense || 0;
  const netSavings = summary.balance || (totalIncome - totalExpense);
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;
  const isSurplus = netSavings >= 0;

  // Calculate Cashflow bar percentages
  const totalFlow = totalIncome + totalExpense;
  const incomePct = totalFlow > 0 ? Math.round((totalIncome / totalFlow) * 100) : 50;
  const expensePct = 100 - incomePct;

  // Normalize categories if passed as array or store stats object
  const rawCategories = Array.isArray(categoryStats)
    ? categoryStats
    : (Array.isArray(categoryStats?.categories) ? categoryStats.categories : []);

  // Filter and sort expense categories
  const expenseCategories = rawCategories
    .filter((c) => c.type === 'expense' || c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // Top Category Progress Bars HTML (Top 4)
  const categoryProgressHtml = expenseCategories.slice(0, 4).map((cat) => {
    const pct = totalExpense > 0 ? Math.round((cat.amount / totalExpense) * 100) : 0;
    return `
      <div style="margin-bottom: 8px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px; font-size: 8pt;">
          <span style="font-weight: 700; color: #334155;">${cat.name}</span>
          <span style="color: #64748B; font-weight: 600;">${formatRupiah(cat.amount)} (${pct}%)</span>
        </div>
        <div style="width: 100%; height: 6px; background: #F1F5F9; border-radius: 3px; overflow: hidden; border: 1px solid #E2E8F0;">
          <div style="width: ${pct}%; height: 100%; background: ${cat.color || '#0284C7'}; border-radius: 2px;"></div>
        </div>
      </div>
    `;
  }).join('\n');

  // Executive Insights List (Clean, formal, authoritative)
  const insightsHtml = (aiData?.insights || []).map((ins) => `
    <li style="margin-bottom: 6px; font-size: 8.5pt; line-height: 1.45; color: #1E293B; font-weight: 600;">
      ${ins}
    </li>
  `).join('\n');

  // Detailed Transaction Table Rows (Unconstrained, flows naturally across pages)
  const sortedTx = [...transactions].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const txRowsHtml = sortedTx.map((tx, idx) => {
    const isInc = tx.type === 'income';
    const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
    const sign = isInc ? '+' : '-';
    const amountColor = isInc ? '#059669' : '#DC2626';

    return `
      <tr style="background-color: ${rowBg};">
        <td style="padding: 6px 8px; font-size: 8pt; color: #64748B; white-space: nowrap;">
          ${formatDateIndo(tx.date, false, true)}
        </td>
        <td style="padding: 6px 8px; font-size: 8.5pt; font-weight: 600; color: #0F172A;">
          ${tx.name || 'Transaksi'}
        </td>
        <td style="padding: 6px 8px; font-size: 8pt; color: #475569;">
          ${tx.categoryName || 'Umum'}
        </td>
        <td style="padding: 6px 8px; font-size: 8pt; color: #64748B;">
          ${tx.walletName || 'Dompet'}
        </td>
        <td style="padding: 6px 8px; text-align: right; font-size: 8.5pt; font-weight: 700; color: ${amountColor}; white-space: nowrap;">
          ${sign}${formatRupiah(tx.amount)}
        </td>
      </tr>
    `;
  }).join('\n');

  const generatedDate = new Date().toLocaleDateString(isIndonesian ? 'id-ID' : 'en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return `
<!DOCTYPE html>
<html lang="${isIndonesian ? 'id' : 'en'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DalAy - ${isIndonesian ? 'Laporan Keuangan' : 'Financial Statement'}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 14mm 16mm 16mm 16mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0F172A;
      background: #FFFFFF;
      font-size: 9pt;
      line-height: 1.45;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .page-wrapper {
      width: 100%;
      margin: 0 auto;
    }
    .no-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .section-title {
      font-size: 8.5pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #334155;
      margin-bottom: 8px;
      padding-bottom: 4px;
      border-bottom: 1.5px solid #CBD5E1;
    }
    table.report-table {
      width: 100%;
      border-collapse: collapse;
      page-break-inside: auto;
    }
    table.report-table thead {
      display: table-header-group;
    }
    table.report-table tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    table.report-table th {
      background-color: #F8FAFC;
      color: #334155;
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 8px 10px;
      border-top: 1px solid #CBD5E1;
      border-bottom: 2px solid #334155;
      text-align: left;
    }
    table.report-table td {
      padding: 7px 10px;
      font-size: 8.5pt;
      border-bottom: 1px solid #E2E8F0;
      vertical-align: middle;
    }
  </style>
</head>
<body>
  <div class="page-wrapper">
    <!-- Header Block (No-break) -->
    <div class="no-break" style="margin-bottom: 16px; border-bottom: 2px solid #0F172A; padding-bottom: 12px;">
      <div style="display: flex; justify-content: space-between; align-items: flex-start;">
        <div>
          <div style="font-size: 8pt; font-weight: 800; letter-spacing: 1px; color: #475569; text-transform: uppercase;">
            DALAY FINANCE &bull; LAPORAN KEUANGAN
          </div>
          <h1 style="font-size: 20pt; font-weight: 800; color: #0F172A; margin: 2px 0 4px 0; letter-spacing: -0.4px;">
            ${isIndonesian ? 'Laporan Arus Kas & Saldo' : 'Cashflow & Balance Statement'}
          </h1>
          <div style="font-size: 8.5pt; color: #64748B;">
            Periode: <strong>${periodLabel}</strong> &bull; Dicetak: ${generatedDate}
          </div>
        </div>
        <div style="text-align: right;">
          <div style="border: 1px solid #CBD5E1; border-radius: 4px; padding: 6px 12px; background: #F8FAFC; text-align: center;">
            <div style="font-size: 7.5pt; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px;">
              SAVINGS RATE
            </div>
            <div style="font-size: 14pt; font-weight: 900; color: ${isSurplus ? '#0284C7' : '#DC2626'};">
              ${savingsRate}%
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- KPI Summary Block (3 Columns, No-break) -->
    <div class="no-break" style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 16px;">
      <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-top: 3px solid #10B981; border-radius: 4px; padding: 10px 12px;">
        <div style="font-size: 7.5pt; font-weight: 700; color: #047857; text-transform: uppercase; letter-spacing: 0.5px;">TOTAL PEMASUKAN</div>
        <div style="font-size: 12.5pt; font-weight: 800; color: #059669; margin-top: 4px;">${formatRupiah(totalIncome)}</div>
      </div>
      <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-top: 3px solid #EF4444; border-radius: 4px; padding: 10px 12px;">
        <div style="font-size: 7.5pt; font-weight: 700; color: #B91C1C; text-transform: uppercase; letter-spacing: 0.5px;">TOTAL PENGELUARAN</div>
        <div style="font-size: 12.5pt; font-weight: 800; color: #DC2626; margin-top: 4px;">${formatRupiah(totalExpense)}</div>
      </div>
      <div style="background: #F8FAFC; border: 1px solid #E2E8F0; border-top: 3px solid ${isSurplus ? '#0284C7' : '#F59E0B'}; border-radius: 4px; padding: 10px 12px;">
        <div style="font-size: 7.5pt; font-weight: 700; color: ${isSurplus ? '#0369A1' : '#B45309'}; text-transform: uppercase; letter-spacing: 0.5px;">ARUS KAS BERSIH</div>
        <div style="font-size: 12.5pt; font-weight: 800; color: ${isSurplus ? '#0284C7' : '#D97706'}; margin-top: 4px;">${isSurplus ? '+' : ''}${formatRupiah(netSavings)}</div>
      </div>
    </div>

    <!-- Visual Analytics Block (2 Columns: Donut + Cashflow & Progress Bars, No-break) -->
    <div class="no-break" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 4px; padding: 12px 14px;">
      <!-- Col 1: Expense Donut Chart -->
      <div>
        <div class="section-title">
          ${isIndonesian ? 'Proporsi Kategori Belanja' : 'Expense Category Breakdown'}
        </div>
        ${renderSvgDonutChart(expenseCategories, totalExpense, isIndonesian)}
      </div>

      <!-- Col 2: Cashflow Ratio & Top Category Bars -->
      <div>
        <div class="section-title">
          ${isIndonesian ? 'Rasio Arus Kas & Kategori Utama' : 'Cashflow Ratio & Top Categories'}
        </div>
        
        <!-- Cashflow Ratio Bar -->
        <div style="margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; font-size: 7.5pt; font-weight: 700; margin-bottom: 3px;">
            <span style="color: #059669;">Pemasukan (${incomePct}%)</span>
            <span style="color: #DC2626;">Pengeluaran (${expensePct}%)</span>
          </div>
          <div style="display: flex; height: 9px; border-radius: 2px; overflow: hidden; background: #F1F5F9; border: 1px solid #CBD5E1;">
            <div style="width: ${incomePct}%; background: #10B981;"></div>
            <div style="width: ${expensePct}%; background: #EF4444;"></div>
          </div>
        </div>

        <!-- Top Category Bars -->
        <div>
          ${categoryProgressHtml}
        </div>
      </div>
    </div>

    <!-- Executive Financial Analysis & Expert Citation (No-break) -->
    <div class="no-break" style="background: #F8FAFC; border: 1px solid #CBD5E1; border-left: 4px solid #0284C7; border-radius: 4px; padding: 12px 14px; margin-bottom: 16px;">
      <div style="font-size: 8.5pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.6px; color: #0369A1; margin-bottom: 8px;">
        ${isIndonesian ? 'Catatan Analisis Finansial' : 'Financial Analysis & Notes'}
      </div>
      <ul style="margin: 0; padding-left: 18px; margin-bottom: ${aiData?.citation?.quote ? '10px' : '0'};">
        ${insightsHtml}
      </ul>

      ${aiData?.citation?.quote ? `
        <div style="background: #FFFFFF; border: 1px solid #E2E8F0; border-left: 3px solid #059669; border-radius: 3px; padding: 8px 12px; margin-top: 6px;">
          <div style="font-size: 7.5pt; font-weight: 700; color: #047857; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">
            Prinsip Finansial: ${aiData.citation.author}
          </div>
          <div style="font-size: 8.5pt; font-style: italic; color: #334155; line-height: 1.4; margin-bottom: 2px;">
            "${aiData.citation.quote}"
          </div>
          <div style="font-size: 7.5pt; color: #64748B;">
            Sumber: ${aiData.citation.source}
          </div>
        </div>
      ` : ''}
    </div>

    <!-- Detailed Transaction Ledger Table (Multi-page safe) -->
    <div style="margin-top: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px; border-bottom: 1.5px solid #334155; padding-bottom: 4px;">
        <div style="font-size: 9pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; color: #0F172A;">
          ${isIndonesian ? 'Rincian Log Transaksi' : 'Detailed Transaction Ledger'}
        </div>
        <div style="font-size: 8pt; color: #64748B; font-weight: 600;">
          Total: ${transactions.length} ${isIndonesian ? 'catatan' : 'records'}
        </div>
      </div>

      <table class="report-table">
        <thead>
          <tr>
            <th style="width: 14%;">${isIndonesian ? 'TANGGAL' : 'DATE'}</th>
            <th style="width: 38%;">${isIndonesian ? 'DESKRIPSI' : 'DESCRIPTION'}</th>
            <th style="width: 20%;">${isIndonesian ? 'KATEGORI' : 'CATEGORY'}</th>
            <th style="width: 14%;">${isIndonesian ? 'DOMPET' : 'ACCOUNT'}</th>
            <th style="width: 14%; text-align: right;">${isIndonesian ? 'NOMINAL' : 'AMOUNT'}</th>
          </tr>
        </thead>
        <tbody>
          ${txRowsHtml || `
            <tr>
              <td colspan="5" style="text-align: center; padding: 20px 0; color: #94A3B8; font-style: italic;">
                ${isIndonesian ? 'Tidak ada transaksi pada periode ini' : 'No transactions recorded in this period'}
              </td>
            </tr>
          `}
        </tbody>
      </table>

      <!-- Document Footer Audit Notice -->
      <div style="margin-top: 14px; text-align: center; font-size: 7.5pt; color: #94A3B8; border-top: 1px solid #E2E8F0; padding-top: 8px;">
        Dokumen dicetak secara otomatis dari aplikasi DalAy (Daily Quran & Smart Finance).
      </div>
    </div>
  </div>
</body>
</html>
  `;
};

/**
 * Generate PDF file and trigger Native Share
 */
export const generateAndSharePdfReport = async ({
  transactions = [],
  summary = { totalIncome: 0, totalExpense: 0, balance: 0 },
  categoryStats = [],
  periodLabel = 'Bulan Ini',
  isIndonesian = true,
  geminiApiKey = '',
}) => {
  try {
    const totalExpense = summary.totalExpense || 0;
    const rawCategories = Array.isArray(categoryStats)
      ? categoryStats
      : (Array.isArray(categoryStats?.categories) ? categoryStats.categories : []);
    const sortedCategories = [...rawCategories].sort((a, b) => b.amount - a.amount);
    const topCategory = sortedCategories.length > 0 && totalExpense > 0
      ? {
          name: sortedCategories[0].name,
          amount: sortedCategories[0].amount,
          percentage: Math.round((sortedCategories[0].amount / totalExpense) * 100),
        }
      : null;

    const categoryPercentages = sortedCategories.slice(0, 5).map((c) => ({
      name: c.name,
      percentage: totalExpense > 0 ? Math.round((c.amount / totalExpense) * 100) : 0,
    }));

    // Extract top expense items to give Gemini rich context
    const topTransactions = [...transactions]
      .filter((t) => t.type === 'expense' || t.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map((t) => `${t.name} (${formatRupiah(t.amount)})`);

    // 1. Fetch AI insights & quote (uses Gemini if API key exists, otherwise smart offline engine)
    const aiData = await fetchGeminiAiFinancialInsights(
      {
        totalIncome: summary.totalIncome || 0,
        totalExpense,
        balance: summary.balance || 0,
        topCategory,
        categoryPercentages,
        periodLabel,
        topTransactions,
        transactionsCount: transactions.length,
      },
      geminiApiKey,
      isIndonesian
    );

    // 2. Build Mobile-friendly HTML
    const htmlContent = buildReportHtml({
      transactions,
      summary,
      categoryStats,
      periodLabel,
      isIndonesian,
      aiData,
    });

    // 3. Print HTML to PDF file (request base64 representation to bypass Android spooler chmod restrictions)
    const printResult = await Print.printToFileAsync({
      html: htmlContent,
      base64: true,
    });

    const cleanDate = new Date().toISOString().slice(0, 10);
    const fileName = `DalAy_Report_${cleanDate}.pdf`;

    // 4. Safely write to FileSystem cacheDirectory so Android/iOS FileProvider allows ExpoSharing to read the file
    let finalShareUri = printResult.uri;
    const baseDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
    if (baseDir) {
      const targetUri = `${baseDir}${fileName}`;
      if (printResult.base64) {
        try {
          await FileSystem.writeAsStringAsync(targetUri, printResult.base64, {
            encoding: FileSystem.EncodingType.Base64,
          });
          finalShareUri = targetUri;
        } catch (writeErr) {
          console.warn('[PDF Generator] writeAsStringAsync failed, falling back to copyAsync:', writeErr);
          try {
            await FileSystem.copyAsync({
              from: printResult.uri,
              to: targetUri,
            });
            finalShareUri = targetUri;
          } catch (copyErr) {
            console.warn('[PDF Generator] copyAsync fallback also failed:', copyErr);
          }
        }
      } else {
        try {
          await FileSystem.copyAsync({
            from: printResult.uri,
            to: targetUri,
          });
          finalShareUri = targetUri;
        } catch (copyErr) {
          console.warn('[PDF Generator] Copy to cache directory failed, fallback to tempUri:', copyErr);
        }
      }
    }

    // 5. Share PDF file
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(finalShareUri, {
        UTI: '.pdf',
        mimeType: 'application/pdf',
        dialogTitle: isIndonesian ? 'Bagikan Laporan Keuangan DalAy' : 'Share DalAy Financial Report',
      });
    }

    return {
      success: true,
      uri: finalShareUri,
      fileName,
    };
  } catch (err) {
    console.error('[PDF Generator] Error generating report:', err);
    return {
      success: false,
      error: err.message || 'Gagal membuat laporan PDF',
    };
  }
};

export default {
  buildReportHtml,
  generateAndSharePdfReport,
};
