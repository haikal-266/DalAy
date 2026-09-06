import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NeoModal } from '../neo/NeoModal';
import { NeoButton } from '../neo/NeoButton';
import { NeoCard } from '../neo/NeoCard';
import { ConfirmModal } from '../neo/ConfirmModal';
import { useTheme } from '../../stores/themeStore';
import { useLanguage } from '../../stores/languageStore';
import { useAi } from '../../stores/aiStore';
import { generateAndSharePdfReport } from '../../services/pdfReportGenerator';
import { formatRupiah } from '../../utils/formatters';

export const PdfReportModal = ({
  visible,
  onClose,
  onSuccess,
  onError,
  transactions = [],
  summary = { totalIncome: 0, totalExpense: 0, balance: 0 },
  categoryStats = [],
  periodLabel,
}) => {
  const { colors, isDark } = useTheme();
  const { t, isIndonesian } = useLanguage();
  const { geminiApiKey, hasApiKey } = useAi();
  const [reportLang, setReportLang] = useState(isIndonesian ? 'id' : 'en');
  const [generating, setGenerating] = useState(false);
  const [alertConfig, setAlertConfig] = useState(null);

  const resolvedPeriodLabel = periodLabel || t('finance.allPeriods', 'Semua Periode');
  const isReportIndonesian = reportLang === 'id';

  const handleGenerate = async () => {
    if (transactions.length === 0) {
      setAlertConfig({
        title: isReportIndonesian ? 'Belum Ada Data' : 'No Data Available',
        message: isReportIndonesian
          ? 'Tidak ada catatan transaksi keuangan yang dapat dibuatkan laporan pada periode ini.'
          : 'There are no financial records available to generate a report for this period.',
        type: 'warning',
        showCancel: false,
        confirmText: isReportIndonesian ? 'Tutup' : 'Close',
      });
      return;
    }

    try {
      setGenerating(true);
      await generateAndSharePdfReport({
        transactions,
        summary,
        categoryStats,
        periodLabel: resolvedPeriodLabel,
        isIndonesian: isReportIndonesian,
        apiKey: geminiApiKey,
      });

      if (typeof onSuccess === 'function') {
        onSuccess();
      }
      onClose();
    } catch (err) {
      console.error('[PdfReportModal] Gagal generate report:', err);
      if (typeof onError === 'function') {
        onError(err);
      }
      setAlertConfig({
        title: isReportIndonesian ? 'Gagal Membuat Laporan' : 'Report Generation Failed',
        message:
          err?.message ||
          (isReportIndonesian
            ? 'Terjadi kendala saat menyusun laporan PDF. Silakan coba kembali.'
            : 'An error occurred while compiling the PDF report. Please try again.'),
        type: 'danger',
        showCancel: false,
        confirmText: isReportIndonesian ? 'Mengerti' : 'Understood',
      });
    } finally {
      setGenerating(false);
    }
  };

  const totalIncome = summary?.totalIncome || 0;
  const totalExpense = summary?.totalExpense || 0;
  const balance = summary?.balance ?? totalIncome - totalExpense;
  const savingsRate =
    totalIncome > 0 ? Math.round((balance / totalIncome) * 100) : balance >= 0 ? 0 : -100;

  return (
    <>
      <NeoModal
        visible={visible}
        onClose={onClose}
        title={isReportIndonesian ? 'Laporan Keuangan AI (PDF)' : 'AI Financial Report (PDF)'}
        subtitle={
          isReportIndonesian
            ? 'Laporan keuangan formal A4 lengkap dengan analisis AI & grafik'
            : 'Formal A4 financial report with AI insights & charts'
        }
        footer={
          <NeoButton
            title={
              generating
                ? (isReportIndonesian ? 'Menyusun Laporan PDF...' : 'Generating PDF...')
                : (isReportIndonesian ? 'Buat & Bagikan PDF' : 'Generate & Share PDF')
            }
            iconName="document-text-outline"
            variant="primary"
            loading={generating}
            onPress={handleGenerate}
            fullWidth
          />
        }
      >
        {/* Pilihan Bahasa Laporan */}
        <View style={styles.langSelectorContainer}>
          <Text style={[styles.langSelectorTitle, { color: colors.textSecondary }]}>
            {isReportIndonesian ? 'PILIH BAHASA LAPORAN :' : 'REPORT LANGUAGE :'}
          </Text>
          <View style={styles.langButtonRow}>
            <TouchableOpacity
              style={[
                styles.langButton,
                {
                  backgroundColor: isReportIndonesian
                    ? (isDark ? colors.primaryLight : colors.primarySurface)
                    : colors.surface,
                  borderColor: isReportIndonesian
                    ? colors.primary
                    : (isDark ? colors.borderDark : colors.border),
                },
              ]}
              onPress={() => setReportLang('id')}
              activeOpacity={0.7}
            >
              <Text style={styles.langFlag}>🇮🇩</Text>
              <Text
                style={[
                  styles.langText,
                  {
                    color: isReportIndonesian ? colors.primary : colors.textSecondary,
                    fontWeight: isReportIndonesian ? '800' : '600',
                  },
                ]}
              >
                Indonesia
              </Text>
              {isReportIndonesian && (
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.primary}
                  style={styles.checkIcon}
                />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.langButton,
                {
                  backgroundColor: !isReportIndonesian
                    ? (isDark ? colors.primaryLight : colors.primarySurface)
                    : colors.surface,
                  borderColor: !isReportIndonesian
                    ? colors.primary
                    : (isDark ? colors.borderDark : colors.border),
                },
              ]}
              onPress={() => setReportLang('en')}
              activeOpacity={0.7}
            >
              <Text style={styles.langFlag}>🇬🇧</Text>
              <Text
                style={[
                  styles.langText,
                  {
                    color: !isReportIndonesian ? colors.primary : colors.textSecondary,
                    fontWeight: !isReportIndonesian ? '800' : '600',
                  },
                ]}
              >
                English
              </Text>
              {!isReportIndonesian && (
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.primary}
                  style={styles.checkIcon}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Periode & KPI Card */}
        <NeoCard variant="white" padding={14} style={styles.summaryCard}>
          <View
            style={[
              styles.summaryTitleRow,
              { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
            ]}
          >
            <Ionicons name="calendar-outline" size={15} color={colors.primary} />
            <Text style={[styles.summaryTitle, { color: colors.text }]}>
              {isReportIndonesian ? 'CAKUPAN LAPORAN :' : 'REPORT SCOPE :'}
            </Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              {isReportIndonesian ? 'Periode' : 'Period'}
            </Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>{resolvedPeriodLabel}</Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              {isReportIndonesian ? 'Total Transaksi' : 'Total Transactions'}
            </Text>
            <Text style={[styles.metricValue, { color: colors.text }]}>
              {transactions.length} {isReportIndonesian ? 'catatan' : 'records'}
            </Text>
          </View>

          <View
            style={[
              styles.divider,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' },
            ]}
          />

          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: colors.income }]}>
              {isReportIndonesian ? 'Total Pemasukan' : 'Total Income'}
            </Text>
            <Text style={[styles.metricValue, { color: colors.income }]}>
              {formatRupiah(totalIncome)}
            </Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: colors.expense }]}>
              {isReportIndonesian ? 'Total Pengeluaran' : 'Total Expenses'}
            </Text>
            <Text style={[styles.metricValue, { color: colors.expense }]}>
              {formatRupiah(totalExpense)}
            </Text>
          </View>

          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: colors.text }]}>
              {isReportIndonesian ? 'Tingkat Tabungan' : 'Savings Rate'}
            </Text>
            <Text style={[styles.metricValue, { color: colors.primary, fontWeight: '900' }]}>
              {savingsRate}%
            </Text>
          </View>
        </NeoCard>

        {/* Highlight Fitur AI & Desain */}
        <View style={styles.featuresContainer}>
          <View
            style={[
              styles.featureItem,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' },
            ]}
          >
            <Ionicons name="pie-chart" size={16} color={colors.primary} />
            <Text style={[styles.featureText, { color: colors.text }]}>
              {isReportIndonesian ? 'Grafik Donut SVG & rasio arus kas visual' : 'Visual SVG Donut & cashflow ratio charts'}
            </Text>
          </View>

          <View
            style={[
              styles.featureItem,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' },
            ]}
          >
            <Ionicons name="sparkles" size={16} color="#9333EA" />
            <Text style={[styles.featureText, { color: colors.text }]}>
              {hasApiKey
                ? (isReportIndonesian ? 'Analisis finansial bersahabat ditenagai Gemini AI' : 'Friendly personal financial insights by Gemini AI')
                : (isReportIndonesian ? 'Analisis cerdas & kutipan buku/ekonom terpercaya' : 'Smart analysis & verified economist quotes')}
            </Text>
          </View>

          <View
            style={[
              styles.featureItem,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' },
            ]}
          >
            <Ionicons name="document-text-outline" size={16} color="#0284C7" />
            <Text style={[styles.featureText, { color: colors.text }]}>
              {isReportIndonesian ? 'Format dokumen A4 rapi & anti-terpotong' : 'Standard A4 formal layout with anti-cutoff'}
            </Text>
          </View>
        </View>
      </NeoModal>

      {/* Confirmation / Alert Modal */}
      {alertConfig && (
        <ConfirmModal
          visible={Boolean(alertConfig)}
          onClose={() => setAlertConfig(null)}
          onConfirm={() => {
            if (typeof alertConfig.onConfirm === 'function') {
              alertConfig.onConfirm();
            }
            setAlertConfig(null);
          }}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type || 'info'}
          confirmText={alertConfig.confirmText || 'OK'}
          showCancel={alertConfig.showCancel ?? false}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  langSelectorContainer: {
    marginBottom: 14,
  },
  langSelectorTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  langButtonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  langButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 8,
  },
  langFlag: {
    fontSize: 16,
  },
  langText: {
    fontSize: 13,
  },
  checkIcon: {
    marginLeft: 2,
  },
  summaryCard: {
    marginBottom: 14,
  },
  summaryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
  },
  summaryTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    marginVertical: 6,
  },
  featuresContainer: {
    gap: 8,
    marginBottom: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
});

export default PdfReportModal;
