import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CategoryIcon } from './CategoryIcon';
import { useTheme } from '../../stores/themeStore';
import { useLanguage } from '../../stores/languageStore';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../../utils/categories';

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
  const [searchQuery, setSearchQuery] = useState('');

  const categories = useMemo(() => {
    let list = [];
    if (typeFilter === 'expense') {
      list = EXPENSE_CATEGORIES;
    } else if (typeFilter === 'income') {
      list = INCOME_CATEGORIES;
    } else {
      const seen = new Set();
      [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES].forEach((c) => {
        if (!seen.has(c.id)) {
          seen.add(c.id);
          list.push(c);
        }
      });
    }

    if (!searchQuery.trim()) return list;

    const q = searchQuery.toLowerCase().trim();
    return list.filter(
      (c) => c.name.toLowerCase().includes(q) || c.id.toLowerCase().includes(q)
    );
  }, [typeFilter, searchQuery]);

  const handleSelect = (catId) => {
    onSelectCategory(catId);
    onClose();
  };

  return (
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
                  { backgroundColor: colors.primary + '18' },
                ]}
              >
                <Ionicons name="pricetags" size={18} color={colors.primary} />
              </View>
              <View style={styles.headerTextGroup}>
                <Text style={[styles.title, { color: colors.text }]}>
                  {isIndonesian ? 'Pilih Kategori' : 'Select Category'}
                </Text>
                <Text
                  style={[styles.subtitle, { color: colors.textSecondary }]}
                >
                  {isIndonesian
                    ? 'Filter Transaksi'
                    : 'Filter Transaction'}
                </Text>
              </View>
            </View>

            <Pressable
              onPress={onClose}
              hitSlop={8}
              style={[
                styles.closeBtn,
                { backgroundColor: colors.surfaceLight },
              ]}
            >
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Quick Search */}
          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: colors.surfaceLight,
                borderColor: colors.borderLight,
              },
            ]}
          >
            <Ionicons
              name="search-outline"
              size={16}
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
              placeholderTextColor={colors.textSecondary + '80'}
              style={[styles.searchInput, { color: colors.text }]}
            />
            {Boolean(searchQuery) && (
              <Pressable onPress={() => setSearchQuery('')}>
                <Ionicons
                  name="close-circle"
                  size={16}
                  color={colors.textSecondary}
                />
              </Pressable>
            )}
          </View>

          {/* Categories Grid List */}
          <ScrollView
            style={styles.scrollList}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.gridContainer}
          >
            {allowAll && !searchQuery && (
              <Pressable
                onPress={() => handleSelect('all')}
                style={[
                  styles.allCategoryCard,
                  {
                    backgroundColor:
                      selectedCategoryId === 'all'
                        ? colors.primary + '15'
                        : colors.surfaceLight,
                    borderColor:
                      selectedCategoryId === 'all'
                        ? colors.primary
                        : colors.borderLight,
                  },
                ]}
              >
                <View style={styles.catLeftRow}>
                  <View
                    style={[
                      styles.allIconBadge,
                      {
                        backgroundColor:
                          selectedCategoryId === 'all'
                            ? colors.primary
                            : colors.textSecondary + '20',
                      },
                    ]}
                  >
                    <Ionicons
                      name="layers-outline"
                      size={18}
                      color={
                        selectedCategoryId === 'all'
                          ? '#FFFFFF'
                          : colors.textSecondary
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.catName,
                      {
                        color:
                          selectedCategoryId === 'all'
                            ? colors.primary
                            : colors.text,
                        fontWeight:
                          selectedCategoryId === 'all' ? '800' : '600',
                      },
                    ]}
                  >
                    {isIndonesian ? 'Semua Kategori' : 'All Categories'}
                  </Text>
                </View>

                {selectedCategoryId === 'all' && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color={colors.primary}
                  />
                )}
              </Pressable>
            )}

            <View style={styles.grid2Col}>
              {categories.map((cat) => {
                const isSelected = selectedCategoryId === cat.id;
                const catColor = cat.color || colors.primary;

                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => handleSelect(cat.id)}
                    style={({ pressed }) => [
                      styles.catCard,
                      {
                        backgroundColor: isSelected
                          ? catColor + '18'
                          : colors.surfaceLight,
                        borderColor: isSelected
                          ? catColor
                          : colors.borderLight,
                        borderWidth: isSelected ? 2 : 1,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.catIconWrapper}>
                      <CategoryIcon
                        iconName={cat.iconName || cat.icon}
                        iconFamily={cat.iconFamily}
                        color={isSelected ? '#FFFFFF' : catColor}
                        bgColor={isSelected ? catColor : catColor + '20'}
                        size={16}
                        containerSize={32}
                        borderRadius={9}
                      />
                      {isSelected && (
                        <View style={[styles.checkBadge, { backgroundColor: catColor }]}>
                          <Ionicons name="checkmark" size={9} color="#FFFFFF" />
                        </View>
                      )}
                    </View>

                    <Text
                      style={[
                        styles.catGridName,
                        {
                          color: isSelected ? catColor : colors.text,
                          fontWeight: isSelected ? '800' : '600',
                        },
                      ]}
                      numberOfLines={2}
                    >
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  headerIconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextGroup: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    padding: 0,
  },
  scrollList: {
    width: '100%',
  },
  gridContainer: {
    gap: 10,
    paddingBottom: 8,
  },
  allCategoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  catLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  allIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catName: {
    fontSize: 14,
  },
  grid2Col: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  catCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 8,
    minHeight: 46,
  },
  catIconWrapper: {
    position: 'relative',
  },
  checkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  catGridName: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 13.5,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
