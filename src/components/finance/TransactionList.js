import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../../theme/typography';
import { TransactionCard } from './TransactionCard';
import { NeoInput } from '../neo/NeoInput';
import { NeoSegmented } from '../neo/NeoSegmented';
import { useTheme } from '../../stores/themeStore';
import { getRelativeDateLabel } from '../../utils/formatters';

export const TransactionList = ({
  transactions = [],
  searchQuery = '',
  onSearchChange,
  typeFilter = 'all',
  onTypeFilterChange,
  onEditTransaction,
  onDeleteTransaction,
}) => {
  const { colors } = useTheme();

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
          placeholder="Cari transaksi (nama, kategori, nominal)..."
          value={searchQuery}
          onChangeText={onSearchChange}
          leftIconName="search-outline"
          style={styles.searchInput}
        />

        <NeoSegmented
          options={[
            { label: 'Semua', value: 'all' },
            {
              label: 'Pengeluaran',
              value: 'expense',
              iconName: 'arrow-up',
              activeColor: colors.expense,
            },
            {
              label: 'Pemasukan',
              value: 'income',
              iconName: 'arrow-down',
              activeColor: colors.income,
            },
          ]}
          selectedValue={typeFilter}
          onSelect={onTypeFilterChange}
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
            {searchQuery ? 'Tidak Ada Hasil' : 'Belum Ada Riwayat Transaksi'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            {searchQuery
              ? `Tidak ada transaksi yang cocok dengan "${searchQuery}"`
              : 'Catat pengeluaran atau pemasukan pertama Anda melalui kolom input cepat di atas.'}
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
                    <Text
                      style={[styles.dateIncomeText, { color: colors.incomeDark }]}
                    >
                      +{group.totalIncome.toLocaleString('id-ID')}
                    </Text>
                  )}
                  {group.totalExpense > 0 && (
                    <Text
                      style={[styles.dateExpenseText, { color: colors.expenseDark }]}
                    >
                      -{group.totalExpense.toLocaleString('id-ID')}
                    </Text>
                  )}
                </View>
              </View>

              {/* Transactions in Date */}
              {group.items.map((tx) => (
                <TransactionCard
                  key={tx.id}
                  transaction={tx}
                  onEdit={onEditTransaction}
                  onDelete={onDeleteTransaction}
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
  },
  searchInput: {
    marginVertical: 4,
  },
  typeSegmented: {
    marginVertical: 4,
  },
  emptyState: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 6,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '800',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: TYPOGRAPHY.size.xs,
    textAlign: 'center',
    paddingHorizontal: 28,
    lineHeight: 18,
  },
  groupsContainer: {
    marginTop: 4,
  },
  groupWrapper: {
    marginBottom: 14,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 6,
    marginBottom: 2,
  },
  dateLabel: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  dateTotals: {
    flexDirection: 'row',
    gap: 8,
  },
  dateIncomeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  dateExpenseText: {
    fontSize: 11,
    fontWeight: '800',
  },
});

export default TransactionList;
