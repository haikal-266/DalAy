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
 * Category translation dictionary
 */
export const CATEGORY_TRANSLATIONS = {
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

export const translateCategory = (name, isIndonesian = true) => {
  if (isIndonesian || !name) return name;
  return CATEGORY_TRANSLATIONS[name] || name;
};

export const translatePeriod = (period, isIndonesian = true) => {
  if (isIndonesian || !period) return period || (isIndonesian ? 'Semua Periode' : 'All Periods');
  const p = period.trim();
  if (p.toLowerCase() === 'semua periode') return 'All Periods';
  if (p.toLowerCase() === 'bulan ini') return 'This Month';
  if (p.toLowerCase() === 'bulan lalu') return 'Last Month';
  if (p.toLowerCase() === 'tahun ini') return 'This Year';
  if (p.toLowerCase() === 'minggu ini') return 'This Week';
  if (p.toLowerCase() === 'kustom') return 'Custom Range';
  const idMonths = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const enMonths = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  let res = p;
  idMonths.forEach((m, idx) => {
    res = res.replace(new RegExp(m, 'i'), enMonths[idx]);
  });
  return res;
};

export const formatReportDate = (dateInput, isIndonesian = true, isShort = false) => {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';
  const day = d.getDate();
  const year = d.getFullYear();
  if (isIndonesian) {
    return formatDateIndo(dateInput, false, isShort);
  }
  const enShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const enFull = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const month = isShort ? enShort[d.getMonth()] : enFull[d.getMonth()];
  return isShort ? `${day} ${month} ${year}` : `${month} ${day}, ${year}`;
};

/**
 * Corporate executive palette (harmonious navy & slate shades)
 */
export const CORPORATE_PALETTE = [
  '#0F2942', // Deep Executive Navy
  '#1E40AF', // Blue 800
  '#0284C7', // Slate Sky
  '#3B82F6', // Blue 500
  '#475569', // Slate 600
  '#64748B', // Slate 500
  '#0D9488', // Teal 600
  '#94A3B8', // Slate 400
];

/**
 * Generate Clean Corporate SVG Donut Chart
 */
/**
 * Format markdown **bold** into HTML <strong> tags
 */
const formatInsightText = (text) => {
  if (!text) return '';
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
};

/**
 * Generate Clean Corporate SVG Donut Chart with Large Typography
 */
const renderSvgDonutChart = (categories = [], totalExpense = 0, isIndonesian = true) => {
  if (!categories || categories.length === 0 || totalExpense <= 0) {
    return `
      <div style="text-align: center; padding: 36px 0; color: #64748B; font-size: 11pt;">
        ${isIndonesian ? 'Tidak ada pengeluaran pada periode ini' : 'No expenses recorded in this period'}
      </div>
    `;
  }

  const radius = 62;
  const circumference = 2 * Math.PI * radius; // ~389.56
  let accumulatedOffset = 0;

  const segmentsHtml = categories.slice(0, 6).map((cat, idx) => {
    const percentage = (cat.amount / totalExpense) * 100;
    const strokeDash = (percentage / 100) * circumference;
    const offset = accumulatedOffset;
    accumulatedOffset += strokeDash;
    const color = CORPORATE_PALETTE[idx % CORPORATE_PALETTE.length];

    return `
      <circle
        cx="90"
        cy="90"
        r="${radius}"
        fill="transparent"
        stroke="${color}"
        stroke-width="24"
        stroke-dasharray="${strokeDash.toFixed(2)} ${circumference.toFixed(2)}"
        stroke-dashoffset="-${offset.toFixed(2)}"
        transform="rotate(-90 90 90)"
      />
    `;
  }).join('\n');

  const legendHtml = categories.slice(0, 6).map((cat, idx) => {
    const percentage = Math.round((cat.amount / totalExpense) * 100);
    const color = CORPORATE_PALETTE[idx % CORPORATE_PALETTE.length];
    const catName = translateCategory(cat.name, isIndonesian);
    return `
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; font-size: 11pt;">
        <div style="display: flex; align-items: center; gap: 8px;">
          <span style="width: 12px; height: 12px; border-radius: 3px; background-color: ${color}; display: inline-block; flex-shrink: 0;"></span>
          <span style="font-weight: 600; color: #1E293B;">${catName}</span>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <span style="font-weight: 700; color: #0F2942;">${formatRupiah(cat.amount)}</span>
          <span style="font-weight: 800; color: #64748B; width: 40px; text-align: right;">${percentage}%</span>
        </div>
      </div>
    `;
  }).join('\n');

  return `
    <div style="display: flex; align-items: center; justify-content: space-between; gap: 24px; margin: 8px 0;">
      <svg width="180" height="180" viewBox="0 0 180 180" style="flex-shrink: 0;">
        <circle cx="90" cy="90" r="${radius}" fill="transparent" stroke="#F1F5F9" stroke-width="24" />
        ${segmentsHtml}
        <circle cx="90" cy="90" r="46" fill="#FFFFFF" />
        <text x="90" y="85" text-anchor="middle" font-size="9pt" font-weight="700" fill="#64748B">TOTAL</text>
        <text x="90" y="100" text-anchor="middle" font-size="10.5pt" font-weight="900" fill="#0F2942">${categories.length} ${isIndonesian ? 'KATEGORI' : 'AREAS'}</text>
      </svg>
      <div style="flex: 1;">
        ${legendHtml}
      </div>
    </div>
  `;
};

/**
 * Generate Clean Corporate SVG Vertical Bar Chart (Full Width & Smart Uncut Labels)
 */
const renderSvgBarChart = (categories = [], totalExpense = 0, isIndonesian = true) => {
  if (!categories || categories.length === 0 || totalExpense <= 0) {
    return `
      <div style="text-align: center; padding: 36px 0; color: #64748B; font-size: 11pt;">
        ${isIndonesian ? 'Tidak ada pengeluaran pada periode ini' : 'No expenses recorded in this period'}
      </div>
    `;
  }

  const topCats = categories.slice(0, 5);
  const maxAmount = Math.max(...topCats.map((c) => c.amount), 1);
  const chartHeight = 110;
  const barWidth = 46;
  const totalWidth = 520;
  const spacing = totalWidth / Math.max(topCats.length, 1);

  const barsHtml = topCats.map((cat, idx) => {
    const barHeight = Math.max(Math.round((cat.amount / maxAmount) * chartHeight), 8);
    const x = idx * spacing + (spacing - barWidth) / 2;
    const y = 135 - barHeight;
    const color = CORPORATE_PALETTE[idx % CORPORATE_PALETTE.length];
    const pct = Math.round((cat.amount / totalExpense) * 100);
    const rawName = translateCategory(cat.name, isIndonesian);

    // Smart 2-line wrapping for long category names to ensure zero truncation and zero overlapping
    let line1 = rawName;
    let line2 = '';
    if (rawName.length > 11 && rawName.includes(' ')) {
      const words = rawName.split(' ');
      const mid = Math.ceil(words.length / 2);
      line1 = words.slice(0, mid).join(' ');
      line2 = words.slice(mid).join(' ');
    }

    const labelMarkup = line2
      ? `
        <text x="${(x + barWidth / 2).toFixed(1)}" y="153" text-anchor="middle" font-size="9.5pt" font-weight="700" fill="#334155">${line1}</text>
        <text x="${(x + barWidth / 2).toFixed(1)}" y="166" text-anchor="middle" font-size="9.5pt" font-weight="700" fill="#334155">${line2}</text>
      `
      : `
        <text x="${(x + barWidth / 2).toFixed(1)}" y="158" text-anchor="middle" font-size="9.5pt" font-weight="700" fill="#334155">${line1}</text>
      `;

    return `
      <g>
        <rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${barWidth}" height="${barHeight}" fill="${color}" rx="4" />
        <text x="${(x + barWidth / 2).toFixed(1)}" y="${(y - 6).toFixed(1)}" text-anchor="middle" font-size="10.5pt" font-weight="800" fill="#0F2942">${pct}%</text>
        ${labelMarkup}
        <text x="${(x + barWidth / 2).toFixed(1)}" y="184" text-anchor="middle" font-size="9pt" font-weight="600" fill="#64748B">${formatRupiah(cat.amount)}</text>
      </g>
    `;
  }).join('\n');

  return `
    <svg width="100%" height="200" viewBox="0 0 520 200" style="display: block; margin: 10px auto;">
      <!-- Horizontal reference lines -->
      <line x1="10" y1="25" x2="510" y2="25" stroke="#E2E8F0" stroke-dasharray="4,4" />
      <line x1="10" y1="80" x2="510" y2="80" stroke="#E2E8F0" stroke-dasharray="4,4" />
      <line x1="10" y1="135" x2="510" y2="135" stroke="#CBD5E1" stroke-width="2" />
      ${barsHtml}
    </svg>
  `;
};

/**
 * Generate Classic Professional A4 PDF HTML Template
 * Structured with Purpose-Driven Pages (Mobile-Optimized & Anti-Cutoff):
 * - Page 1: Executive Cashflow Summary & Balance Statement
 * - Page 2: Visual Expense Breakdown (Donut Chart & Unconstrained Bar Chart)
 * - Page 3: Executive Strategic Financial Analysis & Expert Principles
 * - Page 4+: Detailed Itemized Transaction Ledger
 */
export const buildReportHtml = ({
  transactions = [],
  summary = { totalIncome: 0, totalExpense: 0, balance: 0 },
  categoryStats = [],
  periodLabel = 'Semua Periode',
  isIndonesian = true,
  aiData = null,
}) => {
  const totalIncome = summary.totalIncome || 0;
  const totalExpense = summary.totalExpense || 0;
  const netSavings = summary.balance ?? (totalIncome - totalExpense);
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : (netSavings >= 0 ? 0 : -100);
  const isSurplus = netSavings >= 0;

  // Calculate Cashflow bar percentages
  const totalFlow = totalIncome + totalExpense;
  const incomePct = totalFlow > 0 ? Math.round((totalIncome / totalFlow) * 100) : 50;
  const expensePct = 100 - incomePct;

  // Localize Period Label
  const translatedPeriod = translatePeriod(periodLabel, isIndonesian);

  // Normalize categories if passed as array or store stats object
  const rawCategories = Array.isArray(categoryStats)
    ? categoryStats
    : (Array.isArray(categoryStats?.categories) ? categoryStats.categories : []);

  // Filter and sort expense categories
  const expenseCategories = rawCategories
    .filter((c) => c.type === 'expense' || c.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  // Executive Strategic Insights Cards: Split across Page 3 and Page 4 with enlarged mobile-friendly typography
  const renderInsightCard = (ins, idx, borderColor) => {
    if (!ins) return '';
    let headline = '';
    let bodyText = ins;

    const match = ins.match(/^\*\*(.*?)\*\*\s*(.*)$/s);
    if (match) {
      headline = match[1].replace(/:$/, '').trim();
      bodyText = match[2].replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    } else {
      bodyText = ins.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    }

    const headlineMarkup = headline
      ? `<div style="font-size: 14.5pt; font-weight: 800; color: #0F2942; margin-bottom: 10px; letter-spacing: -0.2px;">${headline}</div>`
      : '';

    return `
      <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-left: 5.5px solid ${borderColor}; border-radius: 8px; padding: 22px 26px; margin-bottom: 20px; page-break-inside: avoid; break-inside: avoid;">
        ${headlineMarkup}
        <div style="font-size: 13pt; line-height: 1.75; color: #1E293B;">
          ${bodyText}
        </div>
      </div>
    `;
  };

  const allInsights = aiData?.insights || [];
  const part1Insights = allInsights.slice(0, 2);
  const part2Insights = allInsights.slice(2);

  const page3CardsHtml = part1Insights.map((ins, idx) =>
    renderInsightCard(ins, idx, CORPORATE_PALETTE[idx % CORPORATE_PALETTE.length])
  ).join('\n');

  const page4CardsHtml = part2Insights.map((ins, idx) =>
    renderInsightCard(ins, idx + 2, CORPORATE_PALETTE[(idx + 2) % CORPORATE_PALETTE.length])
  ).join('\n');

  // Detailed Transaction Table Rows for Page 4+
  const sortedTx = [...transactions].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const txRowsHtml = sortedTx.map((tx, idx) => {
    const isInc = tx.type === 'income';
    const rowBg = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
    const sign = isInc ? '+' : '-';
    const amountColor = isInc ? '#047857' : '#0F2942';
    const dateFormatted = formatReportDate(tx.date, isIndonesian, true);
    const categoryName = translateCategory(tx.categoryName, isIndonesian);

    return `
      <tr style="background-color: ${rowBg};">
        <td style="padding: 9.5px 12px; font-size: 10pt; color: #64748B; white-space: nowrap;">
          ${dateFormatted}
        </td>
        <td style="padding: 9.5px 12px; font-size: 10.5pt; font-weight: 600; color: #0F172A;">
          ${tx.name || (isIndonesian ? 'Transaksi' : 'Transaction')}
        </td>
        <td style="padding: 9.5px 12px; font-size: 10pt; color: #475569;">
          ${categoryName || (isIndonesian ? 'Umum' : 'General')}
        </td>
        <td style="padding: 9.5px 12px; font-size: 10pt; color: #64748B;">
          ${tx.walletName || (isIndonesian ? 'Dompet' : 'Account')}
        </td>
        <td style="padding: 9.5px 12px; text-align: right; font-size: 10.5pt; font-weight: 700; color: ${amountColor}; white-space: nowrap; font-variant-numeric: tabular-nums;">
          ${sign}${formatRupiah(tx.amount)}
        </td>
      </tr>
    `;
  }).join('\n');

  const generatedDate = formatReportDate(new Date(), isIndonesian, false);

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
      margin: 12mm 14mm 12mm 14mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0F2942;
      background: #FFFFFF;
      font-size: 11pt;
      line-height: 1.5;
    }
    .page-wrapper {
      width: 100%;
    }
    .page-break {
      page-break-before: always;
      break-before: page;
      clear: both;
    }
    .no-break {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .section-title {
      font-size: 11pt;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #0F2942;
      margin-bottom: 12px;
      padding-bottom: 5px;
      border-bottom: 2px solid #CBD5E1;
    }
    table.report-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    table.report-table thead {
      display: table-header-group;
    }
    table.report-table tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }
    table.report-table th {
      background: #0F2942;
      color: #FFFFFF;
      font-size: 10.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 10px 12px;
      border: none;
      text-align: left;
    }
    table.report-table td {
      padding: 9.5px 12px;
      font-size: 10.5pt;
      border-bottom: 1px solid #E2E8F0;
      vertical-align: middle;
    }
  </style>
</head>
<body>
  <div class="page-wrapper">
    <!-- PAGE 1: EXECUTIVE CASHFLOW SUMMARY & BALANCE STATEMENT -->
    <div class="no-break" style="min-height: 255mm; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <!-- Modern Header Block -->
        <div style="margin-bottom: 18px; border-bottom: 2.5px solid #0F2942; padding-bottom: 10px;">
          <div style="font-size: 9.5pt; font-weight: 800; letter-spacing: 1.5px; color: #475569; text-transform: uppercase;">
            ${isIndonesian ? 'DALAY FINANCE &bull; LAPORAN KEUANGAN' : 'DALAY FINANCE &bull; FINANCIAL STATEMENT'}
          </div>
          <h1 style="font-size: 24pt; font-weight: 800; color: #0F2942; margin: 4px 0 2px 0; letter-spacing: -0.4px;">
            ${isIndonesian ? 'Laporan Arus Kas & Saldo' : 'Cashflow & Balance Statement'}
          </h1>
          <div style="font-size: 11pt; color: #64748B;">
            ${isIndonesian ? 'Periode' : 'Period'}: <strong>${translatedPeriod}</strong> &bull; ${isIndonesian ? 'Dicetak' : 'Generated'}: ${generatedDate} &bull; ${isIndonesian ? 'Mata Uang' : 'Currency'}: IDR
          </div>
        </div>

        <!-- Big Featured Card: Total Outflow -->
        <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-top: 4.5px solid #0F2942; border-radius: 6px; padding: 20px 24px; margin-bottom: 16px;">
          <div style="font-size: 11pt; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 4px;">
            ${isIndonesian ? 'TOTAL PENGELUARAN' : 'TOTAL EXPENSES'}
          </div>
          <div style="font-size: 30pt; font-weight: 900; color: #0F2942; letter-spacing: -0.6px; margin-bottom: 8px;">
            ${formatRupiah(totalExpense)}
          </div>
          <div style="font-size: 12pt; color: #475569; line-height: 1.6;">
            ${isIndonesian
              ? `Ringkasan akumulasi seluruh pengeluaran yang tercatat pada periode <strong>${translatedPeriod}</strong>.`
              : `Comprehensive summary of all outflows recorded during the <strong>${translatedPeriod}</strong> statement period.`}
          </div>
        </div>

        <!-- 2-Column Key Metrics (Inflow & Net Cashflow) -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-top: 3.5px solid #047857; border-radius: 6px; padding: 16px 20px;">
            <div style="font-size: 10.5pt; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
              ${isIndonesian ? 'TOTAL PEMASUKAN' : 'TOTAL INCOME'}
            </div>
            <div style="font-size: 22pt; font-weight: 900; color: #047857;">
              +${formatRupiah(totalIncome)}
            </div>
          </div>

          <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-top: 3.5px solid ${isSurplus ? '#0F2942' : '#991B1B'}; border-radius: 6px; padding: 16px 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="font-size: 10.5pt; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.5px;">
                ${isIndonesian ? 'ARUS KAS BERSIH' : 'NET CASHFLOW'}
              </span>
              <span style="font-size: 10pt; font-weight: 800; background: #E2E8F0; color: #0F2942; padding: 2px 8px; border-radius: 4px;">
                ${savingsRate}%
              </span>
            </div>
            <div style="font-size: 22pt; font-weight: 900; color: ${isSurplus ? '#0F2942' : '#991B1B'};">
              ${isSurplus ? '+' : ''}${formatRupiah(netSavings)}
            </div>
          </div>
        </div>

        <!-- Cashflow Proportion Bar Card -->
        <div style="background: #FFFFFF; border: 1.5px solid #E2E8F0; border-radius: 6px; padding: 16px 20px; margin-bottom: 16px;">
          <div style="font-size: 11pt; font-weight: 800; color: #0F2942; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px;">
            ${isIndonesian ? 'STRUKTUR ARUS KAS (MASUK VS KELUAR)' : 'CASHFLOW PROPORTION (INFLOW VS OUTFLOW)'}
          </div>
          <div style="display: flex; height: 14px; border-radius: 4px; overflow: hidden; background: #E2E8F0; margin-bottom: 8px;">
            <div style="width: ${incomePct}%; background: #0F2942;"></div>
            <div style="width: ${expensePct}%; background: ${isSurplus ? '#64748B' : '#991B1B'};"></div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 11pt; color: #1E293B; font-weight: 700;">
            <span style="color: #0F2942;">${isIndonesian ? 'Pemasukan' : 'Income'}: ${incomePct}%</span>
            <span style="color: #475569;">${isIndonesian ? 'Rasio Tabungan' : 'Savings Rate'}: ${savingsRate}%</span>
            <span style="color: ${isSurplus ? '#64748B' : '#991B1B'};">${isIndonesian ? 'Pengeluaran' : 'Expenses'}: ${expensePct}%</span>
          </div>
        </div>

        <!-- Spent vs. Saved Performance Callout Card -->
        <div style="background: #F8FAFC; border: 1.5px solid #E2E8F0; border-left: 4px solid #0F2942; border-radius: 6px; padding: 16px 20px;">
          <div style="font-size: 11.5pt; font-weight: 800; color: #0F2942; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">
            ${isIndonesian ? 'RINGKASAN KINERJA ARUS KAS' : 'CASHFLOW PERFORMANCE SUMMARY'}
          </div>
          <div style="font-size: 11.5pt; color: #334155; line-height: 1.65;">
            ${isIndonesian
              ? `Total pengeluaran tercatat sebesar <strong>${formatRupiah(totalExpense)}</strong> berbanding pemasukan <strong>${formatRupiah(totalIncome)}</strong>, menghasilkan saldo bersih <strong>${isSurplus ? '+' : ''}${formatRupiah(netSavings)}</strong> dengan tingkat tabungan <strong>${savingsRate}%</strong>.`
              : `Total recorded expenditures reached <strong>${formatRupiah(totalExpense)}</strong> against recorded income of <strong>${formatRupiah(totalIncome)}</strong>, delivering a net cashflow of <strong>${isSurplus ? '+' : ''}${formatRupiah(netSavings)}</strong> with a <strong>${savingsRate}%</strong> savings rate.`}
          </div>
        </div>
      </div>

      <!-- Page 1 Footer -->
      <div style="text-align: center; font-size: 9pt; color: #94A3B8; border-top: 1px solid #E2E8F0; padding-top: 10px; margin-top: 18px;">
        DalAy Finance &bull; ${isIndonesian ? 'Halaman 1 &bull; Ringkasan Eksekutif Arus Kas' : 'Page 1 &bull; Executive Cashflow Overview'}
      </div>
    </div>

    <!-- STRICT PAGE BREAK: Ensures Graphs Have Their Own Spacious Page 2 -->
    <div class="page-break"></div>

    <!-- PAGE 2: VISUAL EXPENSE BREAKDOWN (DONUT & FULL-WIDTH BAR CHART) -->
    <div class="no-break" style="min-height: 255mm; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <div style="margin-bottom: 18px; border-bottom: 2.5px solid #0F2942; padding-bottom: 10px;">
          <div style="font-size: 9.5pt; font-weight: 800; letter-spacing: 1.5px; color: #475569; text-transform: uppercase;">
            ${isIndonesian ? 'DALAY FINANCE &bull; ANALISIS VISUAL' : 'DALAY FINANCE &bull; VISUAL ANALYTICS'}
          </div>
          <h2 style="font-size: 22pt; font-weight: 800; color: #0F2942; margin: 4px 0 2px 0;">
            ${isIndonesian ? 'Distribusi Pengeluaran Per Kategori' : 'Expense Category Breakdown'}
          </h2>
          <div style="font-size: 11pt; color: #64748B;">
            ${isIndonesian ? 'Visualisasi proporsi belanja dan alokasi anggaran per kategori' : 'Visual breakdown of spending proportions and category allocations'}
          </div>
        </div>

        <!-- Donut Chart & Category Breakdown Card -->
        <div style="background: #FFFFFF; border: 1.5px solid #E2E8F0; border-radius: 6px; padding: 18px 22px; margin-bottom: 18px;">
          <div class="section-title">
            ${isIndonesian ? 'Proporsi Pengeluaran Per Kategori' : 'Expense Breakdown By Category'}
          </div>
          ${renderSvgDonutChart(expenseCategories, totalExpense, isIndonesian)}
        </div>

        <!-- Full Width Vertical Bar Chart Card -->
        <div style="background: #FFFFFF; border: 1.5px solid #E2E8F0; border-radius: 6px; padding: 18px 22px;">
          <div class="section-title">
            ${isIndonesian ? 'Grafik Belanja Terbesar' : 'Top Expense Categories'}
          </div>
          ${renderSvgBarChart(expenseCategories, totalExpense, isIndonesian)}
          <div style="font-size: 11pt; color: #64748B; line-height: 1.5; margin-top: 10px; border-top: 1px solid #F1F5F9; padding-top: 8px;">
            ${isIndonesian
              ? 'Pengeluaran diuraikan ke dalam kategori untuk melihat secara mendalam pos mana yang paling dominan menyerap anggaran Anda.'
              : 'Expenses are categorized to provide a clear, in-depth view of the primary cost drivers across your accounts.'}
          </div>
        </div>
      </div>

      <!-- Page 2 Footer -->
      <div style="text-align: center; font-size: 9pt; color: #94A3B8; border-top: 1px solid #E2E8F0; padding-top: 10px; margin-top: 18px;">
        DalAy Finance &bull; ${isIndonesian ? 'Halaman 2 &bull; Visualisasi & Distribusi Belanja' : 'Page 2 &bull; Visual Analytics & Expense Distribution'}
      </div>
    </div>

    <!-- STRICT PAGE BREAK: Ensures Strategic Advisory Part 1 Has Its Own Dedicated Page 3 -->
    <div class="page-break"></div>

    <!-- PAGE 3: EXECUTIVE FINANCIAL ANALYSIS (PART 1: CASHFLOW & CONSUMPTION) -->
    <div class="no-break" style="min-height: 250mm; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <div style="margin-bottom: 22px; border-bottom: 2.5px solid #0F2942; padding-bottom: 12px;">
          <div style="font-size: 10pt; font-weight: 800; letter-spacing: 1.5px; color: #475569; text-transform: uppercase;">
            ${isIndonesian ? 'DALAY FINANCE &bull; EVALUASI FINANSIAL' : 'DALAY FINANCE &bull; FINANCIAL EVALUATION'}
          </div>
          <h2 style="font-size: 23pt; font-weight: 800; color: #0F2942; margin: 4px 0 2px 0;">
            ${isIndonesian ? 'Analisis Arus Kas & Pola Konsumsi' : 'Cashflow Dynamics & Spending Analysis'}
          </h2>
          <div style="font-size: 11.5pt; color: #64748B;">
            ${isIndonesian ? 'Evaluasi mendalam likuiditas, rasio tabungan, dan pos belanja utama' : 'Comprehensive evaluation of liquidity health, savings rate, and primary cost drivers'}
          </div>
        </div>

        <!-- In-Depth Strategic Analytical Cards (Part 1) -->
        <div style="margin-bottom: 16px;">
          ${page3CardsHtml}
        </div>
      </div>

      <!-- Page 3 Footer -->
      <div style="text-align: center; font-size: 9.5pt; color: #94A3B8; border-top: 1px solid #E2E8F0; padding-top: 12px; margin-top: 20px;">
        DalAy Finance &bull; ${isIndonesian ? 'Halaman 3 &bull; Evaluasi Arus Kas & Pola Konsumsi' : 'Page 3 &bull; Cashflow & Consumption Analysis'}
      </div>
    </div>

    <!-- STRICT PAGE BREAK: Ensures Strategic Advisory Part 2 Has Its Own Dedicated Page 4 -->
    <div class="page-break"></div>

    <!-- PAGE 4: STRATEGIC ROADMAP & FINANCIAL PRINCIPLES (PART 2) -->
    <div class="no-break" style="min-height: 250mm; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <div style="margin-bottom: 22px; border-bottom: 2.5px solid #0F2942; padding-bottom: 12px;">
          <div style="font-size: 10pt; font-weight: 800; letter-spacing: 1.5px; color: #475569; text-transform: uppercase;">
            ${isIndonesian ? 'DALAY FINANCE &bull; STRATEGI & PANDUAN' : 'DALAY FINANCE &bull; STRATEGY & ROADMAP'}
          </div>
          <h2 style="font-size: 23pt; font-weight: 800; color: #0F2942; margin: 4px 0 2px 0;">
            ${isIndonesian ? 'Rekomendasi Anggaran & Kaidah Pakar' : 'Budget Roadmap & Expert Principles'}
          </h2>
          <div style="font-size: 11.5pt; color: #64748B;">
            ${isIndonesian ? 'Panduan taktis rencana anggaran periode depan dan prinsip finansial terpercaya' : 'Actionable budget frameworks, reserve allocations, and verified principles'}
          </div>
        </div>

        <!-- In-Depth Strategic Analytical Cards (Part 2) -->
        <div style="margin-bottom: 20px;">
          ${page4CardsHtml}
        </div>

        <!-- Financial Principle Card -->
        ${aiData?.citation?.quote ? `
          <div style="background: #FFFFFF; border: 1.5px solid #CBD5E1; border-left: 5px solid #1E40AF; border-radius: 8px; padding: 22px 26px; page-break-inside: avoid; break-inside: avoid;">
            <div style="font-size: 11pt; font-weight: 800; color: #1E40AF; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px;">
              ${isIndonesian ? 'Kaidah Finansial & Prinsip Kebijaksanaan' : 'Verified Financial Principle'}: ${aiData.citation.author}
            </div>
            <div style="font-size: 14pt; font-style: italic; color: #0F2942; line-height: 1.7; font-weight: 500; margin-bottom: 10px;">
              "${aiData.citation.quote}"
            </div>
            <div style="font-size: 11pt; color: #64748B; font-weight: 600;">
              ${isIndonesian ? 'Sumber Resmi' : 'Official Source'}: ${aiData.citation.source}
            </div>
          </div>
        ` : ''}
      </div>

      <!-- Page 4 Footer -->
      <div style="text-align: center; font-size: 9.5pt; color: #94A3B8; border-top: 1px solid #E2E8F0; padding-top: 12px; margin-top: 20px;">
        DalAy Finance &bull; ${isIndonesian ? 'Halaman 4 &bull; Rekomendasi Anggaran & Kaidah Pakar' : 'Page 4 &bull; Budget Roadmap & Principles'}
      </div>
    </div>

    <!-- STRICT PAGE BREAK: Ensures Transaction Ledger is at the Very End -->
    <div class="page-break"></div>

    <!-- PAGE 5+: DETAILED CHRONOLOGICAL TRANSACTION LEDGER -->
    <div style="padding-top: 4px;">
      <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px; border-bottom: 2.5px solid #0F2942; padding-bottom: 8px;">
        <div>
          <div style="font-size: 9.5pt; font-weight: 800; letter-spacing: 1.5px; color: #475569; text-transform: uppercase;">
            ${isIndonesian ? 'DALAY FINANCE &bull; BUKU BESAR' : 'DALAY FINANCE &bull; GENERAL LEDGER'}
          </div>
          <h2 style="font-size: 22pt; font-weight: 800; color: #0F2942; margin: 4px 0 2px 0;">
            ${isIndonesian ? 'Buku Catatan Transaksi' : 'Transaction Ledger'}
          </h2>
          <div style="font-size: 11pt; color: #64748B;">
            ${isIndonesian ? 'Rincian transaksi kronologis lengkap' : 'Detailed itemized chronological log'} &bull; ${translatedPeriod}
          </div>
        </div>
        <div style="font-size: 11.5pt; color: #475569; font-weight: 800;">
          ${transactions.length} ${isIndonesian ? 'catatan' : 'records'}
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
              <td colspan="5" style="text-align: center; padding: 32px 0; color: #94A3B8; font-style: italic; font-size: 11pt;">
                ${isIndonesian ? 'Tidak ada transaksi pada periode ini' : 'No transactions recorded in this period'}
              </td>
            </tr>
          `}
          <!-- Ledger Summary Rows -->
          <tr style="background: #F1F5F9; font-weight: 800; border-top: 2.5px solid #0F2942;">
            <td colspan="4" style="padding: 10px 12px; font-size: 11pt; color: #0F2942; text-transform: uppercase;">
              ${isIndonesian ? 'Total Pemasukan' : 'TOTAL INCOME'}
            </td>
            <td style="padding: 10px 12px; text-align: right; font-size: 11pt; color: #047857;">
              +${formatRupiah(totalIncome)}
            </td>
          </tr>
          <tr style="background: #F1F5F9; font-weight: 800;">
            <td colspan="4" style="padding: 10px 12px; font-size: 11pt; color: #0F2942; text-transform: uppercase;">
              ${isIndonesian ? 'Total Pengeluaran' : 'TOTAL EXPENSES'}
            </td>
            <td style="padding: 10px 12px; text-align: right; font-size: 11pt; color: #0F2942;">
              -${formatRupiah(totalExpense)}
            </td>
          </tr>
          <tr style="background: #E2E8F0; font-weight: 900; border-bottom: 2.5px solid #0F2942;">
            <td colspan="4" style="padding: 11px 12px; font-size: 11.5pt; color: #0F2942; text-transform: uppercase;">
              ${isIndonesian ? 'Arus Kas Bersih' : 'NET CASHFLOW'}
            </td>
            <td style="padding: 11px 12px; text-align: right; font-size: 11.5pt; color: ${isSurplus ? '#0F2942' : '#991B1B'};">
              ${isSurplus ? '+' : ''}${formatRupiah(netSavings)}
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Document Footer -->
      <div style="margin-top: 24px; text-align: center; font-size: 9.5pt; color: #64748B; border-top: 1px solid #E2E8F0; padding-top: 10px;">
        DalAy Finance &bull; ${isIndonesian ? 'Dokumen dicetak secara otomatis dari aplikasi DalAy (Daily Quran & Smart Finance).' : 'Official financial statement automatically compiled by DalAy (Daily Quran & Smart Finance).'}
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
  apiKey = '',
  aiData: customAiData = null,
}) => {
  try {
    const effectiveApiKey = (geminiApiKey || apiKey || '').trim();
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
    const aiData = customAiData || await fetchGeminiAiFinancialInsights(
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
      effectiveApiKey,
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
      isAiGenerated: Boolean(aiData?.isAiGenerated),
      fallbackReason: aiData?.fallbackReason || (aiData?.isAiGenerated ? null : 'local_engine'),
      model: aiData?.model || null,
      aiData,
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
