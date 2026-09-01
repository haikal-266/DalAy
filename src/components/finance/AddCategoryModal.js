import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CategoryIcon } from '../common/CategoryIcon';
import { useTheme } from '../../stores/themeStore';
import { useLanguage } from '../../stores/languageStore';
import { useCategories } from '../../stores/categoryStore';

export const CATEGORY_COLOR_PALETTE = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#0284C7', // Sky
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#A855F7', // Purple
  '#EC4899', // Pink
  '#F43F5E', // Rose
  '#14B8A6', // Teal
  '#84CC16', // Lime
  '#64748B', // Slate
];

export const CATEGORY_ICON_LIST = [
  'game-controller',
  'gift',
  'fitness',
  'airplane',
  'paw',
  'musical-notes',
  'camera',
  'sparkles',
  'book',
  'card',
  'cart',
  'wallet',
  'cash',
  'construct',
  'heart',
  'cafe',
  'bus',
  'trophy',
  'film',
  'storefront',
  'rocket',
  'cut',
  'flower',
  'medkit',
  'shirt',
  'bicycle',
  'barbell',
  'beer',
  'car-sport',
  'desktop',
  'football',
  'headset',
  'ice-cream',
  'key',
  'leaf',
  'library',
  'nutrition',
  'color-palette',
  'planet',
  'podium',
  'pricetag',
  'restaurant',
  'school',
  'shield-checkmark',
  'tennisball',
  'trail-sign',
  'umbrella',
  'watch',
  'water',
];

export const AddCategoryModal = ({
  visible,
  onClose,
  initialType = 'expense',
  onCategoryCreated,
}) => {
  const { colors } = useTheme();
  const { isIndonesian } = useLanguage();
  const { addCategory } = useCategories();

  const [categoryType, setCategoryType] = useState(initialType);
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('gift');
  const [selectedColor, setSelectedColor] = useState(initialType === 'income' ? '#10B981' : '#3B82F6');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setCategoryType(initialType);
      setName('');
      setSelectedIcon('gift');
      setSelectedColor(initialType === 'income' ? '#10B981' : '#3B82F6');
      setErrorMsg('');
      setIsSaving(false);
    }
  }, [visible, initialType]);

  const handleSave = async () => {
    if (!name.trim()) {
      setErrorMsg(isIndonesian ? 'Silakan masukkan nama kategori' : 'Please enter category name');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    const res = await addCategory({
      name: name.trim(),
      type: categoryType,
      iconName: selectedIcon,
      iconFamily: 'Ionicons',
      color: selectedColor,
    });

    setIsSaving(false);

    if (res.success) {
      if (typeof onCategoryCreated === 'function') {
        onCategoryCreated(res.category);
      }
      onClose();
    } else {
      setErrorMsg(res.message || (isIndonesian ? 'Gagal menyimpan kategori' : 'Failed to save category'));
    }
  };

  const isExpense = categoryType === 'expense';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <Pressable style={styles.backdropPressable} onPress={onClose}>
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
                    { backgroundColor: (selectedColor || colors.primary) + '20' },
                  ]}
                >
                  <Ionicons name="add-circle" size={20} color={selectedColor || colors.primary} />
                </View>
                <View style={styles.headerTextGroup}>
                  <Text style={[styles.title, { color: colors.text }]}>
                    {isIndonesian ? 'Tambah Kategori Baru' : 'Add New Category'}
                  </Text>
                  <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    {isIndonesian
                      ? 'Buat kategori khusus untuk pengeluaran atau pemasukan'
                      : 'Create custom category for expense or income'}
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

            {/* Scrollable Form Content */}
            <ScrollView
              style={styles.formScroll}
              contentContainerStyle={styles.formContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Type Switcher */}
              <View style={styles.formSection}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                  {isIndonesian ? 'TIPE KATEGORI' : 'CATEGORY TYPE'}
                </Text>
                <View
                  style={[
                    styles.typeToggleWrapper,
                    { backgroundColor: colors.surfaceLight || '#F1F5F9' },
                  ]}
                >
                  <Pressable
                    onPress={() => {
                      setCategoryType('expense');
                      if (selectedColor === '#10B981') setSelectedColor('#EF4444');
                    }}
                    style={[
                      styles.typeToggleBtn,
                      isExpense && [
                        styles.typeToggleBtnActive,
                        { backgroundColor: colors.surface, borderColor: colors.borderLight },
                      ],
                    ]}
                  >
                    <Ionicons
                      name="arrow-up-circle"
                      size={14}
                      color={isExpense ? colors.expense || '#EF4444' : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.typeToggleBtnText,
                        {
                          color: isExpense ? colors.expense || '#EF4444' : colors.textSecondary,
                          fontWeight: isExpense ? '800' : '600',
                        },
                      ]}
                    >
                      {isIndonesian ? 'Pengeluaran' : 'Expense'}
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      setCategoryType('income');
                      if (selectedColor === '#EF4444' || selectedColor === '#3B82F6') setSelectedColor('#10B981');
                    }}
                    style={[
                      styles.typeToggleBtn,
                      !isExpense && [
                        styles.typeToggleBtnActive,
                        { backgroundColor: colors.surface, borderColor: colors.borderLight },
                      ],
                    ]}
                  >
                    <Ionicons
                      name="arrow-down-circle"
                      size={14}
                      color={!isExpense ? colors.income || '#10B981' : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.typeToggleBtnText,
                        {
                          color: !isExpense ? colors.income || '#10B981' : colors.textSecondary,
                          fontWeight: !isExpense ? '800' : '600',
                        },
                      ]}
                    >
                      {isIndonesian ? 'Pemasukan' : 'Income'}
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Name Input */}
              <View style={styles.formSection}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                  {isIndonesian ? 'NAMA KATEGORI' : 'CATEGORY NAME'}
                </Text>
                <View
                  style={[
                    styles.textInputWrapper,
                    {
                      backgroundColor: colors.surfaceLight || '#F8FAFC',
                      borderColor: errorMsg ? colors.expense || '#EF4444' : colors.borderLight || '#E2E8F0',
                    },
                  ]}
                >
                  <TextInput
                    value={name}
                    onChangeText={(val) => {
                      setName(val);
                      if (errorMsg) setErrorMsg('');
                    }}
                    placeholder={
                      isIndonesian
                        ? 'Contoh: Hobi & Gaming, Reksadana, dll'
                        : 'e.g. Gaming, Investments, etc.'
                    }
                    placeholderTextColor={(colors.textSecondary || '#64748B') + '80'}
                    style={[styles.textInput, { color: colors.text }]}
                    maxLength={35}
                  />
                  {Boolean(name) && (
                    <Pressable onPress={() => setName('')} hitSlop={6}>
                      <Ionicons name="close-circle" size={16} color={colors.textSecondary} />
                    </Pressable>
                  )}
                </View>
                {Boolean(errorMsg) && (
                  <Text style={[styles.errorText, { color: colors.expense || '#EF4444' }]}>
                    {errorMsg}
                  </Text>
                )}
              </View>

              {/* Live Preview Card */}
              <View style={styles.formSection}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                  {isIndonesian ? 'PRATINJAU TAMPILAN' : 'PREVIEW'}
                </Text>
                <View
                  style={[
                    styles.previewCard,
                    {
                      backgroundColor: selectedColor + '12',
                      borderColor: selectedColor,
                    },
                  ]}
                >
                  <CategoryIcon
                    iconName={selectedIcon}
                    iconFamily="Ionicons"
                    color="#FFFFFF"
                    bgColor={selectedColor}
                    size={18}
                    containerSize={38}
                    borderRadius={11}
                  />
                  <View style={styles.previewInfo}>
                    <Text
                      style={[styles.previewName, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {name.trim() || (isIndonesian ? 'Nama Kategori' : 'Category Name')}
                    </Text>
                    <View
                      style={[
                        styles.previewTag,
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
                          styles.previewTagText,
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
                  <Ionicons name="checkmark-circle" size={20} color={selectedColor} />
                </View>
              </View>

              {/* Icon Picker (Clean Grid without artificial height capping) */}
              <View style={styles.formSection}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                    {isIndonesian ? 'PILIH IKON' : 'SELECT ICON'}
                  </Text>
                  <Text style={[styles.sectionCountText, { color: colors.textSecondary }]}>
                    ({CATEGORY_ICON_LIST.length} {isIndonesian ? 'pilihan' : 'options'})
                  </Text>
                </View>
                <View style={styles.iconGrid}>
                  {CATEGORY_ICON_LIST.map((iconName) => {
                    const isIconSelected = selectedIcon === iconName;
                    return (
                      <Pressable
                        key={iconName}
                        onPress={() => setSelectedIcon(iconName)}
                        style={[
                          styles.iconPickItem,
                          {
                            backgroundColor: isIconSelected
                              ? selectedColor + '20'
                              : colors.surfaceLight || '#F8FAFC',
                            borderColor: isIconSelected
                              ? selectedColor
                              : colors.borderLight || '#E2E8F0',
                          },
                        ]}
                      >
                        <Ionicons
                          name={iconName}
                          size={19}
                          color={isIconSelected ? selectedColor : colors.textSecondary}
                        />
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Color Palette */}
              <View style={styles.formSection}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                  {isIndonesian ? 'PILIH WARNA' : 'SELECT COLOR'}
                </Text>
                <View style={styles.colorPaletteGrid}>
                  {CATEGORY_COLOR_PALETTE.map((hexColor) => {
                    const isColorSelected = selectedColor === hexColor;
                    return (
                      <Pressable
                        key={hexColor}
                        onPress={() => setSelectedColor(hexColor)}
                        style={[
                          styles.colorCircle,
                          { backgroundColor: hexColor },
                          isColorSelected && styles.colorCircleSelected,
                        ]}
                      >
                        {isColorSelected && (
                          <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </ScrollView>

            {/* Action Buttons Footer */}
            <View style={styles.footerRow}>
              <Pressable
                onPress={onClose}
                style={[
                  styles.cancelBtn,
                  { backgroundColor: colors.surfaceLight || '#F1F5F9' },
                ]}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
                  {isIndonesian ? 'Batal' : 'Cancel'}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleSave}
                disabled={isSaving}
                style={[
                  styles.saveBtn,
                  { backgroundColor: colors.primary },
                  isSaving && { opacity: 0.7 },
                ]}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>
                  {isIndonesian ? 'Simpan Kategori' : 'Save Category'}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  backdropPressable: {
    flex: 1,
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
  formScroll: {
    width: '100%',
    flexGrow: 0,
    flexShrink: 1,
  },
  formContent: {
    gap: 12,
    paddingBottom: 8,
  },
  formSection: {
    gap: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    fontSize: 10.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  sectionCountText: {
    fontSize: 10,
    fontWeight: '600',
  },
  typeToggleWrapper: {
    flexDirection: 'row',
    borderRadius: 11,
    padding: 3,
    gap: 3,
  },
  typeToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 6,
    borderRadius: 8,
  },
  typeToggleBtnActive: {
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  typeToggleBtnText: {
    fontSize: 11,
  },
  textInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    padding: 0,
  },
  errorText: {
    fontSize: 10.5,
    fontWeight: '600',
    marginTop: 2,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 13,
    borderWidth: 1.5,
    gap: 10,
  },
  previewInfo: {
    flex: 1,
    gap: 2,
  },
  previewName: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  previewTag: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  previewTagText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    justifyContent: 'flex-start',
  },
  iconPickItem: {
    width: 37,
    height: 37,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorPaletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  colorCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircleSelected: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
    transform: [{ scale: 1.1 }],
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 4,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});

export default AddCategoryModal;
