import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, Pressable } from 'react-native';
import { TYPOGRAPHY } from '../../theme/typography';
import { NeoModal } from '../neo/NeoModal';
import { NeoInput } from '../neo/NeoInput';
import { NeoButton } from '../neo/NeoButton';
import { NeoSegmented } from '../neo/NeoSegmented';
import { CategoryIcon } from '../common/CategoryIcon';
import { useTheme } from '../../stores/themeStore';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, detectCategory } from '../../utils/categories';

export const ManualTransactionModal = ({
  visible,
  onClose,
  initialTransaction = null,
  onSave,
  defaultDate = null,
}) => {
  const { colors } = useTheme();
  const [type, setType] = useState('expense');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    if (initialTransaction) {
      setType(initialTransaction.type || 'expense');
      setName(initialTransaction.name || '');
      setAmount((initialTransaction.amount || '').toString());
      const categories =
        initialTransaction.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
      const found = categories.find((c) => c.id === initialTransaction.categoryId);
      setSelectedCategory(found || categories[0]);
    } else {
      resetForm();
    }
  }, [initialTransaction, visible]);

  const resetForm = () => {
    setType('expense');
    setName('');
    setAmount('');
    setSelectedCategory(EXPENSE_CATEGORIES[0]);
  };

  const handleTypeChange = (newType) => {
    setType(newType);
    const categories = newType === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    setSelectedCategory(categories[0]);
  };

  const handleNameChange = (text) => {
    setName(text);
    const detected = detectCategory(text, type);
    if (detected) {
      setSelectedCategory(detected);
    }
  };

  const handleSubmit = () => {
    const cleanAmount = Number.parseInt(amount.replace(/\D/g, ''), 10);
    if (!name.trim()) {
      Alert.alert('Data Kurang', 'Silakan masukkan nama atau keterangan transaksi.');
      return;
    }
    if (!cleanAmount || cleanAmount <= 0) {
      Alert.alert('Nominal Tidak Valid', 'Silakan masukkan nominal yang benar.');
      return;
    }

    const category =
      selectedCategory ||
      (type === 'income'
        ? INCOME_CATEGORIES[INCOME_CATEGORIES.length - 1]
        : EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1]);

    const txDate = initialTransaction
      ? initialTransaction.date
      : defaultDate
      ? new Date(defaultDate).toISOString()
      : new Date().toISOString();

    const txData = {
      id: initialTransaction ? initialTransaction.id : undefined,
      type,
      name: name.trim(),
      amount: cleanAmount,
      categoryId: category.id,
      categoryName: category.name,
      iconName: category.iconName || 'cube',
      iconFamily: category.iconFamily || 'Ionicons',
      categoryColor: category.color,
      categoryBgColor: category.bgColor || '#F1F5F9',
      rawText: `${name} ${cleanAmount}`,
      date: txDate,
    };

    onSave(txData);
    onClose();
    resetForm();
  };

  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <NeoModal
      visible={visible}
      onClose={onClose}
      title={initialTransaction ? 'Edit Transaksi' : 'Tambah Transaksi Manual'}
      subtitle={
        initialTransaction
          ? 'Perbarui detail catatan transaksi'
          : 'Lengkapi formulir transaksi keuangan'
      }
      footer={
        <View style={styles.footerRow}>
          <NeoButton
            title="Batal"
            variant="outline"
            onPress={onClose}
            style={styles.cancelBtn}
          />
          <NeoButton
            title="Simpan Catatan"
            iconName="checkmark-circle-outline"
            variant="primary"
            onPress={handleSubmit}
            style={styles.saveBtn}
          />
        </View>
      }
    >
      {/* Type Toggle */}
      <NeoSegmented
        options={[
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
        selectedValue={type}
        onSelect={handleTypeChange}
        style={styles.segmented}
      />

      {/* Name Input */}
      <NeoInput
        label="Nama / Keterangan Transaksi"
        placeholder="misal: Nasi Goreng Spesial, Gaji Bulanan..."
        value={name}
        onChangeText={handleNameChange}
        leftIconName="text-outline"
        style={styles.input}
      />

      {/* Amount Input */}
      <NeoInput
        label="Nominal (Rupiah)"
        placeholder="misal: 25000"
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        leftIconName="cash-outline"
        style={styles.input}
      />

      {/* Category Selection */}
      <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
        PILIH KATEGORI :
      </Text>
      <View style={styles.categoriesGrid}>
        {categories.map((cat) => {
          const isSelected = selectedCategory && selectedCategory.id === cat.id;
          return (
            <Pressable
              key={cat.id}
              onPress={() => setSelectedCategory(cat)}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: isSelected
                    ? colors.primarySurface
                    : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.border,
                  borderWidth: isSelected ? 1.5 : 1,
                },
              ]}
            >
              <CategoryIcon
                iconName={cat.iconName || 'cube'}
                iconFamily={cat.iconFamily || 'Ionicons'}
                color={cat.color}
                bgColor={cat.bgColor || colors.surfaceLight}
                size={16}
                containerSize={32}
                borderRadius={8}
              />
              <Text
                style={[
                  styles.categoryChipText,
                  {
                    color: isSelected ? colors.primaryDark : colors.text,
                    fontWeight: isSelected ? '800' : '600',
                  },
                ]}
                numberOfLines={1}
              >
                {cat.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </NeoModal>
  );
};

const styles = StyleSheet.create({
  segmented: {
    marginBottom: 12,
  },
  input: {
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 8,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginRight: 4,
    marginBottom: 4,
    gap: 8,
  },
  categoryChipText: {
    fontSize: TYPOGRAPHY.size.xs,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelBtn: {
    flex: 1,
  },
  saveBtn: {
    flex: 2,
  },
});

export default ManualTransactionModal;
