import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../../theme/typography';
import { NeoModal } from '../neo/NeoModal';
import { NeoButton } from '../neo/NeoButton';
import { NeoCard } from '../neo/NeoCard';
import { useTheme } from '../../stores/themeStore';
import { exportTransactionsToExcel } from '../../services/excelExport';
import { formatRupiah } from '../../utils/formatters';

export const ExportModal = ({
  visible,
  onClose,
  transactions = [],
  summary = { totalIncome: 0, totalExpense: 0, balance: 0 },
  periodName = 'Semua',
}) => {
  const { colors } = useTheme();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (transactions.length === 0) {
      Alert.alert('Perhatian', 'Tidak ada data transaksi untuk diekspor.');
      return;
    }

    setExporting(true);
    const res = await exportTransactionsToExcel(transactions, summary, periodName);
    setExporting(false);

    if (res.success) {
      Alert.alert(
        'Berhasil!',
        `Laporan Excel (${res.fileName}) telah siap diunduh/dibagikan.`
      );
      onClose();
    } else {
      Alert.alert('Gagal Ekspor', res.error || 'Terjadi kesalahan saat membuat file Excel.');
    }
  };

  return (
    <NeoModal
      visible={visible}
      onClose={onClose}
      title="Ekspor ke Excel (.xlsx)"
      subtitle="Unduh dan bagikan pembukuan keuangan Anda"
      footer={
        <NeoButton
          title={exporting ? 'Membuat File Excel...' : 'Unduh File Excel'}
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
            RINGKASAN YANG AKAN DIEKSPOR :
          </Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Periode Transaksi</Text>
          <Text style={[styles.metricValue, { color: colors.text }]}>{periodName}</Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Jumlah Catatan</Text>
          <Text style={[styles.metricValue, { color: colors.text }]}>{transactions.length} Baris</Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Total Pemasukan</Text>
          <Text style={[styles.metricValue, { color: colors.incomeDark }]}>
            +{formatRupiah(summary.totalIncome)}
          </Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Total Pengeluaran</Text>
          <Text style={[styles.metricValue, { color: colors.expenseDark }]}>
            -{formatRupiah(summary.totalExpense)}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

        <View style={styles.metricRow}>
          <Text style={[styles.metricLabelBold, { color: colors.text }]}>Sisa Saldo Bersih</Text>
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
            STRUKTUR FILE SPREADSHEET :
          </Text>
        </View>

        <View style={styles.sheetItem}>
          <Ionicons name="checkmark-circle" size={14} color={colors.incomeDark} style={styles.sheetCheck} />
          <Text style={[styles.sheetDesc, { color: colors.textSecondary }]}>
            <Text style={[styles.sheetBold, { color: colors.text }]}>Sheet 1 (Daftar Transaksi):</Text> Tanggal, Waktu, Kategori, Keterangan & Nominal.
          </Text>
        </View>
        <View style={styles.sheetItem}>
          <Ionicons name="checkmark-circle" size={14} color={colors.incomeDark} style={styles.sheetCheck} />
          <Text style={[styles.sheetDesc, { color: colors.textSecondary }]}>
            <Text style={[styles.sheetBold, { color: colors.text }]}>Sheet 2 (Rekap Kategori):</Text> Total per kategori dan frekuensi transaksi.
          </Text>
        </View>
        <View style={styles.sheetItem}>
          <Ionicons name="checkmark-circle" size={14} color={colors.incomeDark} style={styles.sheetCheck} />
          <Text style={[styles.sheetDesc, { color: colors.textSecondary }]}>
            <Text style={[styles.sheetBold, { color: colors.text }]}>Sheet 3 (Ringkasan):</Text> Neraca saldo dan total debit/kredit.
          </Text>
        </View>
      </View>
    </NeoModal>
  );
};

const styles = StyleSheet.create({
  summaryCard: {
    marginBottom: 12,
  },
  summaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  summaryTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  metricLabel: {
    fontSize: TYPOGRAPHY.size.xs,
  },
  metricValue: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  metricLabelBold: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '800',
  },
  metricValueBold: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '900',
  },
  sheetsInfo: {
    padding: 12,
    borderWidth: 1,
    borderRadius: 14,
    marginBottom: 6,
  },
  sheetsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  sheetsInfoTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sheetItem: {
    flexDirection: 'row',
    marginBottom: 6,
    alignItems: 'flex-start',
  },
  sheetCheck: {
    marginRight: 6,
    marginTop: 2,
  },
  sheetDesc: {
    fontSize: TYPOGRAPHY.size.xs,
    flex: 1,
    lineHeight: 18,
  },
  sheetBold: {
    fontWeight: '700',
  },
});

export default ExportModal;
