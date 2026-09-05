import React, { useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../../theme/typography';
import { NeoCard } from '../neo/NeoCard';
import { NeoInput } from '../neo/NeoInput';
import { NeoSegmented } from '../neo/NeoSegmented';
import { ConfirmModal } from '../neo/ConfirmModal';
import { TransactionCard } from './TransactionCard';
import { CategoryIcon } from '../common/CategoryIcon';
import { CategoryPickerModal } from '../common/CategoryPickerModal';
import { useTheme } from '../../stores/themeStore';
import { useLanguage } from '../../stores/languageStore';
import { getRelativeDateLabel, formatRupiah } from '../../utils/formatters';
import { useCategories } from '../../stores/categoryStore';

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
  const { expenseCategories, incomeCategories, allCategories } = useCategories();
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleDeleteConfirm = useCallback(() => {
    if (deleteTarget && onDelete) {
      onDelete(deleteTarget.id);
    }
    setDeleteTarget(null);
  }, [deleteTarget, onDelete]);

  const handleDeleteRequest = useCallback((tx) => {
    setDeleteTarget(tx);
  }, []);

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups = {};

    transactions.forEach((tx) => {
      let dateKey = 'unknown';
      if (typeof tx.date === 'string') {
        dateKey = tx.date.slice(0, 10);
      } else if (tx.date instanceof Date && !Number.isNaN(tx.date.getTime())) {
        dateKey = tx.date.toISOString().slice(0, 10);
      } else if (tx.date) {
        try {
          const parsed = new Date(tx.date);
          dateKey = !Number.isNaN(parsed.getTime()) ? parsed.toISOString().slice(0, 10) : 'unknown';
        } catch {
          dateKey = 'unknown';
        }
      }

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
    if (typeFilter === 'expense') return expenseCategories;
    if (typeFilter === 'income') return incomeCategories;
    return allCategories;
  }, [typeFilter, expenseCategories, incomeCategories, allCategories]);

  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState(false);

  const activeCategoryObj = useMemo(() => {
    if (categoryFilter === 'all') return null;
    return availableCategories.find((c) => c.id === categoryFilter);
  }, [categoryFilter, availableCategories]);

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
          placeholder={t('finance.searchPlaceholder', 'Cari transaksi')}
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

      {/* 4. Sleek Category Filter Button */}
      <Pressable
        onPress={() => setIsCategoryPickerOpen(true)}
        style={({ pressed }) => [
          styles.categoryFilterButton,
          {
            backgroundColor: activeCategoryObj
              ? (activeCategoryObj.color || colors.primary) + '15'
              : colors.surfaceLight,
            borderColor: activeCategoryObj
              ? (activeCategoryObj.color || colors.primary)
              : colors.borderLight,
          },
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.categoryFilterLeft}>
          {activeCategoryObj ? (
            <CategoryIcon
              iconName={activeCategoryObj.iconName || activeCategoryObj.icon}
              iconFamily={activeCategoryObj.iconFamily}
              color={activeCategoryObj.color || colors.primary}
              bgColor={(activeCategoryObj.color || colors.primary) + '25'}
              size={16}
              containerSize={32}
              borderRadius={10}
            />
          ) : (
            <View
              style={[
                styles.allCategoryBadgeIcon,
                { backgroundColor: colors.primary + '20' },
              ]}
            >
              <Ionicons name="pricetags" size={15} color={colors.primary} />
            </View>
          )}

          <View style={styles.categoryFilterTextCol}>
            <Text
              style={[styles.categoryFilterTagLabel, { color: colors.textSecondary }]}
            >
              {isIndonesian ? 'FILTER KATEGORI :' : 'CATEGORY FILTER :'}
            </Text>
            <Text
              style={[
                styles.categoryFilterActiveName,
                {
                  color: activeCategoryObj
                    ? (activeCategoryObj.color || colors.text)
                    : colors.text,
                },
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.8}
            >
              {activeCategoryObj
                ? activeCategoryObj.name
                : isIndonesian
                ? 'Semua Kategori'
                : 'All Categories'}
            </Text>
          </View>
        </View>

        <View style={styles.categoryFilterRight}>
          {categoryFilter !== 'all' && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                if (setCategoryFilter) setCategoryFilter('all');
              }}
              hitSlop={8}
              style={[
                styles.clearFilterChip,
                { backgroundColor: colors.borderLight },
              ]}
            >
              <Ionicons name="close" size={13} color={colors.textSecondary} />
            </Pressable>
          )}

          <View
            style={[
              styles.dropdownChevronCircle,
              { backgroundColor: colors.surface },
            ]}
          >
            <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
          </View>
        </View>
      </Pressable>

      <CategoryPickerModal
        visible={isCategoryPickerOpen}
        onClose={() => setIsCategoryPickerOpen(false)}
        selectedCategoryId={categoryFilter}
        onSelectCategory={(catId) => setCategoryFilter && setCategoryFilter(catId)}
        typeFilter={typeFilter}
        allowAll={true}
      />

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
                <Text
                  style={[styles.dateLabel, { color: colors.textSecondary }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
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
                    onDelete={handleDeleteRequest}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Global Shared Delete Confirmation Dialog for Entire List */}
      <ConfirmModal
        visible={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        title={isIndonesian ? 'Hapus Transaksi' : 'Delete Transaction'}
        message={
          deleteTarget
            ? (isIndonesian
              ? `Yakin ingin menghapus catatan "${deleteTarget.name}" (${formatRupiah(deleteTarget.amount)})?`
              : `Are you sure you want to delete "${deleteTarget.name}" (${formatRupiah(deleteTarget.amount)})?`)
            : ''
        }
        type="danger"
        confirmText={t('modal.delete', 'Hapus')}
        cancelText={t('modal.cancel', 'Batal')}
      />
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
    gap: 14,
  },
  groupWrapper: {
    marginBottom: 2,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  dateLabel: {
    flex: 1,
    flexShrink: 1,
    marginRight: 8,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  dateTotals: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupIncome: {
    fontSize: 11,
    fontWeight: '800',
  },
  groupExpense: {
    fontSize: 11,
    fontWeight: '800',
  },
  cardsList: {
    gap: 2,
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
  categoryFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    marginTop: 8,
  },
  categoryFilterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  allCategoryBadgeIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryFilterTextCol: {
    flex: 1,
    gap: 1,
  },
  categoryFilterTagLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  categoryFilterActiveName: {
    fontSize: 13,
    fontWeight: '800',
  },
  categoryFilterRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clearFilterChip: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownChevronCircle: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});

export default TransactionList;
