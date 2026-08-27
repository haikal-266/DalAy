import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { TYPOGRAPHY } from '../../theme/typography';
import { NeoModal } from '../neo/NeoModal';
import { NeoInput } from '../neo/NeoInput';
import { NeoButton } from '../neo/NeoButton';
import { NeoSegmented } from '../neo/NeoSegmented';
import { CategoryIcon } from '../common/CategoryIcon';
import { ConfirmModal } from '../neo/ConfirmModal';
import { useTheme } from '../../stores/themeStore';
import { useLanguage } from '../../stores/languageStore';
import { useWallet } from '../../stores/walletStore';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, detectCategory } from '../../utils/categories';
import { formatRupiah } from '../../utils/formatters';
import { Ionicons } from '@expo/vector-icons';

export const ManualTransactionModal = ({
  visible,
  onClose,
  initialTransaction = null,
  initialData = null,
  onSave,
  defaultDate = null,
}) => {
  const { colors } = useTheme();
  const { t, isIndonesian } = useLanguage();
  const { wallets, selectedWalletId } = useWallet();
  const [type, setType] = useState('expense');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [alertConfig, setAlertConfig] = useState(null); // { visible, title, message, type }

  const activeTx = initialTransaction || initialData;

  useEffect(() => {
    if (visible && activeTx) {
      setType(activeTx.type || 'expense');
      setName(activeTx.name || '');
      setAmount(activeTx.amount ? formatRupiah(activeTx.amount, true) : '');
      const categories =
        activeTx.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
      const found = categories.find(
        (c) => c.id === activeTx.categoryId || c.name.toLowerCase() === (activeTx.categoryName || '').toLowerCase()
      );
      setSelectedCategory(found || categories[0]);

      const foundWallet = wallets.find((w) => w.id === activeTx.walletId);
      setSelectedWallet(foundWallet || wallets[0]);
    } else if (visible && !activeTx) {
      resetForm();
    }
  }, [activeTx, visible]);

  const resetForm = () => {
    setType('expense');
    setName('');
    setAmount('');
    setSelectedCategory(EXPENSE_CATEGORIES[0]);
    const defaultW =
      wallets.find((w) => w.id === selectedWalletId && selectedWalletId !== 'all') ||
      wallets[0];
    setSelectedWallet(defaultW);
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

  const handleAmountChange = (text) => {
    const digits = text.replace(/\D/g, '');
    if (!digits) {
      setAmount('');
      return;
    }
    const num = Number.parseInt(digits, 10);
    setAmount(formatRupiah(num, true));
  };

  const handleSubmit = () => {
    const cleanAmount = Number.parseInt(amount.replace(/\D/g, ''), 10);
    if (!name.trim()) {
      setAlertConfig({
        title: isIndonesian ? 'Data Kurang' : 'Missing Information',
        message: isIndonesian
          ? 'Silakan masukkan nama atau keterangan catatan transaksi.'
          : 'Please enter transaction name or description.',
        type: 'warning',
      });
      return;
    }
    if (!cleanAmount || cleanAmount <= 0) {
      setAlertConfig({
        title: isIndonesian ? 'Nominal Tidak Valid' : 'Invalid Amount',
        message: isIndonesian
          ? 'Silakan masukkan nominal angka yang benar.'
          : 'Please enter a valid monetary amount.',
        type: 'warning',
      });
      return;
    }

    const category =
      selectedCategory ||
      (type === 'income'
        ? INCOME_CATEGORIES[INCOME_CATEGORIES.length - 1]
        : EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1]);

    const txDate = activeTx
      ? activeTx.date
      : defaultDate
      ? new Date(defaultDate).toISOString()
      : new Date().toISOString();

    const activeWallet =
      selectedWallet ||
      wallets.find((w) => w.id === selectedWalletId && selectedWalletId !== 'all') ||
      wallets[0];

    const txData = {
      id: activeTx ? activeTx.id : undefined,
      type,
      name: name.trim(),
      amount: cleanAmount,
      walletId: activeWallet?.id || 'wallet_cash',
      walletName: activeWallet?.name || 'Tunai',
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

  const currentCategories =
    type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <>
      <NeoModal
        visible={visible}
        onClose={onClose}
        title={
          activeTx
            ? t('modal.manualEditTitle', 'Edit Transaksi')
            : t('modal.manualTitle', 'Tambah Transaksi Manual')
        }
        subtitle={
          activeTx
            ? t('modal.manualEditSubtitle', 'Perbarui detail catatan transaksi')
            : t('modal.manualSubtitle', 'Lengkapi formulir transaksi keuangan')
        }
        footer={
          <NeoButton
            title={activeTx ? (isIndonesian ? 'Perbarui Catatan' : 'Update Record') : t('modal.saveRecordBtn', 'Simpan Catatan')}
            variant={type === 'expense' ? 'expense' : 'income'}
            onPress={handleSubmit}
            fullWidth
          />
        }
      >
        {/* Type Segmented Switch */}
        <View style={styles.section}>
          <NeoSegmented
            options={[
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
            selectedValue={type}
            onSelect={handleTypeChange}
          />
        </View>

        {/* Name Input */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {t('modal.txNameLabel', 'Nama / Keterangan Transaksi')}
          </Text>
          <NeoInput
            placeholder={t('modal.txNamePlaceholder', 'misal: Nasi Goreng Spesial, Gaji Bulanan...')}
            value={name}
            onChangeText={handleNameChange}
            leftIconName="create-outline"
          />
        </View>

        {/* Amount Input */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {t('modal.amountLabel', 'Nominal (Rupiah)')}
          </Text>
          <NeoInput
            placeholder={isIndonesian ? 'misal: Rp 25.000' : 'e.g. Rp 25,000'}
            value={amount}
            onChangeText={handleAmountChange}
            keyboardType="numeric"
            leftIconName="cash-outline"
          />
        </View>

        {/* Wallet Picker */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {isIndonesian ? 'PILIH DOMPET / REKENING :' : 'SELECT WALLET / ACCOUNT :'}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.walletsRow}
          >
            {wallets.map((w) => {
              const isSelected = (selectedWallet?.id || (wallets[0] && wallets[0].id)) === w.id;
              const wColor = w.color || colors.primary;
              return (
                <Pressable
                  key={w.id}
                  onPress={() => setSelectedWallet(w)}
                  style={[
                    styles.walletPill,
                    {
                      backgroundColor: isSelected ? wColor + '25' : colors.surfaceLight,
                      borderColor: isSelected ? wColor : colors.borderLight,
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    name={w.icon || 'wallet-outline'}
                    size={15}
                    color={isSelected ? wColor : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.walletPillText,
                      {
                        color: isSelected ? colors.text : colors.textSecondary,
                        fontWeight: isSelected ? '800' : '600',
                      },
                    ]}
                  >
                    {w.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Category Picker Grid */}
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            {t('modal.selectCategory', 'PILIH KATEGORI :')}
          </Text>
          <View style={styles.categoriesGrid}>
            {currentCategories.map((cat) => {
              const isSelected = selectedCategory?.id === cat.id;
              const catColor = cat.color || colors.primary;

              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat)}
                  style={({ pressed }) => [
                    styles.categoryCard,
                    {
                      backgroundColor: isSelected ? colors.primarySurface : colors.surface,
                      borderColor: isSelected ? catColor : colors.border,
                    },
                    isSelected && styles.categoryCardSelected,
                    pressed && styles.categoryCardPressed,
                  ]}
                >
                  <CategoryIcon
                    iconName={cat.iconName || 'cube'}
                    iconFamily={cat.iconFamily || 'Ionicons'}
                    color={catColor}
                    bgColor={cat.bgColor || colors.surfaceLight}
                    size={16}
                    containerSize={36}
                    borderRadius={10}
                  />
                  <Text
                    style={[
                      styles.categoryName,
                      { color: isSelected ? colors.text : colors.textSecondary },
                      isSelected && styles.categoryNameSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </NeoModal>

      {/* Modern Feedback / Alert Dialog */}
      {alertConfig && (
        <ConfirmModal
          visible={Boolean(alertConfig)}
          onClose={() => setAlertConfig(null)}
          onConfirm={() => setAlertConfig(null)}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          confirmText={isIndonesian ? 'Mengerti' : 'Got it'}
          cancelText={isIndonesian ? 'Tutup' : 'Close'}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: 12,
  },
  label: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '800',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryCard: {
    width: '31%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryCardSelected: {
    borderWidth: 1.5,
  },
  categoryCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  categoryName: {
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
    fontWeight: '600',
  },
  categoryNameSelected: {
    fontWeight: '800',
  },
  walletsRow: {
    gap: 8,
    paddingVertical: 2,
  },
  walletPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  walletPillText: {
    fontSize: 11,
  },
});

export default ManualTransactionModal;
