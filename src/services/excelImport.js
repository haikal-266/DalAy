import * as XLSX from 'xlsx';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, detectCategory } from '../utils/categories';

/**
 * Pick and Parse an Excel / CSV spreadsheet into transaction objects
 * @returns {Promise<{success: boolean, transactions?: Array, fileName?: string, count?: number, error?: string}>}
 */
export const pickAndImportExcel = async () => {
  try {
    // 1. Pick Document
    const result = await DocumentPicker.getDocumentAsync({
      type: [
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-excel',
        'text/csv',
        'text/comma-separated-values',
        'application/csv',
        '*/*',
      ],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { canceled: true, success: false };
    }

    const file = result.assets[0];
    const fileName = file.name || 'imported_file.xlsx';
    let workbook;

    // 2. Read file content based on platform
    if (Platform.OS === 'web') {
      if (file.file) {
        const arrayBuffer = await file.file.arrayBuffer();
        workbook = XLSX.read(arrayBuffer, { type: 'array' });
      } else {
        const res = await fetch(file.uri);
        const arrayBuffer = await res.arrayBuffer();
        workbook = XLSX.read(arrayBuffer, { type: 'array' });
      }
    } else {
      // Native (Android / iOS)
      const base64Content = await FileSystem.readAsStringAsync(file.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      workbook = XLSX.read(base64Content, { type: 'base64' });
    }

    if (!workbook || !workbook.SheetNames || workbook.SheetNames.length === 0) {
      return { success: false, error: 'File Excel tidak memiliki lembar kerja (sheet) yang valid.' };
    }

    // 3. Parse first sheet or "Daftar Transaksi" / "Sheet1"
    const sheetName =
      workbook.SheetNames.find((s) => s.toLowerCase().includes('transaksi') || s.toLowerCase().includes('sheet1')) ||
      workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (!rawRows || rawRows.length === 0) {
      return { success: false, error: 'Lembar kerja Excel kosong atau tidak memiliki data.' };
    }

    // 4. Map rows to standard DalAy transaction objects
    const parsedTransactions = [];

    for (const row of rawRows) {
      // Look for field matches across various column header conventions
      const nameRaw =
        row['Keterangan'] ||
        row['keterangan'] ||
        row['Nama'] ||
        row['nama'] ||
        row['Description'] ||
        row['description'] ||
        row['Name'] ||
        row['name'] ||
        row['Item'] ||
        row['item'] ||
        '';

      const amountRaw =
        row['Nominal (Rp)'] ||
        row['Nominal'] ||
        row['nominal'] ||
        row['Amount'] ||
        row['amount'] ||
        row['Jumlah'] ||
        row['jumlah'] ||
        row['Total'] ||
        row['total'] ||
        0;

      const typeRaw = (
        row['Jenis'] ||
        row['jenis'] ||
        row['Type'] ||
        row['type'] ||
        ''
      ).toString().toLowerCase();

      const dateRaw =
        row['Tanggal'] ||
        row['tanggal'] ||
        row['Date'] ||
        row['date'] ||
        '';

      const timeRaw =
        row['Waktu'] ||
        row['waktu'] ||
        row['Time'] ||
        row['time'] ||
        '';

      const categoryRaw =
        row['Kategori'] ||
        row['kategori'] ||
        row['Category'] ||
        row['category'] ||
        '';

      // Parse Amount
      const cleanAmount = typeof amountRaw === 'number'
        ? Math.abs(amountRaw)
        : Number.parseInt(String(amountRaw).replace(/[^0-9]/g, ''), 10) || 0;

      if (!nameRaw && cleanAmount <= 0) continue; // Skip invalid empty rows

      // Determine Type (Expense vs Income)
      let type = 'expense';
      if (
        typeRaw.includes('masuk') ||
        typeRaw.includes('in') ||
        typeRaw.includes('pendapatan') ||
        typeRaw.includes('gaji')
      ) {
        type = 'income';
      }

      // Determine Category
      const autoCat = detectCategory(String(nameRaw) + ' ' + String(categoryRaw), type);
      const defaultCat =
        type === 'income'
          ? INCOME_CATEGORIES[INCOME_CATEGORIES.length - 1]
          : EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1];
      const category = autoCat || defaultCat;

      // Determine Date
      let txDate = new Date();
      if (dateRaw) {
        const parsedDate = new Date(dateRaw);
        if (!isNaN(parsedDate.getTime())) {
          txDate = parsedDate;
        }
      }

      const txItem = {
        id: `tx_imported_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        type,
        name: String(nameRaw || 'Transaksi Impor').trim(),
        amount: cleanAmount,
        categoryId: category.id,
        categoryName: category.name,
        categoryIcon: category.icon,
        iconName: category.iconName || 'cube',
        iconFamily: category.iconFamily || 'Ionicons',
        categoryColor: category.color,
        categoryBgColor: category.bgColor || '#F1F5F9',
        date: txDate.toISOString(),
        rawText: `[Import] ${nameRaw} ${cleanAmount}`,
      };

      parsedTransactions.push(txItem);
    }

    if (parsedTransactions.length === 0) {
      return {
        success: false,
        error: 'Tidak ada baris transaksi yang berhasil diuraikan dari file ini. Pastikan format kolom memiliki kolom Nama/Keterangan dan Nominal.',
      };
    }

    return {
      success: true,
      transactions: parsedTransactions,
      count: parsedTransactions.length,
      fileName,
    };
  } catch (error) {
    console.log('Error importing Excel file:', error);
    return {
      success: false,
      error: error.message || 'Terjadi kesalahan saat membaca file Excel.',
    };
  }
};

export default {
  pickAndImportExcel,
};
