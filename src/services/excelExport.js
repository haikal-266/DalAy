import * as XLSX from 'xlsx';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { formatDateIndo, formatTimeIndo } from '../utils/formatters';

/**
 * Generate and Export Excel Spreadsheet for Financial Transactions
 * 
 * @param {Array} transactions - Array of transaction objects
 * @param {Object} summary - { totalIncome, totalExpense, balance }
 * @param {string} periodName - e.g. "Semua", "Bulan Ini"
 * @returns {Promise<{success: boolean, uri?: string, error?: string}>}
 */
export const exportTransactionsToExcel = async (
  transactions = [],
  summary = { totalIncome: 0, totalExpense: 0, balance: 0 },
  periodName = 'Semua'
) => {
  try {
    if (!transactions || transactions.length === 0) {
      return { success: false, error: 'Tidak ada transaksi untuk diekspor.' };
    }

    const getJenisLabel = (t) => {
      if (t.type === 'adjustment' || t.categoryId === 'cat_adjustment') {
        return 'Penyesuaian';
      }
      return t.type === 'income' ? 'Pemasukan' : 'Pengeluaran';
    };

    // 1. Sheet 1: Detail Transaksi
    const txRows = transactions.map((t, index) => ({
      'No': index + 1,
      'Tanggal': formatDateIndo(t.date, false, false),
      'Waktu': formatTimeIndo(t.date),
      'Jenis': getJenisLabel(t),
      'Kategori': `${t.categoryIcon || ''} ${t.categoryName || '-'}`,
      'Keterangan': t.name || '-',
      'Nominal (Rp)': t.amount || 0,
      'Catatan Asli': t.rawText || '',
    }));

    // 2. Sheet 2: Rekap Per Kategori
    const categoryMap = {};
    transactions.forEach((t) => {
      const jenis = getJenisLabel(t);
      const key = `${jenis}_${t.categoryName}`;
      if (!categoryMap[key]) {
        categoryMap[key] = {
          'Jenis': jenis,
          'Kategori': `${t.categoryIcon || ''} ${t.categoryName || '-'}`,
          'Jumlah Transaksi': 0,
          'Total Nominal (Rp)': 0,
        };
      }
      categoryMap[key]['Jumlah Transaksi'] += 1;
      categoryMap[key]['Total Nominal (Rp)'] += t.amount || 0;
    });

    const categoryRows = Object.values(categoryMap);

    // 3. Sheet 3: Ringkasan Total
    const summaryRows = [
      { 'Parameter': 'Periode Ekspor', 'Nilai': periodName },
      { 'Parameter': 'Tanggal Dibuat', 'Nilai': formatDateIndo(new Date(), true, false) },
      { 'Parameter': 'Total Transaksi', 'Nilai': transactions.length },
      { 'Parameter': 'Total Pemasukan (Rp)', 'Nilai': summary.totalIncome || 0 },
      { 'Parameter': 'Total Pengeluaran (Rp)', 'Nilai': summary.totalExpense || 0 },
      { 'Parameter': 'Sisa Saldo Bersih (Rp)', 'Nilai': summary.balance || 0 },
    ];

    // Create workbook and append sheets
    const wb = XLSX.utils.book_new();

    const wsTx = XLSX.utils.json_to_sheet(txRows);
    XLSX.utils.book_append_sheet(wb, wsTx, 'Daftar Transaksi');

    const wsCat = XLSX.utils.json_to_sheet(categoryRows);
    XLSX.utils.book_append_sheet(wb, wsCat, 'Rekap Kategori');

    const wsSum = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSum, 'Ringkasan');

    // Generate binary base64 string
    const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

    const fileName = `DalAy_Laporan_Keuangan_${new Date().toISOString().slice(0, 10)}.xlsx`;

    // Handle Web Browser Download
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.document) {
        const byteCharacters = atob(wbout);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
      return { success: true, fileName };
    }

    // Handle Mobile Native Share
    const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
    await FileSystem.writeAsStringAsync(fileUri, wbout, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: 'Bagikan / Simpan Laporan Keuangan Excel',
        UTI: 'com.microsoft.excel.xlsx',
      });
      return { success: true, uri: fileUri, fileName };
    } else {
      return { success: true, uri: fileUri, fileName, message: `File tersimpan di: ${fileUri}` };
    }
  } catch (error) {
    console.log('Error exporting Excel:', error);
    return { success: false, error: error.message };
  }
};

export default {
  exportTransactionsToExcel,
};
