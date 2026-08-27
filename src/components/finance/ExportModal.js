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
import { exportTransactionsToExcel } from '../../services/excelExport';
import { formatRupiah } from '../../utils/formatters';

export const ExportModal = ({
  visible,
  onClose,
  onSuccess,
  onError,
  transactions = [],
  summary = { totalIncome: 0, totalExpense: 0, balance: 0 },
  periodLabel,
}) => {
  const { colors } = useTheme();
  const { t, isIndonesian } = useLanguage();
  const [exporting, setExporting] = useState(false);
  const [alertConfig, setAlertConfig] = useState(null); // { visible, title, message, type, confirmText, onConfirm }

  const resolvedPeriodLabel = periodLabel || t('finance.allPeriods', 'Semua Periode');

  const handleExport = async () => {
    if (transactions.length === 0) {
      setAlertConfig({
        title: isIndonesian ? 'Belum Ada Data' : 'No Data Available',
        message: isIndonesian
          ? 'Tidak ada catatan transaksi keuangan yang dapat diekspor pada periode ini.'
          : 'There are no financial records available to export for this period.',
        type: 'warning',
        showCancel: false,
        confirmText: isIndonesian ? 'Tutup' : 'Close',
      });
      return;
    }

    setExporting(true);
    const res = await exportTransactionsToExcel(transactions, summary, resolvedPeriodLabel);
    setExporting(false);
    onClose();

    if (res.success) {
      if (typeof onSuccess === 'function') {
        onSuccess(res.fileName);
      }
    } else {
      if (typeof onError === 'function') {
        onError(
          res.error ||
          (isIndonesian
            ? 'Terjadi kesalahan saat membuat file Excel.'
            : 'An error occurred while creating Excel file.')
        );
      }
    }
  };

  return (
    <>
      <NeoModal
        visible={visible}
        onClose={onClose}
        title={t('modal.exportTitle', 'Ekspor ke Excel (.xlsx)')}
        subtitle={t('modal.exportSubtitle', 'Unduh dan bagikan pembukuan keuangan Anda')}
        footer={
          <NeoButton
            title={exporting ? t('modal.exporting', 'Membuat File Excel...') : t('modal.exportDownload', 'Unduh File Excel')}
            iconName="download-outline"
            variant="income"
            loading={exporting}
            onPress={handleExport}
            fullWidth
          />
        }
      >
        {/* Overview Card */}
        <NeoCard variant="white" padding={14} style={styles.summaryCard}>
          <View style={styles.summaryTitleRow}>
            <Ionicons name="document-text-outline" size={16} color={colors.primary} />
            <Text style={[styles.summaryTitle, { color: colors.text }]}>
              {t('modal.exportSummaryTitle', 'RINGKASAN YANG AKAN DIEKSPOR :')}
            </Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              {t('modal.periodLabel', 'Periode Transaksi')}
            </Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{resolvedPeriodLabel}</Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              {t('modal.rowCountLabel', 'Jumlah Catatan')}
            </Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {transactions.length} {isIndonesian ? 'Baris' : 'Rows'}
            </Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              {t('finance.income', 'Total Pemasukan')}
            </Text>
            <Text style={[styles.metricValue, { color: colors.incomeDark }]}>
              +{formatRupiah(summary.totalIncome)}
            </Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              {t('finance.expense', 'Total Pengeluaran')}
            </Text>
            <Text style={[styles.metricValue, { color: colors.expenseDark }]}>
              -{formatRupiah(summary.totalExpense)}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

          <View style={styles.metricRow}>
            <Text style={[styles.metricLabelBold, { color: colors.text }]}>
              {t('finance.totalBalance', 'Sisa Saldo Bersih')}
            </Text>
            <Text style={[styles.metricValueBold, { color: colors.primaryDark }]}>
              {formatRupiah(summary.balance)}
            </Text>
          </View>
        </NeoCard>

        {/* Sheet details box */}
        <View
          style={[
            styles.sheetsInfo,
            {
              backgroundColor: colors.surfaceLight,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.sheetsTitleRow}>
            <Ionicons name="layers-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.sheetsInfoTitle, { color: colors.textSecondary }]}>
              {isIndonesian ? 'STRUKTUR FILE SPREADSHEET :' : 'SPREADSHEET STRUCTURE :'}
            </Text>
          </View>

          <View style={styles.sheetItem}>
            <Ionicons name="checkmark-circle" size={14} color={colors.incomeDark} style={styles.sheetCheck} />
            <Text style={[styles.sheetDesc, { color: colors.textSecondary }]}>
              <Text style={[styles.sheetBold, { color: colors.text }]}>Sheet 1 ({isIndonesian ? 'Daftar Transaksi' : 'Transactions'}):</Text> {isIndonesian ? 'Tanggal, Waktu, Kategori, Keterangan & Nominal.' : 'Date, Time, Category, Name & Amount.'}
            </Text>
          </View>
          <View style={styles.sheetItem}>
            <Ionicons name="checkmark-circle" size={14} color={colors.incomeDark} style={styles.sheetCheck} />
            <Text style={[styles.sheetDesc, { color: colors.textSecondary }]}>
              <Text style={[styles.sheetBold, { color: colors.text }]}>Sheet 2 ({isIndonesian ? 'Rekap Kategori' : 'Categories'}):</Text> {isIndonesian ? 'Total per kategori dan frekuensi transaksi.' : 'Total per category and transaction frequencies.'}
            </Text>
          </View>
          <View style={styles.sheetItem}>
            <Ionicons name="checkmark-circle" size={14} color={colors.incomeDark} style={styles.sheetCheck} />
            <Text style={[styles.sheetDesc, { color: colors.textSecondary }]}>
              <Text style={[styles.sheetBold, { color: colors.text }]}>Sheet 3 ({isIndonesian ? 'Ringkasan' : 'Summary'}):</Text> {isIndonesian ? 'Neraca saldo dan total debit/kredit.' : 'Balance summary and total debit/credit.'}
            </Text>
          </View>
        </View>
      </NeoModal>

      {/* In-Modal Neo Confirm / Feedback Dialog */}
      {alertConfig && (
        <ConfirmModal
          insideModal={true}
          visible={Boolean(alertConfig)}
          onClose={() => setAlertConfig(null)}
          onConfirm={alertConfig.onConfirm}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          iconName={alertConfig.iconName}
          confirmText={alertConfig.confirmText}
          cancelText={isIndonesian ? 'Tutup' : 'Close'}
          showCancel={alertConfig.showCancel !== false}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  summaryCard: {
    marginBottom: 12,
  },
  summaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  metricLabelBold: {
    fontSize: 12,
    fontWeight: '800',
  },
  metricValueBold: {
    fontSize: 14,
    fontWeight: '900',
  },
  sheetsInfo: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 6,
  },
  sheetsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sheetsInfoTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 2,
  },
  sheetCheck: {
    marginRight: 6,
    marginTop: 2,
  },
  sheetDesc: {
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  sheetBold: {
    fontWeight: '700',
  },
});

export default ExportModal;
