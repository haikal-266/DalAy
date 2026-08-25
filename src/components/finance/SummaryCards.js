import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../../theme/typography';
import { NeoCard } from '../neo/NeoCard';
import { useTheme } from '../../stores/themeStore';
import { useLanguage } from '../../stores/languageStore';
import { formatRupiah } from '../../utils/formatters';

export const SummaryCards = ({
  summary = { totalIncome: 0, totalExpense: 0, balance: 0, transactionCount: 0 },
  periodLabel,
}) => {
  const { colors } = useTheme();
  const { t } = useLanguage();

  const resolvedPeriodLabel = periodLabel || t('finance.allPeriods', 'Semua Periode');

  return (
    <NeoCard variant="white" padding={16} style={styles.card}>
      {/* Top Header & Period Badge */}
      <View style={styles.topRow}>
        <View style={styles.saldoTitleRow}>
          <Ionicons name="wallet-outline" size={15} color={colors.primary} />
          <Text style={[styles.saldoLabel, { color: colors.textSecondary }]}>
            {t('finance.totalBalance', 'TOTAL SALDO BERSIH')}
          </Text>
        </View>
        <View
          style={[
            styles.periodBadge,
            {
              backgroundColor: colors.surfaceLight,
              borderColor: colors.border,
            },
          ]}
        >
          <Text style={[styles.periodText, { color: colors.text }]}>
            {resolvedPeriodLabel}
          </Text>
        </View>
      </View>

      {/* Main Balance Nominal */}
      <Text
        style={[
          styles.balanceAmount,
          { color: colors.text },
          summary.balance < 0 && { color: colors.expense },
        ]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {formatRupiah(summary.balance)}
      </Text>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

      {/* Clean 2-column Bottom Bar for Pemasukan & Pengeluaran */}
      <View style={styles.bottomStatsRow}>
        <View style={styles.statCol}>
          <View style={styles.statHeader}>
            <Ionicons name="arrow-down-circle" size={14} color={colors.incomeDark} />
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>
              {t('finance.income', 'Pemasukan')}
            </Text>
          </View>
          <Text
            style={[styles.statValue, { color: colors.incomeDark }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            +{formatRupiah(summary.totalIncome)}
          </Text>
        </View>

        <View style={[styles.verticalDivider, { backgroundColor: colors.borderLight }]} />

        <View style={styles.statCol}>
          <View style={styles.statHeader}>
            <Ionicons name="arrow-up-circle" size={14} color={colors.expenseDark} />
            <Text style={[styles.statLabel, { color: colors.textMuted }]} numberOfLines={1}>
              {t('finance.expense', 'Pengeluaran')}
            </Text>
          </View>
          <Text
            style={[styles.statValue, { color: colors.expenseDark }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            -{formatRupiah(summary.totalExpense)}
          </Text>
        </View>
      </View>
    </NeoCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  saldoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  saldoLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  periodBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  periodText: {
    fontSize: 10,
    fontWeight: '700',
  },
  balanceAmount: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginVertical: 4,
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  bottomStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  statCol: {
    flex: 1,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  verticalDivider: {
    width: 1,
    height: 28,
    marginHorizontal: 12,
  },
});

export default SummaryCards;
