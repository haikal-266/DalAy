import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../../theme/typography';
import { NeoCard } from '../neo/NeoCard';
import { NeoInput } from '../neo/NeoInput';
import { NeoSegmented } from '../neo/NeoSegmented';
import { TransactionCard } from './TransactionCard';
import { useTheme } from '../../stores/themeStore';
import { useLanguage } from '../../stores/languageStore';
import { getRelativeDateLabel, formatRupiah } from '../../utils/formatters';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../utils/categories';

export const TransactionList = ({
  transactions = [],
  searchQuery = '',
  setSearchQuery,
  typeFilter = 'all',
  setTypeFilter,
  categoryFilter = 'all',
  setCategoryFilter,
  onEdit,
  onDelete,
  onSearchFocus,
}) => {
  const { colors } = useTheme();
  const { t, isIndonesian } = useLanguage();

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
      const isAdjustment = tx.type === 'adjustment' || tx.categoryId === 'cat_adjustment';
      if (!isAdjustment) {
        if (tx.type === 'income') {
          groups[dateKey].totalIncome += tx.amount || 0;
        } else if (tx.type === 'expense') {
          groups[dateKey].totalExpense += tx.amount || 0;
        }
      }
    });

    return Object.values(groups).sort((a, b) => b.dateKey.localeCompare(a.dateKey));
  }, [transactions]);

  const availableCategories = useMemo(() => {
    if (typeFilter === 'expense') return EXPENSE_CATEGORIES;
    if (typeFilter === 'income') return INCOME_CATEGORIES;
    const seen = new Set();
    const list = [];
    [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].forEach((c) => {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        list.push(c);
      }
    });
    return list;
  }, [typeFilter]);

  return (
    <NeoCard variant="white" padding={16} style={styles.cardContainer}>
      {/* 1. Header Row (Matching PieChartSection) */}
      <View style={styles.cardHeader}>
        <View style={styles.titleGroup}>
          <Ionicons name="receipt" size={17} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {isIndonesian ? 'DAFTAR RIWAYAT TRANSAKSI' : 'TRANSACTION HISTORY'}
          </Text>
        </View>
        <View
          style={[
            styles.countBadge,
            { backgroundColor: colors.surfaceLight, borderColor: colors.borderLight },
          ]}
        >
          <Text style={[styles.countBadgeText, { color: colors.textSecondary }]}>
            {transactions.length} {isIndonesian ? 'catatan' : 'records'}
          </Text>
        </View>
      </View>

      {/* 2. Search Input */}
      <View style={styles.searchWrapper}>
        <NeoInput
          placeholder={t('finance.searchPlaceholder', 'Cari transaksi (nama, kategori, nominal)...')}
          value={searchQuery}
          onChangeText={setSearchQuery}
          leftIconName="search-outline"
          onFocus={onSearchFocus}
          style={styles.searchInput}
        />
      </View>

      {/* 3. Type Filter Segmented */}
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

      {/* 4. Category Filter Chips Horizontal Bar */}
      <View style={styles.categoryFilterWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryChipsContent}
        >
          <Pressable
            onPress={() => setCategoryFilter && setCategoryFilter('all')}
            style={({ pressed }) => [
              styles.categoryChip,
              {
                backgroundColor: categoryFilter === 'all' ? colors.primary : colors.surfaceLight,
                borderColor: categoryFilter === 'all' ? colors.primaryDark : colors.border,
              },
              categoryFilter === 'all' && styles.categoryChipActive,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="pricetags-outline"
              size={12}
              color={categoryFilter === 'all' ? '#FFFFFF' : colors.textSecondary}
            />
            <Text
              style={[
                styles.categoryChipText,
                {
                  color: categoryFilter === 'all' ? '#FFFFFF' : colors.textSecondary,
                  fontWeight: categoryFilter === 'all' ? '800' : '600',
                },
              ]}
            >
              {isIndonesian ? 'Semua Kategori' : 'All'}
            </Text>
          </Pressable>

          {availableCategories.map((cat) => {
            const isSelected = categoryFilter === cat.id;
            const catColor = cat.color || colors.primary;

            return (
              <Pressable
                key={cat.id}
                onPress={() => setCategoryFilter && setCategoryFilter(isSelected ? 'all' : cat.id)}
                style={({ pressed }) => [
                  styles.categoryChip,
                  {
                    backgroundColor: isSelected ? catColor : colors.surfaceLight,
                    borderColor: isSelected ? catColor : colors.border,
                  },
                  isSelected && styles.categoryChipActive,
                  pressed && styles.pressed,
                ]}
              >
                <Ionicons
                  name={cat.iconName || 'pricetag-outline'}
                  size={12}
                  color={isSelected ? '#FFFFFF' : catColor}
                />
                <Text
                  style={[
                    styles.categoryChipText,
                    {
                      color: isSelected ? '#FFFFFF' : colors.text,
                      fontWeight: isSelected ? '800' : '600',
                    },
                  ]}
                >
                  {cat.name}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* 5. Subtle Divider */}
      <View style={[styles.divider, { backgroundColor: colors.borderLight }]} />

      {/* 5. List Content Area / Empty State */}
      {groupedTransactions.length === 0 ? (
        <View
          style={[
            styles.emptyState,
            {
              backgroundColor: colors.surfaceLight,
              borderColor: colors.borderLight,
            },
          ]}
        >
          <View
            style={[
              styles.emptyIconCircle,
              { backgroundColor: colors.surface },
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
                      +{formatRupiah(Math.abs(group.totalIncome))}
                    </Text>
                  )}
                  {group.totalExpense > 0 && (
                    <Text style={[styles.groupExpense, { color: colors.expenseDark }]}>
                      -{formatRupiah(Math.abs(group.totalExpense))}
                    </Text>
                  )}
                </View>
              </View>

              {/* Transactions in Group */}
              <View style={styles.cardsList}>
                {group.items.map((tx) => (
                  <TransactionCard
                    key={tx.id}
                    transaction={tx}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>
      )}
    </NeoCard>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    marginTop: 4,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  countBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  searchWrapper: {
    marginBottom: 10,
  },
  searchInput: {
    marginBottom: 0,
  },
  typeSegmented: {
    alignSelf: 'stretch',
    marginBottom: 4,
  },
  divider: {
    height: 1,
    marginVertical: 14,
  },
  groupsContainer: {
    gap: 16,
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
    marginBottom: 6,
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
  cardsList: {
    gap: 6,
  },
  emptyState: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  emptyIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    maxWidth: 260,
  },
  categoryFilterWrapper: {
    marginTop: 8,
  },
  categoryChipsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 2,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryChipActive: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  categoryChipText: {
    fontSize: 11,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
});

export default TransactionList;
