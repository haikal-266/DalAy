import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NeoModal } from '../neo/NeoModal';
import { NeoButton } from '../neo/NeoButton';
import { NeoTag } from '../neo/NeoTag';
import { useTheme } from '../../stores/themeStore';
import { useLanguage } from '../../stores/languageStore';
import { useWallet } from '../../stores/walletStore';
import { formatRupiah } from '../../utils/formatters';

export const QuickWalletSelectModal = ({
  visible,
  onClose,
  onConfirm,
  type = 'expense',
  parsedItems = [],
  totalAmount = 0,
}) => {
  const { colors } = useTheme();
  const { t, isIndonesian } = useLanguage();
  const { wallets, selectedWalletId } = useWallet();

  const [selectedWallet, setSelectedWallet] = useState(null);

  // Sync selected wallet whenever modal opens or active wallet changes
  useEffect(() => {
    if (visible) {
      const active =
        wallets.find((w) => w.id === selectedWalletId && selectedWalletId !== 'all') ||
        wallets[0] ||
        null;
      setSelectedWallet(active);
    }
  }, [visible, selectedWalletId, wallets]);

  const handleConfirm = () => {
    const targetWallet = selectedWallet || wallets[0];
    if (targetWallet && typeof onConfirm === 'function') {
      onConfirm(targetWallet);
    }
  };

  const isExpense = type === 'expense';
  const modalTitle = isExpense
    ? t('modal.selectWalletExpenseTitle', 'Pilih Dompet Pengeluaran')
    : t('modal.selectWalletIncomeTitle', 'Pilih Dompet Pemasukan');

  const modalSubtitle = isIndonesian
    ? `Pilih dompet untuk mencatat ${parsedItems.length} transaksi (${formatRupiah(totalAmount)})`
    : `Select wallet for these ${parsedItems.length} transactions (${formatRupiah(totalAmount)})`;

  return (
    <NeoModal
      visible={visible}
      onClose={onClose}
      title={modalTitle}
      subtitle={modalSubtitle}
      footer={
        <View style={styles.footerRow}>
          <NeoButton
            title={t('modal.cancel', 'Batal')}
            variant="secondary"
            onPress={onClose}
            style={styles.cancelBtn}
          />
          <NeoButton
            title={`${t('modal.saveToWallet', 'Simpan ke')} ${selectedWallet?.name ? selectedWallet.name.split(' ')[0] : (isIndonesian ? 'Dompet' : 'Wallet')}`}
            iconName="checkmark-circle"
            variant="primary"
            onPress={handleConfirm}
            style={styles.confirmBtn}
          />
        </View>
      }
    >
      <View style={styles.container}>
        {/* Transaction Summary Card */}
        {parsedItems.length > 0 && (
          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: colors.surfaceLight,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.summaryHeader}>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                {t('modal.detectedItemsLabel', 'TRANSAKSI TERDETEKSI :')}
              </Text>
              <Text
                style={[
                  styles.summaryTotal,
                  { color: isExpense ? colors.expense : colors.income },
                ]}
              >
                {formatRupiah(totalAmount)}
              </Text>
            </View>

            <View style={styles.chipsRow}>
              {parsedItems.map((item, idx) => (
                <NeoTag
                  key={`${item.name}-${idx}`}
                  label={`${item.categoryEmoji || '🏷️'} ${item.name}: ${formatRupiah(item.amount)}`}
                  color={isExpense ? colors.expense : colors.income}
                  bgColor={isExpense ? colors.expenseLight : colors.incomeLight}
                  textColor={isExpense ? colors.expenseDark : colors.incomeDark}
                  size="sm"
                />
              ))}
            </View>
          </View>
        )}

        {/* Wallet Selection List */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {isIndonesian ? 'PILIH DOMPET TUJUAN :' : 'SELECT DESTINATION WALLET :'}
        </Text>

        <ScrollView style={styles.walletList} showsVerticalScrollIndicator={false}>
          {wallets.map((wallet) => {
            const isSelected = selectedWallet?.id === wallet.id;
            const walletColor = wallet.color || colors.primary;

            return (
              <Pressable
                key={wallet.id}
                onPress={() => setSelectedWallet(wallet)}
                style={({ pressed }) => [
                  styles.walletCard,
                  {
                    backgroundColor: isSelected ? colors.surface : colors.surfaceLight,
                    borderColor: isSelected ? walletColor : colors.border,
                    borderWidth: isSelected ? 2 : 1,
                  },
                  pressed && styles.cardPressed,
                ]}
              >
                <View style={styles.walletCardLeft}>
                  <View
                    style={[
                      styles.walletIconCircle,
                      {
                        backgroundColor: isSelected ? walletColor : colors.surface,
                        borderColor: walletColor,
                      },
                    ]}
                  >
                    <Ionicons
                      name={wallet.icon || 'wallet-outline'}
                      size={18}
                      color={isSelected ? '#FFFFFF' : walletColor}
                    />
                  </View>
                  <View style={styles.walletDetails}>
                    <Text
                      style={[
                        styles.walletName,
                        { color: colors.text, fontWeight: isSelected ? '800' : '600' },
                      ]}
                    >
                      {wallet.name}
                    </Text>
                    <Text style={[styles.walletType, { color: colors.textMuted }]}>
                      {wallet.type === 'cash'
                        ? (isIndonesian ? 'Tunai / Fisik' : 'Physical Cash')
                        : wallet.type === 'bank'
                        ? (isIndonesian ? 'Rekening Bank' : 'Bank Account')
                        : wallet.type === 'ewallet'
                        ? (isIndonesian ? 'Dompet Digital' : 'E-Wallet')
                        : (isIndonesian ? 'Dompet Kustom' : 'Custom Wallet')}
                    </Text>
                  </View>
                </View>

                {/* Radio selection indicator */}
                <Ionicons
                  name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                  size={22}
                  color={isSelected ? walletColor : colors.textMuted}
                />
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </NeoModal>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  summaryCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  summaryTotal: {
    fontSize: 14,
    fontWeight: '900',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  walletList: {
    maxHeight: 240,
  },
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginBottom: 8,
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  walletCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  walletIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletDetails: {
    flex: 1,
  },
  walletName: {
    fontSize: 14,
    letterSpacing: 0.2,
  },
  walletType: {
    fontSize: 11,
    marginTop: 2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  cancelBtn: {
    width: 90,
  },
  confirmBtn: {
    flex: 1,
  },
});

export default QuickWalletSelectModal;
