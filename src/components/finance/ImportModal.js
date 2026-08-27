import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../../theme/typography';
import { NeoModal } from '../neo/NeoModal';
import { NeoButton } from '../neo/NeoButton';
import { NeoCard } from '../neo/NeoCard';
import { ConfirmModal } from '../neo/ConfirmModal';
import { useTheme } from '../../stores/themeStore';
import { useLanguage } from '../../stores/languageStore';
import { useFinance } from '../../stores/financeStore';
import { pickAndImportExcel } from '../../services/excelImport';
import { formatRupiah, formatDateIndo } from '../../utils/formatters';

export const ImportModal = ({ visible, onClose, onSuccess, onError }) => {
  const { colors } = useTheme();
  const { t, isIndonesian } = useLanguage();
  const { importTransactions } = useFinance();

  const [loadingFile, setLoadingFile] = useState(false);
  const [importedPreview, setImportedPreview] = useState(null); // { fileName, count, transactions }
  const [alertConfig, setAlertConfig] = useState(null);

  const resetState = () => {
    setImportedPreview(null);
    setLoadingFile(false);
    setAlertConfig(null);
  };

  const handlePickFile = async () => {
    setLoadingFile(true);
    const result = await pickAndImportExcel();
    setLoadingFile(false);

    if (result.canceled) {
      return;
    }

    if (result.success && result.transactions && result.transactions.length > 0) {
      setImportedPreview(result);
    } else {
      setAlertConfig({
        title: isIndonesian ? 'Gagal Membaca File' : 'Failed to Read File',
        message:
          result.error ||
          (isIndonesian
            ? 'Format file tidak didukung atau tidak ada data transaksi yang valid.'
            : 'Unsupported file format or no valid transaction data found.'),
        type: 'danger',
        showCancel: false,
        confirmText: isIndonesian ? 'Tutup' : 'Close',
        onConfirm: () => setAlertConfig(null),
      });
    }
  };

  const handleConfirmImport = async () => {
    if (!importedPreview || !importedPreview.transactions) return;

    const count = importedPreview.transactions.length;
    const res = await importTransactions(importedPreview.transactions);
    resetState();
    onClose();

    if (res.success) {
      const importedCount = res.count || count;
      if (typeof onSuccess === 'function') {
        onSuccess(importedCount);
      }
    } else {
      if (typeof onError === 'function') {
        onError(
          res.error ||
            res.message ||
            (isIndonesian
              ? 'Terjadi kesalahan saat menyimpan catatan transaksi.'
              : 'An error occurred while importing transactions.')
        );
      }
    }
  };

  // Compute preview summary
  const previewSummary = React.useMemo(() => {
    if (!importedPreview?.transactions) return { income: 0, expense: 0 };
    let income = 0;
    let expense = 0;
    importedPreview.transactions.forEach((t) => {
      if (t.type === 'income') income += t.amount || 0;
      else expense += t.amount || 0;
    });
    return { income, expense };
  }, [importedPreview]);

  return (
    <>
      <NeoModal
        visible={visible}
        onClose={() => {
          resetState();
          onClose();
        }}
        title={isIndonesian ? 'Impor Data (.xlsx / .csv)' : 'Import Data (.xlsx / .csv)'}
        subtitle={isIndonesian ? 'Unggah pembukuan dari spreadsheet Excel' : 'Upload financial records from Excel'}
        footer={
          importedPreview ? (
            <View style={styles.footerRow}>
              <NeoButton
                title={isIndonesian ? 'Pilih File Lain' : 'Pick Another'}
                variant="secondary"
                onPress={handlePickFile}
                loading={loadingFile}
                style={styles.halfBtn}
              />
              <NeoButton
                title={isIndonesian ? `Impor ${importedPreview.count} Data` : `Import ${importedPreview.count} Items`}
                variant="income"
                iconName="checkmark-circle-outline"
                onPress={handleConfirmImport}
                style={styles.halfBtn}
              />
            </View>
          ) : (
            <NeoButton
              title={loadingFile ? (isIndonesian ? 'Membaca File...' : 'Reading File...') : (isIndonesian ? 'Pilih File Excel / CSV' : 'Select Excel / CSV File')}
              iconName="folder-open-outline"
              variant="accent"
              loading={loadingFile}
              onPress={handlePickFile}
              fullWidth
            />
          )
        }
      >
        {!importedPreview ? (
          <View style={styles.instructionContainer}>
            {/* Supported formats card */}
            <NeoCard variant="white" padding={16} style={styles.infoCard}>
              <View style={styles.iconCircle}>
                <Ionicons name="cloud-upload-outline" size={28} color={colors.primary} />
              </View>
              <Text style={[styles.infoTitle, { color: colors.text }]}>
                {isIndonesian ? 'Pilih File Spreadsheet Anda' : 'Select Your Spreadsheet File'}
              </Text>
              <Text style={[styles.infoSubtitle, { color: colors.textSecondary }]}>
                {isIndonesian
                  ? 'Aplikasi mendukung file Excel (.xlsx, .xls) dan CSV (.csv) dari DalAy atau aplikasi catatan lainnya.'
                  : 'Supports Excel (.xlsx, .xls) and CSV (.csv) files from DalAy or other bookkeeping tools.'}
              </Text>
            </NeoCard>

            {/* Template hint */}
            <View
              style={[
                styles.formatHintBox,
                {
                  backgroundColor: colors.surfaceLight,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.hintTitleRow}>
                <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
                <Text style={[styles.hintTitle, { color: colors.primaryDark }]}>
                  {isIndonesian ? 'KOLOM YANG DIDUKUNG :' : 'SUPPORTED COLUMNS :'}
                </Text>
              </View>
              <Text style={[styles.hintText, { color: colors.textSecondary }]}>
                • <Text style={styles.boldText}>{isIndonesian ? 'Nama / Keterangan' : 'Name / Description'}:</Text> {isIndonesian ? 'Nama transaksi' : 'Transaction name'}
              </Text>
              <Text style={[styles.hintText, { color: colors.textSecondary }]}>
                • <Text style={styles.boldText}>{isIndonesian ? 'Nominal / Amount' : 'Amount / Total'}:</Text> {isIndonesian ? 'Angka rupiah' : 'Monetary number'}
              </Text>
              <Text style={[styles.hintText, { color: colors.textSecondary }]}>
                • <Text style={styles.boldText}>{isIndonesian ? 'Jenis / Type' : 'Type'}:</Text> {isIndonesian ? 'Pengeluaran atau Pemasukan' : 'Expense or Income'}
              </Text>
              <Text style={[styles.hintText, { color: colors.textSecondary }]}>
                • <Text style={styles.boldText}>{isIndonesian ? 'Tanggal & Kategori' : 'Date & Category'}:</Text> {isIndonesian ? 'Opsional (otomatis terdeteksi)' : 'Optional (auto-detected)'}
              </Text>
            </View>
          </View>
        ) : (
          /* Preview of imported data */
          <View style={styles.previewContainer}>
            {/* File info banner */}
            <NeoCard variant="accent" padding={12} style={styles.previewBanner}>
              <View style={styles.bannerRow}>
                <Ionicons name="document-attach" size={24} color={colors.primary} />
                <View style={styles.bannerInfo}>
                  <Text style={[styles.fileNameText, { color: colors.text }]} numberOfLines={1}>
                    {importedPreview.fileName}
                  </Text>
                  <Text style={[styles.fileCountText, { color: colors.primaryDark }]}>
                    {importedPreview.count} {isIndonesian ? 'catatan transaksi terdeteksi' : 'transactions ready'}
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

              <View style={styles.statsRow}>
                <View style={styles.statCol}>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                    {isIndonesian ? 'Total Pemasukan' : 'Total Income'}
                  </Text>
                  <Text style={[styles.statVal, { color: colors.incomeDark }]}>
                    +{formatRupiah(previewSummary.income)}
                  </Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                    {isIndonesian ? 'Total Pengeluaran' : 'Total Expense'}
                  </Text>
                  <Text style={[styles.statVal, { color: colors.expenseDark }]}>
                    -{formatRupiah(previewSummary.expense)}
                  </Text>
                </View>
              </View>
            </NeoCard>

            <Text style={[styles.previewListTitle, { color: colors.textSecondary }]}>
              {isIndonesian ? 'PREVIEW BEBERAPA DATA AWAL :' : 'PREVIEW INITIAL ROWS :'}
            </Text>

            <View style={styles.sampleList}>
              {importedPreview.transactions.slice(0, 5).map((tx, idx) => (
                <View
                  key={tx.id || idx}
                  style={[
                    styles.sampleRow,
                    {
                      backgroundColor: colors.surfaceLight,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.sampleLeft}>
                    <Text style={[styles.sampleName, { color: colors.text }]} numberOfLines={1}>
                      {tx.name}
                    </Text>
                    <Text style={[styles.sampleCategory, { color: colors.textSecondary }]}>
                      {tx.categoryName} • {formatDateIndo(tx.date, true, false)}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.sampleAmount,
                      { color: tx.type === 'income' ? colors.incomeDark : colors.expenseDark },
                    ]}
                  >
                    {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                  </Text>
                </View>
              ))}
              {importedPreview.transactions.length > 5 && (
                <Text style={[styles.moreText, { color: colors.textMuted }]}>
                  +{importedPreview.transactions.length - 5} {isIndonesian ? 'transaksi lainnya...' : 'more records...'}
                </Text>
              )}
            </View>
          </View>
        )}
      </NeoModal>

      {/* In-Modal Modern Alert / Confirmation Dialog */}
      {alertConfig && (
        <ConfirmModal
          insideModal={true}
          visible={Boolean(alertConfig)}
          onClose={() => setAlertConfig(null)}
          onConfirm={alertConfig.onConfirm || (() => setAlertConfig(null))}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          iconName={alertConfig.iconName}
          confirmText={alertConfig.confirmText || (isIndonesian ? 'Tutup' : 'Close')}
          showCancel={alertConfig.showCancel !== false}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  instructionContainer: {
    gap: 12,
  },
  infoCard: {
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: 4,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  infoTitle: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  infoSubtitle: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  formatHintBox: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  hintTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  hintTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  hintText: {
    fontSize: 11,
    lineHeight: 16,
  },
  boldText: {
    fontWeight: '700',
  },
  previewContainer: {
    gap: 10,
  },
  previewBanner: {
    marginBottom: 4,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bannerInfo: {
    flex: 1,
  },
  fileNameText: {
    fontSize: 13,
    fontWeight: '800',
  },
  fileCountText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  statVal: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 1,
  },
  previewListTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  sampleList: {
    gap: 6,
  },
  sampleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  sampleLeft: {
    flex: 1,
    marginRight: 8,
  },
  sampleName: {
    fontSize: 12,
    fontWeight: '700',
  },
  sampleCategory: {
    fontSize: 10,
    marginTop: 1,
  },
  sampleAmount: {
    fontSize: 12,
    fontWeight: '800',
  },
  moreText: {
    fontSize: 11,
    textAlign: 'center',
    marginVertical: 4,
    fontStyle: 'italic',
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  halfBtn: {
    flex: 1,
  },
});

export default ImportModal;
