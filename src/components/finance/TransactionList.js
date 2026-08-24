import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../../theme/typography';
import { TransactionCard } from './TransactionCard';
import { NeoInput } from '../neo/NeoInput';
import { NeoSegmented } from '../neo/NeoSegmented';
import { useTheme } from '../../stores/themeStore';
import { useLanguage } from '../../stores/languageStore';
import { getRelativeDateLabel, formatRupiah } from '../../utils/formatters';

export const TransactionList = ({
  transactions = [],
  searchQuery = '',
  setSearchQuery,
  typeFilter = 'all',
  setTypeFilter,
  onEdit,
  onDelete,
}) => {
  const { colors } = useTheme();
  const { t } = useLanguage();

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups = {};

    transactions.forEach((tx) => {
      const dateKey = tx.date ? tx.date.slice(0, 10) : 'unknown';
      if (!groups[dateKey]) {
        groups[dateKey] = {
          dateKey,
          label: getRelativeDateLabel(tx.date),
          items: [],
          totalExpense: 0,
          totalIncome: 0,
        };
      }
      groups[dateKey].items.push(tx);
      if (tx.type === 'income') {
        groups[dateKey].totalIncome += tx.amount || 0;
      } else {
        groups[dateKey].totalExpense += tx.amount || 0;
      }
    });

    return Object.values(groups).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  }, [transactions]);

  return (
    <View style={styles.container}>
      {/* Search & Filter Header */}
      <View style={styles.filterSection}>
        <NeoInput
          placeholder={t('finance.searchPlaceholder', 'Cari transaksi (nama, kategori, nominal)...')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIconName="search-outline"
          style={styles.searchInput}
        />

        <NeoSegmented
          options={[
            { label: t('finance.allTypes', 'Semua'), value: 'all' },
            {
              label: t('finance.expense', 'Pengeluaran'),
              value: 'expense',
              iconName: 'arrow-up',
              activeColor: colors.expense,
            },
            {
              label: t('finance.income', 'Pemasukan'),
              value: 'income',
              iconName: 'arrow-down',
              activeColor: colors.income,
            },
          ]}
          selectedValue={typeFilter}
          onSelect={setTypeFilter}
          style={styles.typeSegmented}
        />
      </View>

      {/* List / Groups */}
      {groupedTransactions.length === 0 ? (
        <View
          style={[
            styles.emptyState,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.emptyIconCircle,
              { backgroundColor: colors.surfaceLight },
            ]}
          >
            <Ionicons name="receipt-outline" size={32} color={colors.textSubtle} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {searchQuery
              ? t('finance.noResults', 'Tidak Ada Hasil')
              : t('finance.noTransactions', 'Belum Ada Transaksi')}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            {searchQuery
              ? `${t('finance.noResultsDesc', 'Tidak ada transaksi yang cocok dengan')} "${searchQuery}"`
              : t('finance.noHistoryDesc', 'Catat pengeluaran atau pemasukan pertama Anda melalui kolom input cepat di atas.')}
          </Text>
        </View>
      ) : (
        <View style={styles.groupsContainer}>
          {groupedTransactions.map((group) => (
            <View key={group.dateKey} style={styles.groupWrapper}>
              {/* Date Section Header */}
              <View style={styles.dateHeader}>
                <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>
                  {group.label}
                </Text>
                <View style={styles.dateTotals}>
                  {group.totalIncome > 0 && (
                    <Text style={[styles.groupIncome, { color: colors.incomeDark }]}>
                      +{formatRupiah(group.totalIncome)}
                    </Text>
                  )}
                  {group.totalExpense > 0 && (
                    <Text style={[styles.groupExpense, { color: colors.expenseDark }]}>
                      -{formatRupiah(group.totalExpense)}
                    </Text>
                  )}
                </View>
              </View>

              {/* Transactions in Group */}
              {group.items.map((tx) => (
                <TransactionCard
                  key={tx.id}
                  transaction={tx}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  filterSection: {
    marginBottom: 8,
    gap: 8,
  },
  searchInput: {
    marginBottom: 0,
  },
  typeSegmented: {
    alignSelf: 'stretch',
  },
  groupsContainer: {
    gap: 12,
  },
  groupWrapper: {
    marginBottom: 4,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 2,
    marginBottom: 4,
  },
  dateLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  dateTotals: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  groupIncome: {
    fontSize: 11,
    fontWeight: '700',
  },
  groupExpense: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyState: {
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 280,
  },
});

export default TransactionList;
