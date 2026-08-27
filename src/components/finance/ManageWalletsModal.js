import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../../theme/typography';
import { NeoModal } from '../neo/NeoModal';
import { NeoInput } from '../neo/NeoInput';
import { NeoButton } from '../neo/NeoButton';
import { ConfirmModal } from '../neo/ConfirmModal';
import { useTheme } from '../../stores/themeStore';
import { useLanguage } from '../../stores/languageStore';
import { useWallet, WALLET_ICONS, WALLET_COLORS } from '../../stores/walletStore';
import { useFinance } from '../../stores/financeStore';
import { formatRupiah } from '../../utils/formatters';

export const ManageWalletsModal = ({ visible, onClose, initialAddMode = false }) => {
  const { colors, isDark } = useTheme();
  const { isIndonesian } = useLanguage();
  const { wallets, addWallet, updateWallet, deleteWallet, getWalletBalance } = useWallet();
  const { transactions } = useFinance();

  // Mode: 'list' | 'create' | 'edit'
  const [mode, setMode] = useState(initialAddMode ? 'create' : 'list');
  const [editingWallet, setEditingWallet] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [initialBalance, setInitialBalance] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(WALLET_ICONS[0]);
  const [selectedColor, setSelectedColor] = useState(WALLET_COLORS[0]);

  // Delete Confirm Modal
  const [deleteTarget, setDeleteTarget] = useState(null);

  const resetForm = () => {
    setName('');
    setInitialBalance('');
    setSelectedIcon(WALLET_ICONS[0]);
    setSelectedColor(WALLET_COLORS[0]);
    setEditingWallet(null);
    setMode('list');
  };

  const handleStartCreate = () => {
    resetForm();
    setMode('create');
  };

  const handleStartEdit = (wallet) => {
    setEditingWallet(wallet);
    setName(wallet.name);
    setInitialBalance(wallet.initialBalance ? wallet.initialBalance.toString() : '');
    setSelectedIcon(wallet.icon || WALLET_ICONS[0]);
    setSelectedColor(wallet.color || WALLET_COLORS[0]);
    setMode('edit');
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(
        isIndonesian ? 'Nama Diperlukan' : 'Name Required',
        isIndonesian ? 'Silakan masukkan nama dompet.' : 'Please enter wallet name.'
      );
      return;
    }

    const cleanBalance = Number.parseInt(initialBalance.replace(/\D/g, ''), 10) || 0;

    if (mode === 'create') {
      await addWallet({
        name: name.trim(),
        initialBalance: cleanBalance,
        icon: selectedIcon,
        color: selectedColor,
      });
    } else if (mode === 'edit' && editingWallet) {
      await updateWallet(editingWallet.id, {
        name: name.trim(),
        initialBalance: cleanBalance,
        icon: selectedIcon,
        color: selectedColor,
      });
    }

    resetForm();
  };

  const handleDeleteConfirm = async () => {
    if (deleteTarget) {
      const res = await deleteWallet(deleteTarget.id);
      if (!res.success) {
        Alert.alert(isIndonesian ? 'Gagal' : 'Failed', res.message);
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
              title={isIndonesian ? '+ Tambah Dompet Baru' : '+ Add New Wallet'}
              variant="primary"
              onPress={handleStartCreate}
              fullWidth
            />
          ) : (
            <View style={styles.formFooterRow}>
              <Pressable
                onPress={() => setMode('list')}
                style={[
                  styles.cancelBtn,
                  { backgroundColor: colors.surfaceLight, borderColor: colors.border },
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
                        <Text style={[styles.walletItemTitle, { color: colors.text }]}>
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
                      <Text style={[styles.walletItemBalance, { color: colors.textSecondary }]}>
                        {formatRupiah(stats.balance)}
                      </Text>
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

            {/* Initial Balance Input */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                {isIndonesian ? 'SALDO AWAL (RUPIAH) :' : 'INITIAL BALANCE (IDR) :'}
              </Text>
              <NeoInput
                placeholder="0"
                value={
                  initialBalance
                    ? formatRupiah(Number.parseInt(initialBalance.replace(/\D/g, ''), 10) || 0, true)
                    : ''
                }
                onChangeText={(val) => setInitialBalance(val.replace(/\D/g, ''))}
                keyboardType="numeric"
                leftIconName="cash-outline"
              />
            </View>

            {/* Icon Picker */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                {isIndonesian ? 'PILIH IKON :' : 'SELECT ICON :'}
              </Text>
              <View style={styles.pickerGrid}>
                {WALLET_ICONS.map((iconName) => {
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        visible={!!deleteTarget}
        title={isIndonesian ? 'Hapus Dompet?' : 'Delete Wallet?'}
        message={
          isIndonesian
            ? `Apakah Anda yakin ingin menghapus dompet "${deleteTarget?.name}"? Transaksi yang terkait akan dialihkan ke dompet utama.`
            : `Are you sure you want to delete "${deleteTarget?.name}"? Transactions will be reassigned to the default wallet.`
        }
        confirmText={isIndonesian ? 'Ya, Hapus' : 'Yes, Delete'}
        cancelText={isIndonesian ? 'Batal' : 'Cancel'}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
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
  },
  walletItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletItemText: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  walletItemTitle: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '800',
  },
  defaultBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  defaultBadgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  walletItemBalance: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
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
