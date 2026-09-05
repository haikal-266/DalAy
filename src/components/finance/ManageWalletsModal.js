import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../../theme/typography';
import { NeoModal } from '../neo/NeoModal';
import { NeoInput } from '../neo/NeoInput';
import { NeoButton } from '../neo/NeoButton';
import { ConfirmModal } from '../neo/ConfirmModal';
import { useTheme } from '../../stores/themeStore';
import { useLanguage } from '../../stores/languageStore';
import {
  useWallet,
  PRIMARY_WALLET_ICONS,
  EXTENDED_WALLET_ICONS,
  WALLET_ICONS,
  WALLET_COLORS,
} from '../../stores/walletStore';
import { useFinance } from '../../stores/financeStore';
import { formatRupiah } from '../../utils/formatters';

export const ManageWalletsModal = ({ visible, onClose, onToast, initialAddMode = false }) => {
  const { colors } = useTheme();
  const { isIndonesian } = useLanguage();
  const { wallets, addWallet, updateWallet, deleteWallet, getWalletBalance } = useWallet();
  const { transactions, addTransaction } = useFinance();

  // Mode: 'list' | 'create' | 'edit'
  const [mode, setMode] = useState(initialAddMode ? 'create' : 'list');
  const [editingWallet, setEditingWallet] = useState(null);
  const [walletAlert, setWalletAlert] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [balanceDigits, setBalanceDigits] = useState('');
  const [isNegative, setIsNegative] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState(WALLET_ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(WALLET_COLORS[0]);
  const [iconsExpanded, setIconsExpanded] = useState(false);

  // Delete Confirm Modal
  const [deleteTarget, setDeleteTarget] = useState(null);

  const resetForm = () => {
    setName('');
    setBalanceDigits('');
    setIsNegative(false);
    setSelectedIcon(WALLET_ICONS[0]);
    setSelectedColor(WALLET_COLORS[0]);
    setEditingWallet(null);
    setIconsExpanded(false);
    setMode('list');
  };

  const handleStartCreate = () => {
    resetForm();
    setMode('create');
  };

  const handleStartEdit = (wallet) => {
    setEditingWallet(wallet);
    setName(wallet.name);
    // Get actual current calculated balance from transactions + initialBalance
    const stats = getWalletBalance(wallet.id, transactions);
    const currentBal = stats?.balance !== undefined ? stats.balance : (wallet.initialBalance || 0);
    setIsNegative(currentBal < 0);
    const absVal = Math.abs(currentBal);
    setBalanceDigits(absVal === 0 ? '' : absVal.toString());
    setSelectedIcon(wallet.icon || WALLET_ICONS[0]);
    if (EXTENDED_WALLET_ICONS.includes(wallet.icon)) {
      setIconsExpanded(true);
    }
    setSelectedColor(wallet.color || WALLET_COLORS[0]);
    setMode('edit');
  };

  const formatBalanceInput = (digits, isNeg) => {
    if (!digits) return '';
    const num = Number.parseInt(digits, 10) || 0;
    const formatted = formatRupiah(num, false);
    return isNeg ? `-Rp ${formatted}` : `Rp ${formatted}`;
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setWalletAlert({
        title: isIndonesian ? 'Nama Diperlukan' : 'Name Required',
        message: isIndonesian ? 'Silakan masukkan nama dompet.' : 'Please enter wallet name.',
        type: 'warning',
      });
      return;
    }

    const num = Number.parseInt(balanceDigits, 10) || 0;
    const cleanBalance = isNegative ? -num : num;

    if (mode === 'create') {
      await addWallet({
        name: name.trim(),
        initialBalance: cleanBalance,
        icon: selectedIcon,
        color: selectedColor,
      });
      if (onToast) {
        onToast(
          isIndonesian
            ? `Dompet "${name.trim()}" berhasil ditambahkan`
            : `Wallet "${name.trim()}" created successfully`,
          'wallet-outline'
        );
      }
    } else if (mode === 'edit' && editingWallet) {
      // Calculate diff between target balance and current balance
      const stats = getWalletBalance(editingWallet.id, transactions);
      const currentBal = stats?.balance !== undefined ? stats.balance : (editingWallet.initialBalance || 0);
      const diff = cleanBalance - currentBal;

      // Update wallet details (name, icon, color)
      await updateWallet(editingWallet.id, {
        name: name.trim(),
        icon: selectedIcon,
        color: selectedColor,
      });

      // If balance changed, automatically record an adjustment transaction with label "Penyesuaian Saldo"
      // Note: Not recorded as income/expense, only displayed in transaction history.
      if (diff !== 0 && typeof addTransaction === 'function') {
        const isIncrease = diff > 0;
        const adjustmentAmount = Math.abs(diff);

        await addTransaction({
          name: isIndonesian ? 'Penyesuaian Saldo' : 'Balance Correction',
          amount: adjustmentAmount,
          type: 'adjustment',
          isIncrease,
          adjustmentDiff: diff,
          walletId: editingWallet.id,
          walletName: name.trim(),
          categoryId: 'cat_adjustment',
          categoryName: isIndonesian ? 'Penyesuaian' : 'Correction',
          iconName: 'swap-horizontal',
          iconFamily: 'Ionicons',
          categoryColor: colors.accent || '#3B82F6',
          categoryBgColor: (colors.accent || '#3B82F6') + '20',
          rawText: `${isIndonesian ? 'Penyesuaian Saldo' : 'Balance Correction'} ${isIncrease ? '+' : '-'}${formatRupiah(adjustmentAmount)}`,
          date: new Date().toISOString(),
        });
      }

      if (onToast) {
        onToast(
          diff !== 0
            ? (isIndonesian
              ? `Dompet "${name.trim()}" diperbarui & saldo disesuaikan`
              : `Wallet "${name.trim()}" updated & balance adjusted`)
            : (isIndonesian
              ? `Dompet "${name.trim()}" berhasil diperbarui`
              : `Wallet "${name.trim()}" updated successfully`),
          'wallet-outline'
        );
      }
    }

    resetForm();
  };

  const handleDeleteConfirm = async () => {
    if (deleteTarget) {
      const targetName = deleteTarget.name;
      const res = await deleteWallet(deleteTarget.id);
      if (!res.success) {
        setWalletAlert({
          title: isIndonesian ? 'Gagal Menghapus' : 'Delete Failed',
          message: res.message,
          type: 'danger',
        });
      } else {
        if (mode === 'edit') {
          setMode('list');
        }
        if (onToast) {
          onToast(
            isIndonesian
              ? `Dompet "${targetName}" berhasil dihapus`
              : `Wallet "${targetName}" deleted`,
            'trash-outline'
          );
        }
      }
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <NeoModal
        visible={visible}
        onClose={() => {
          resetForm();
          onClose();
        }}
        title={
          mode === 'list'
            ? isIndonesian
              ? 'Kelola Dompet'
              : 'Manage Wallets'
            : mode === 'create'
              ? isIndonesian
                ? 'Tambah Dompet Baru'
                : 'Add New Wallet'
              : isIndonesian
                ? 'Edit Dompet'
                : 'Edit Wallet'
        }
        subtitle={
          mode === 'list'
            ? isIndonesian
              ? 'Diversifikasi sumber dana dan akun Anda'
              : 'Diversify your funds and accounts'
            : isIndonesian
              ? 'Atur nama, ikon, warna, dan saldo awal'
              : 'Configure name, icon, color, and balance'
        }
        footer={
          mode === 'list' ? (
            <NeoButton
              title={isIndonesian ? 'Tambah Dompet Baru' : 'Add New Wallet'}
              variant="primary"
              onPress={handleStartCreate}
              fullWidth
            />
          ) : (
            <View style={styles.formFooterRow}>
              {mode === 'edit' && !editingWallet?.isDefault && (
                <Pressable
                  onPress={() => setDeleteTarget(editingWallet)}
                  style={({ pressed }) => [
                    styles.formDeleteBtn,
                    {
                      backgroundColor: (colors.expense || '#EF4444') + '15',
                      borderColor: colors.expense || '#EF4444',
                    },
                    pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] },
                  ]}
                  accessibilityLabel={isIndonesian ? 'Hapus Dompet' : 'Delete Wallet'}
                >
                  <Ionicons name="trash-outline" size={18} color={colors.expense || '#EF4444'} />
                </Pressable>
              )}
              <Pressable
                onPress={() => setMode('list')}
                style={({ pressed }) => [
                  styles.cancelBtn,
                  { backgroundColor: colors.surfaceLight, borderColor: colors.border },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
                  {isIndonesian ? 'Batal' : 'Cancel'}
                </Text>
              </Pressable>
              <View style={{ flex: 1 }}>
                <NeoButton
                  title={isIndonesian ? 'Simpan Dompet' : 'Save Wallet'}
                  variant="primary"
                  onPress={handleSave}
                  fullWidth
                />
              </View>
            </View>
          )
        }
        overlay={
          <>
            {Boolean(deleteTarget) && (
              <ConfirmModal
                insideModal={true}
                visible={Boolean(deleteTarget)}
                title={isIndonesian ? 'Hapus Dompet?' : 'Delete Wallet?'}
                message={
                  isIndonesian
                    ? `Apakah Anda yakin ingin menghapus dompet "${deleteTarget?.name}"? Transaksi yang terkait akan dialihkan ke dompet utama.`
                    : `Are you sure you want to delete "${deleteTarget?.name}"? Transactions will be reassigned to the default wallet.`
                }
                confirmText={isIndonesian ? 'Ya, Hapus' : 'Yes, Delete'}
                cancelText={isIndonesian ? 'Batal' : 'Cancel'}
                onConfirm={handleDeleteConfirm}
                onClose={() => setDeleteTarget(null)}
              />
            )}

            {Boolean(walletAlert) && (
              <ConfirmModal
                insideModal={true}
                visible={Boolean(walletAlert)}
                title={walletAlert.title}
                message={walletAlert.message}
                type={walletAlert.type || 'warning'}
                iconName={walletAlert.iconName}
                showCancel={false}
                confirmText={isIndonesian ? 'Tutup' : 'Close'}
                onClose={() => setWalletAlert(null)}
              />
            )}
          </>
        }
      >
        {mode === 'list' ? (
          /* WALLET LIST VIEW */
          <View style={styles.listContainer}>
            {wallets.map((wallet) => {
              const stats = getWalletBalance(wallet.id, transactions);
              const cardColor = wallet.color || colors.primary;

              return (
                <View
                  key={wallet.id}
                  style={[
                    styles.walletItem,
                    {
                      backgroundColor: colors.surfaceLight,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={styles.walletItemLeft}>
                    <View
                      style={[
                        styles.walletItemIcon,
                        { backgroundColor: cardColor + '20', borderColor: cardColor },
                      ]}
                    >
                      <Ionicons
                        name={wallet.icon || 'wallet-outline'}
                        size={20}
                        color={cardColor}
                      />
                    </View>
                    <View style={styles.walletItemText}>
                      <View style={styles.nameRow}>
                        <Text
                          style={[styles.walletItemTitle, { color: colors.text }]}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {wallet.name}
                        </Text>
                        {wallet.isDefault && (
                          <View
                            style={[
                              styles.defaultBadge,
                              { backgroundColor: colors.primary + '20' },
                            ]}
                          >
                            <Text
                              style={[styles.defaultBadgeText, { color: colors.primary }]}
                            >
                              DEFAULT
                            </Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.balanceRow}>
                        <Text
                          style={[
                            styles.walletItemBalance,
                            { color: stats.balance >= 0 ? colors.textSecondary : (colors.expense || '#EF4444') },
                          ]}
                        >
                          {formatRupiah(stats.balance)}
                        </Text>
                        {stats.balance < 0 && (
                          <View
                            style={[
                              styles.debtBadge,
                              {
                                backgroundColor: colors.expenseLight || '#FEF2F2',
                                borderColor: colors.expense || '#EF4444',
                              },
                            ]}
                          >
                            <Text
                              style={[styles.debtBadgeText, { color: colors.expense || '#EF4444' }]}
                            >
                              {isIndonesian ? 'Hutang' : 'Debt'}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  <View style={styles.actionsRow}>
                    <Pressable
                      onPress={() => handleStartEdit(wallet)}
                      style={[
                        styles.iconActionBtn,
                        {
                          backgroundColor: colors.surface,
                          borderColor: colors.borderLight,
                        },
                      ]}
                    >
                      <Ionicons name="pencil" size={14} color={colors.primary} />
                    </Pressable>
                    {!wallet.isDefault && (
                      <Pressable
                        onPress={() => setDeleteTarget(wallet)}
                        style={[
                          styles.iconActionBtn,
                          {
                            backgroundColor: colors.surface,
                            borderColor: colors.borderLight,
                          },
                        ]}
                      >
                        <Ionicons name="trash-outline" size={14} color={colors.expense} />
                      </Pressable>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          /* CREATE / EDIT FORM VIEW */
          <View style={styles.formContainer}>
            {/* Name Input */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                {isIndonesian ? 'NAMA DOMPET / REKENING :' : 'WALLET / ACCOUNT NAME :'}
              </Text>
              <NeoInput
                placeholder={isIndonesian ? 'misal: BCA, GoPay, Tabungan Haji...' : 'e.g. Bank Account, Cash, Crypto...'}
                value={name}
                onChangeText={setName}
                leftIconName="wallet-outline"
              />
            </View>

            {/* Balance Input */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                {mode === 'edit'
                  ? (isIndonesian ? 'SALDO DOMPET SAAT INI (RUPIAH) :' : 'CURRENT WALLET BALANCE (IDR) :')
                  : (isIndonesian ? 'SALDO AWAL (RUPIAH) :' : 'INITIAL BALANCE (IDR) :')}
              </Text>

              {/* Sign Selector (Positif vs Negatif / Hutang) - Compact Segmented */}
              <View
                style={[
                  styles.signSegmentedContainer,
                  { backgroundColor: colors.surfaceLight, borderColor: colors.borderLight },
                ]}
              >
                <Pressable
                  onPress={() => setIsNegative(false)}
                  style={({ pressed }) => [
                    styles.signSegmentedTab,
                    !isNegative
                      ? [
                          styles.signSegmentedTabActive,
                          {
                            backgroundColor: colors.primary + '18',
                            borderColor: colors.primary,
                          },
                        ]
                      : null,
                    pressed && styles.tabPressed,
                  ]}
                >
                  <Ionicons
                    name="add-circle"
                    size={14}
                    color={!isNegative ? colors.primary : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.signSegmentedText,
                      {
                        color: !isNegative ? colors.primary : colors.textMuted,
                        fontWeight: !isNegative ? '800' : '600',
                      },
                    ]}
                  >
                    {isIndonesian ? '+ Positif' : '+ Positive'}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setIsNegative(true)}
                  style={({ pressed }) => [
                    styles.signSegmentedTab,
                    isNegative
                      ? [
                          styles.signSegmentedTabActive,
                          {
                            backgroundColor: (colors.expense || '#EF4444') + '18',
                            borderColor: colors.expense || '#EF4444',
                          },
                        ]
                      : null,
                    pressed && styles.tabPressed,
                  ]}
                >
                  <Ionicons
                    name="remove-circle"
                    size={14}
                    color={isNegative ? (colors.expense || '#EF4444') : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.signSegmentedText,
                      {
                        color: isNegative ? (colors.expense || '#EF4444') : colors.textMuted,
                        fontWeight: isNegative ? '800' : '600',
                      },
                    ]}
                  >
                    {isIndonesian ? '- Hutang' : '- Debt'}
                  </Text>
                </Pressable>
              </View>

              <NeoInput
                placeholder={isNegative ? "-Rp 0" : "Rp 0"}
                value={formatBalanceInput(balanceDigits, isNegative)}
                onChangeText={(val) => {
                  if (!val) {
                    setBalanceDigits('');
                    return;
                  }
                  const digits = val.replace(/\D/g, '');
                  setBalanceDigits(digits);
                }}
                keyboardType="numeric"
                leftIconName={isNegative ? "alert-circle-outline" : "cash-outline"}
                rightIcon={
                  balanceDigits ? (
                    <Pressable onPress={() => setBalanceDigits('')} hitSlop={10}>
                      <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                    </Pressable>
                  ) : null
                }
              />
              <Text style={[styles.balanceHint, { color: isNegative ? (colors.expense || '#EF4444') : colors.textMuted }]}>
                {isNegative
                  ? (isIndonesian
                    ? 'Saldo negatif dicatat sebagai kewajiban/hutang (kartu kredit, pinjaman, paylater).'
                    : 'Negative balance is recorded as debt/liability (credit card, loan, paylater).')
                  : mode === 'edit'
                    ? (isIndonesian
                      ? 'Total saldo riil dompet ini. Anda dapat langsung mengubahnya sesuai saldo fisik/rekening Anda.'
                      : 'Total real balance of this wallet. You can change it to match your actual balance.')
                    : (isIndonesian
                      ? 'Saldo yang tersedia di dompet ini saat pertama kali dibuat.'
                      : 'Starting balance available in this wallet upon creation.')}
              </Text>
            </View>

            {/* Icon Picker */}
            <View style={styles.formGroup}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                  {isIndonesian ? 'PILIH IKON :' : 'SELECT ICON :'}
                </Text>
                <Pressable
                  onPress={() => setIconsExpanded(!iconsExpanded)}
                  style={({ pressed }) => [
                    styles.expandToggleBtn,
                    {
                      backgroundColor: colors.surfaceLight,
                      borderColor: colors.borderLight,
                    },
                    pressed && styles.expandBtnPressed,
                  ]}
                >
                  <Text style={[styles.expandToggleText, { color: colors.primary }]}>
                    {iconsExpanded
                      ? (isIndonesian ? 'Sembunyikan' : 'Show Less')
                      : (isIndonesian ? `Lebih Banyak (+${EXTENDED_WALLET_ICONS.length})` : `More (+${EXTENDED_WALLET_ICONS.length})`)}
                  </Text>
                  <Ionicons
                    name={iconsExpanded ? 'chevron-up' : 'chevron-down'}
                    size={13}
                    color={colors.primary}
                  />
                </Pressable>
              </View>

              <View style={styles.pickerGrid}>
                {(iconsExpanded ? WALLET_ICONS : PRIMARY_WALLET_ICONS).map((iconName) => {
                  const isSelected = selectedIcon === iconName;
                  return (
                    <Pressable
                      key={iconName}
                      onPress={() => setSelectedIcon(iconName)}
                      style={[
                        styles.pickerBox,
                        {
                          backgroundColor: isSelected ? selectedColor + '25' : colors.surfaceLight,
                          borderColor: isSelected ? selectedColor : colors.borderLight,
                          borderWidth: isSelected ? 2.5 : 1,
                        },
                      ]}
                    >
                      <Ionicons
                        name={iconName}
                        size={20}
                        color={isSelected ? selectedColor : colors.textSecondary}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Color Picker */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                {isIndonesian ? 'PILIH WARNA TEMA :' : 'SELECT THEME COLOR :'}
              </Text>
              <View style={styles.pickerGrid}>
                {WALLET_COLORS.map((c) => {
                  const isSelected = selectedColor === c;
                  return (
                    <Pressable
                      key={c}
                      onPress={() => setSelectedColor(c)}
                      style={[
                        styles.colorBox,
                        { backgroundColor: c },
                        isSelected && {
                          borderColor: '#FFFFFF',
                          borderWidth: 3,
                          transform: [{ scale: 1.15 }],
                        },
                      ]}
                    >
                      {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        )}
      </NeoModal>
    </>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    gap: 10,
  },
  walletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  walletItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
    marginRight: 10,
  },
  walletItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  walletItemText: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  walletItemTitle: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '800',
    flexShrink: 1,
  },
  defaultBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    flexShrink: 0,
  },
  defaultBadgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  walletItemBalance: {
    fontSize: 12,
    fontWeight: '600',
  },
  debtBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    flexShrink: 0,
  },
  debtBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 0,
  },
  iconActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signSegmentedContainer: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 2.5,
    marginTop: 2,
    marginBottom: 4,
  },
  signSegmentedTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 7,
  },
  signSegmentedTabActive: {
    borderWidth: 1,
  },
  tabPressed: {
    opacity: 0.75,
  },
  signSegmentedText: {
    fontSize: 11,
    letterSpacing: 0.1,
  },
  formContainer: {
    gap: 16,
  },
  formGroup: {
    gap: 6,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  expandToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  expandToggleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  expandBtnPressed: {
    opacity: 0.7,
  },
  balanceHint: {
    fontSize: 10,
    marginTop: 4,
    lineHeight: 14,
  },
  pickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pickerBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  formDeleteBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
});

export default ManageWalletsModal;
