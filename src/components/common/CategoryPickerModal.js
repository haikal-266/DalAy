import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  LayoutAnimation,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CategoryIcon } from './CategoryIcon';
import { useTheme } from '../../stores/themeStore';
import { useLanguage } from '../../stores/languageStore';
import { useCategories } from '../../stores/categoryStore';
import { AddCategoryModal } from '../finance/AddCategoryModal';

export const CategoryPickerModal = ({
  visible,
  onClose,
  selectedCategoryId = 'all',
  onSelectCategory,
  typeFilter = 'all', // 'all' | 'expense' | 'income'
  allowAll = true,
}) => {
  const { colors } = useTheme();
  const { isIndonesian } = useLanguage();
  const { expenseCategories, incomeCategories } = useCategories();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState(
    typeFilter === 'income' ? 'income' : typeFilter === 'expense' ? 'expense' : 'all'
  );

  // Accordion collapse state for sections
  const [isExpenseOpen, setIsExpenseOpen] = useState(true);
  const [isIncomeOpen, setIsIncomeOpen] = useState(true);

  // Add Category Modal State
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addModalType, setAddModalType] = useState('expense');

  // Sync active tab when modal opens or typeFilter changes
  useEffect(() => {
    if (visible) {
      setSearchQuery('');
      setIsExpenseOpen(true);
      setIsIncomeOpen(true);
      if (typeFilter === 'expense') {
        setActiveTab('expense');
      } else if (typeFilter === 'income') {
        setActiveTab('income');
      } else {
        setActiveTab('all');
      }
    }
  }, [visible, typeFilter]);

  const toggleExpenseAccordion = () => {
    try {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    } catch {
      // safe fallback
    }
    setIsExpenseOpen((prev) => !prev);
  };

  const toggleIncomeAccordion = () => {
    try {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    } catch {
      // safe fallback
    }
    setIsIncomeOpen((prev) => !prev);
  };

  const handleSelect = (catId) => {
    onSelectCategory(catId);
    onClose();
  };

  const handleOpenAddCategory = (type) => {
    setAddModalType(type);
    setAddModalVisible(true);
  };

  const handleCategoryCreated = (newCat) => {
    if (newCat && newCat.id) {
      handleSelect(newCat.id);
    }
  };

  // Filtered Expense Categories
  const filteredExpenseCategories = useMemo(() => {
    const list = expenseCategories.map((c) => ({ ...c, type: 'expense' }));
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
    );
  }, [expenseCategories, searchQuery]);

  // Filtered Income Categories
  const filteredIncomeCategories = useMemo(() => {
    const list = incomeCategories.map((c) => ({ ...c, type: 'income' }));
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
    );
  }, [incomeCategories, searchQuery]);

  const showTypeTabs = allowAll && typeFilter === 'all';

  const renderCategoryRow = (cat) => {
    const isSelected = selectedCategoryId === cat.id;
    const catColor = cat.color || colors.primary;
    const isExpense = cat.type === 'expense';

    return (
      <Pressable
        key={cat.id}
        onPress={() => handleSelect(cat.id)}
        style={({ pressed }) => [
          styles.catRow,
          {
            backgroundColor: isSelected
              ? catColor + '15'
              : colors.surfaceLight || '#F8FAFC',
            borderColor: isSelected ? catColor : colors.borderLight || '#E2E8F0',
            borderWidth: isSelected ? 1.5 : 1,
          },
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.catRowLeft}>
          <CategoryIcon
            iconName={cat.iconName || cat.icon || 'cube'}
            iconFamily={cat.iconFamily || 'Ionicons'}
            color={isSelected ? '#FFFFFF' : catColor}
            bgColor={isSelected ? catColor : catColor + '20'}
            size={17}
            containerSize={36}
            borderRadius={10}
          />
          <View style={styles.catInfo}>
            <View style={styles.catNameRow}>
              <Text
                style={[
                  styles.catName,
                  {
                    color: isSelected ? catColor : colors.text,
                    fontWeight: isSelected ? '800' : '700',
                  },
                ]}
                numberOfLines={1}
              >
                {cat.name}
              </Text>
              {cat.isCustom && (
                <View style={[styles.customBadge, { backgroundColor: catColor + '20' }]}>
                  <Text style={[styles.customBadgeText, { color: catColor }]}>
                    {isIndonesian ? 'Kustom' : 'Custom'}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.catMetaRow}>
              <View
                style={[
                  styles.typeTag,
                  {
                    backgroundColor: isExpense
                      ? (colors.expense || '#EF4444') + '15'
                      : (colors.income || '#10B981') + '15',
                  },
                ]}
              >
                <Ionicons
                  name={isExpense ? 'arrow-up' : 'arrow-down'}
                  size={9}
                  color={isExpense ? colors.expense || '#EF4444' : colors.income || '#10B981'}
                />
                <Text
                  style={[
                    styles.typeTagText,
                    {
                      color: isExpense ? colors.expense || '#EF4444' : colors.income || '#10B981',
                    },
                  ]}
                >
                  {isExpense
                    ? (isIndonesian ? 'Pengeluaran' : 'Expense')
                    : (isIndonesian ? 'Pemasukan' : 'Income')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.catRowRight}>
          {isSelected ? (
            <Ionicons name="checkmark-circle" size={21} color={catColor} />
          ) : (
            <View
              style={[
                styles.unselectedCircle,
                { borderColor: colors.borderLight || '#CBD5E1' },
              ]}
            />
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable
            style={[
              styles.modalCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <View
                  style={[
                    styles.headerIconBg,
                    { backgroundColor: (colors.primary || '#3B82F6') + '18' },
                  ]}
                >
                  <Ionicons name="pricetags" size={17} color={colors.primary} />
                </View>
                <View style={styles.headerTextGroup}>
                  <Text style={[styles.title, { color: colors.text }]}>
                    {isIndonesian ? 'Pilih Kategori' : 'Select Category'}
                  </Text>
                  <Text
                    style={[styles.subtitle, { color: colors.textSecondary }]}
                  >
                    {isIndonesian
                      ? 'Filter transaksi berdasarkan kategori'
                      : 'Filter transactions by category'}
                  </Text>
                </View>
              </View>

              <Pressable
                onPress={onClose}
                hitSlop={8}
                style={[
                  styles.closeBtn,
                  { backgroundColor: colors.surfaceLight || '#F1F5F9' },
                ]}
              >
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Type Segmented Filter (Semua vs Pengeluaran vs Pemasukan) - Compact & Elegant */}
            {showTypeTabs && (
              <View
                style={[
                  styles.typeSegmentWrapper,
                  { backgroundColor: colors.surfaceLight || '#F1F5F9' },
                ]}
              >
                <Pressable
                  onPress={() => setActiveTab('all')}
                  style={[
                    styles.typeTabBtn,
                    activeTab === 'all' && [
                      styles.typeTabBtnActive,
                      { backgroundColor: colors.surface, borderColor: colors.borderLight },
                    ],
                  ]}
                >
                  <Ionicons
                    name="apps-outline"
                    size={12}
                    color={activeTab === 'all' ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeTabText,
                      {
                        color: activeTab === 'all' ? colors.primary : colors.textSecondary,
                        fontWeight: activeTab === 'all' ? '800' : '600',
                      },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.8}
                  >
                    {isIndonesian ? 'Semua' : 'All'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setActiveTab('expense')}
                  style={[
                    styles.typeTabBtn,
                    activeTab === 'expense' && [
                      styles.typeTabBtnActive,
                      { backgroundColor: colors.surface, borderColor: colors.borderLight },
                    ],
                  ]}
                >
                  <Ionicons
                    name="arrow-up-circle-outline"
                    size={12}
                    color={activeTab === 'expense' ? colors.expense || '#EF4444' : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeTabText,
                      {
                        color: activeTab === 'expense' ? colors.expense || '#EF4444' : colors.textSecondary,
                        fontWeight: activeTab === 'expense' ? '800' : '600',
                      },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.8}
                  >
                    {isIndonesian ? 'Pengeluaran' : 'Expense'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setActiveTab('income')}
                  style={[
                    styles.typeTabBtn,
                    activeTab === 'income' && [
                      styles.typeTabBtnActive,
                      { backgroundColor: colors.surface, borderColor: colors.borderLight },
                    ],
                  ]}
                >
                  <Ionicons
                    name="arrow-down-circle-outline"
                    size={12}
                    color={activeTab === 'income' ? colors.income || '#10B981' : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.typeTabText,
                      {
                        color: activeTab === 'income' ? colors.income || '#10B981' : colors.textSecondary,
                        fontWeight: activeTab === 'income' ? '800' : '600',
                      },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.8}
                  >
                    {isIndonesian ? 'Pemasukan' : 'Income'}
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Quick Search */}
            <View
              style={[
                styles.searchBox,
                {
                  backgroundColor: colors.surfaceLight || '#F8FAFC',
                  borderColor: colors.borderLight || '#E2E8F0',
                },
              ]}
            >
              <Ionicons
                name="search-outline"
                size={15}
                color={colors.textSecondary}
              />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={
                  isIndonesian
                    ? 'Cari nama kategori...'
                    : 'Search category name...'
                }
                placeholderTextColor={(colors.textSecondary || '#64748B') + '80'}
                style={[styles.searchInput, { color: colors.text }]}
              />
              {Boolean(searchQuery) && (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
                  <Ionicons
                    name="close-circle"
                    size={15}
                    color={colors.textSecondary}
                  />
                </Pressable>
              )}
            </View>

            {/* Categories 1-Column List */}
            <ScrollView
              style={styles.scrollList}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.listContainer}
            >
              {/* "Semua Kategori" Option */}
              {allowAll && !searchQuery && activeTab === 'all' && (
                <Pressable
                  onPress={() => handleSelect('all')}
                  style={({ pressed }) => [
                    styles.allCategoryCard,
                    {
                      backgroundColor:
                        selectedCategoryId === 'all'
                          ? (colors.primary || '#3B82F6') + '15'
                          : colors.surfaceLight || '#F8FAFC',
                      borderColor:
                        selectedCategoryId === 'all'
                          ? colors.primary || '#3B82F6'
                          : colors.borderLight || '#E2E8F0',
                      borderWidth: selectedCategoryId === 'all' ? 1.5 : 1,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.catRowLeft}>
                    <View
                      style={[
                        styles.allIconBadge,
                        {
                          backgroundColor:
                            selectedCategoryId === 'all'
                              ? colors.primary || '#3B82F6'
                              : (colors.primary || '#3B82F6') + '20',
                        },
                      ]}
                    >
                      <Ionicons
                        name="layers-outline"
                        size={18}
                        color={
                          selectedCategoryId === 'all'
                            ? '#FFFFFF'
                            : colors.primary || '#3B82F6'
                        }
                      />
                    </View>
                    <View style={styles.catInfo}>
                      <Text
                        style={[
                          styles.catName,
                          {
                            color:
                              selectedCategoryId === 'all'
                                ? colors.primary || '#3B82F6'
                                : colors.text,
                            fontWeight:
                              selectedCategoryId === 'all' ? '800' : '700',
                          },
                        ]}
                      >
                        {isIndonesian ? 'Semua Kategori' : 'All Categories'}
                      </Text>
                      <Text style={[styles.catSubtitle, { color: colors.textSecondary }]}>
                        {isIndonesian
                          ? 'Tampilkan semua transaksi tanpa filter kategori'
                          : 'Show all transactions without category filter'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.catRowRight}>
                    {selectedCategoryId === 'all' ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={21}
                        color={colors.primary || '#3B82F6'}
                      />
                    ) : (
                      <View
                        style={[
                          styles.unselectedCircle,
                          { borderColor: colors.borderLight || '#CBD5E1' },
                        ]}
                      />
                    )}
                  </View>
                </Pressable>
              )}

              {/* EXPENSE CATEGORIES SECTION (Collapsible Accordion / Dropdown) */}
              {(activeTab === 'all' || activeTab === 'expense') && filteredExpenseCategories.length > 0 && (
                <View style={styles.sectionBlock}>
                  <Pressable
                    onPress={toggleExpenseAccordion}
                    style={({ pressed }) => [
                      styles.sectionHeaderRow,
                      {
                        backgroundColor: (colors.expense || '#EF4444') + '0C',
                        borderColor: (colors.expense || '#EF4444') + '20',
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.sectionTitleGroup}>
                      <Ionicons
                        name="arrow-up-circle"
                        size={15}
                        color={colors.expense || '#EF4444'}
                      />
                      <Text style={[styles.sectionTitleText, { color: colors.expense || '#EF4444' }]}>
                        {isIndonesian ? 'KATEGORI PENGELUARAN' : 'EXPENSE CATEGORIES'}
                      </Text>
                      <View
                        style={[
                          styles.countBadge,
                          { backgroundColor: (colors.expense || '#EF4444') + '18' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.countBadgeText,
                            { color: colors.expense || '#EF4444' },
                          ]}
                        >
                          {filteredExpenseCategories.length}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.accordionToggleIcon}>
                      <Ionicons
                        name={isExpenseOpen || Boolean(searchQuery) ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={colors.expense || '#EF4444'}
                      />
                    </View>
                  </Pressable>

                  {(isExpenseOpen || Boolean(searchQuery)) && (
                    <View style={styles.singleColumnList}>
                      {filteredExpenseCategories.map(renderCategoryRow)}

                      {/* + Tambah Kategori Pengeluaran Button */}
                      <Pressable
                        onPress={() => handleOpenAddCategory('expense')}
                        style={({ pressed }) => [
                          styles.addCategoryBtn,
                          {
                            borderColor: (colors.primary || '#0D9488') + '40',
                            backgroundColor: (colors.primary || '#0D9488') + '08',
                          },
                          pressed && styles.pressed,
                        ]}
                      >
                        <View
                          style={[
                            styles.addCatIconBg,
                            { backgroundColor: (colors.primary || '#0D9488') + '20' },
                          ]}
                        >
                          <Ionicons name="add" size={15} color={colors.primary || '#0D9488'} />
                        </View>
                        <Text style={[styles.addCatBtnText, { color: colors.primary || '#0D9488' }]}>
                          {isIndonesian ? '+ Tambah Kategori Pengeluaran' : '+ Add Expense Category'}
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              )}

              {/* INCOME CATEGORIES SECTION (Collapsible Accordion / Dropdown) */}
              {(activeTab === 'all' || activeTab === 'income') && filteredIncomeCategories.length > 0 && (
                <View style={styles.sectionBlock}>
                  <Pressable
                    onPress={toggleIncomeAccordion}
                    style={({ pressed }) => [
                      styles.sectionHeaderRow,
                      {
                        backgroundColor: (colors.income || '#10B981') + '0C',
                        borderColor: (colors.income || '#10B981') + '20',
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.sectionTitleGroup}>
                      <Ionicons
                        name="arrow-down-circle"
                        size={15}
                        color={colors.income || '#10B981'}
                      />
                      <Text style={[styles.sectionTitleText, { color: colors.income || '#10B981' }]}>
                        {isIndonesian ? 'KATEGORI PEMASUKAN' : 'INCOME CATEGORIES'}
                      </Text>
                      <View
                        style={[
                          styles.countBadge,
                          { backgroundColor: (colors.income || '#10B981') + '18' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.countBadgeText,
                            { color: colors.income || '#10B981' },
                          ]}
                        >
                          {filteredIncomeCategories.length}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.accordionToggleIcon}>
                      <Ionicons
                        name={isIncomeOpen || Boolean(searchQuery) ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={colors.income || '#10B981'}
                      />
                    </View>
                  </Pressable>

                  {(isIncomeOpen || Boolean(searchQuery)) && (
                    <View style={styles.singleColumnList}>
                      {filteredIncomeCategories.map(renderCategoryRow)}

                      {/* + Tambah Kategori Pemasukan Button */}
                      <Pressable
                        onPress={() => handleOpenAddCategory('income')}
                        style={({ pressed }) => [
                          styles.addCategoryBtn,
                          {
                            borderColor: (colors.income || '#10B981') + '40',
                            backgroundColor: (colors.income || '#10B981') + '08',
                          },
                          pressed && styles.pressed,
                        ]}
                      >
                        <View
                          style={[
                            styles.addCatIconBg,
                            { backgroundColor: (colors.income || '#10B981') + '20' },
                          ]}
                        >
                          <Ionicons name="add" size={15} color={colors.income || '#10B981'} />
                        </View>
                        <Text style={[styles.addCatBtnText, { color: colors.income || '#10B981' }]}>
                          {isIndonesian ? '+ Tambah Kategori Pemasukan' : '+ Add Income Category'}
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </View>
              )}

              {/* Empty Search State */}
              {filteredExpenseCategories.length === 0 && filteredIncomeCategories.length === 0 && (
                <View style={styles.emptyState}>
                  <Ionicons
                    name="search"
                    size={32}
                    color={(colors.textSecondary || '#64748B') + '60'}
                  />
                  <Text style={[styles.emptyStateTitle, { color: colors.text }]}>
                    {isIndonesian ? 'Kategori Tidak Ditemukan' : 'No Category Found'}
                  </Text>
                  <Text style={[styles.emptyStateSub, { color: colors.textSecondary }]}>
                    {isIndonesian
                      ? `Tidak ada kategori yang cocok dengan "${searchQuery}"`
                      : `No category matches "${searchQuery}"`}
                  </Text>
                </View>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Add Custom Category Modal Dialog */}
      {addModalVisible && (
        <AddCategoryModal
          visible={addModalVisible}
          onClose={() => setAddModalVisible(false)}
          initialType={addModalType}
          onCategoryCreated={handleCategoryCreated}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '85%',
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIconBg: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextGroup: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 10.5,
    fontWeight: '500',
    marginTop: 1,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeSegmentWrapper: {
    flexDirection: 'row',
    borderRadius: 11,
    padding: 3,
    gap: 3,
  },
  typeTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 5.5,
    paddingHorizontal: 2,
    borderRadius: 8,
  },
  typeTabBtnActive: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  typeTabText: {
    fontSize: 10.5,
    letterSpacing: -0.2,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 11,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    padding: 0,
  },
  scrollList: {
    width: '100%',
  },
  listContainer: {
    gap: 12,
    paddingBottom: 8,
  },
  allCategoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 13,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 9,
    borderRadius: 13,
    width: '100%',
  },
  catRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  allIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catInfo: {
    flex: 1,
    gap: 2,
  },
  catNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  catName: {
    fontSize: 13,
    letterSpacing: -0.2,
  },
  customBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  customBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  catSubtitle: {
    fontSize: 10,
  },
  catMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  typeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  typeTagText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  catRowRight: {
    marginLeft: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unselectedCircle: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    borderWidth: 1.5,
  },
  sectionBlock: {
    gap: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitleText: {
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  countBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
  },
  countBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
  accordionToggleIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  singleColumnList: {
    gap: 5,
  },
  addCategoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    borderRadius: 11,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 2,
  },
  addCatIconBg: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCatBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 26,
    gap: 6,
  },
  emptyStateTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  emptyStateSub: {
    fontSize: 11,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
});

export default CategoryPickerModal;
