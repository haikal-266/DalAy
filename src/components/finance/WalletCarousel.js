import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../../theme/typography';
import { useTheme } from '../../stores/themeStore';
import { useLanguage } from '../../stores/languageStore';
import { useWallet } from '../../stores/walletStore';
import { useFinance } from '../../stores/financeStore';
import { formatRupiah } from '../../utils/formatters';

export const WalletCarousel = ({ onOpenManageWallets, onAddNewWallet }) => {
  const { colors, isDark } = useTheme();
  const { isIndonesian } = useLanguage();
  const {
    wallets,
    selectedWalletId,
    selectWallet,
    getWalletBalance,
    getTotalNetWorth,
  } = useWallet();
  const { transactions, setWalletFilter } = useFinance();

  const totalNetWorth = getTotalNetWorth(transactions);
  const isAllSelected = selectedWalletId === 'all';

  const handleSelect = (id) => {
    selectWallet(id);
    setWalletFilter(id);
  };

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Ionicons name="wallet" size={18} color={colors.primary} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {isIndonesian ? 'Dompet & Rekening' : 'Wallets & Accounts'}
          </Text>
        </View>

        <Pressable
          onPress={onOpenManageWallets}
          style={({ pressed }) => [
            styles.manageBtn,
            {
              backgroundColor: colors.surfaceLight,
              borderColor: colors.border,
            },
            pressed && styles.pressed,
          ]}
        >
          <Ionicons name="settings-outline" size={13} color={colors.textSecondary} />
          <Text style={[styles.manageBtnText, { color: colors.textSecondary }]}>
            {isIndonesian ? 'Kelola' : 'Manage'}
          </Text>
        </Pressable>
      </View>

      {/* Horizontal Cards ScrollView */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Card: Total / Semua Dompet */}
        <Pressable
          onPress={() => handleSelect('all')}
          style={({ pressed }) => [
            styles.walletCard,
            {
              backgroundColor: isAllSelected ? colors.surface : colors.surfaceLight,
              borderColor: isAllSelected ? colors.primary : colors.border,
              borderWidth: isAllSelected ? 2.5 : 1.5,
            },
            isAllSelected && {
              shadowColor: colors.primary,
              shadowOpacity: 0.25,
              shadowRadius: 10,
              elevation: 6,
            },
            pressed && styles.pressed,
          ]}
        >
          <View style={styles.cardHeader}>
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: colors.primary + '20', borderColor: colors.primary },
              ]}
            >
              <Ionicons name="layers-outline" size={16} color={colors.primary} />
            </View>
            {isAllSelected && (
              <View style={[styles.activePill, { backgroundColor: colors.primary }]}>
                <Text style={styles.activePillText}>
                  {isIndonesian ? 'AKTIF' : 'ACTIVE'}
                </Text>
              </View>
            )}
          </View>

          <Text style={[styles.walletName, { color: colors.textSecondary }]} numberOfLines={1}>
            {isIndonesian ? 'Semua Dompet' : 'All Wallets'}
          </Text>
          <Text
            style={[
              styles.walletBalance,
              { color: totalNetWorth >= 0 ? colors.income : colors.expense },
            ]}
            numberOfLines={1}
          >
            {formatRupiah(totalNetWorth)}
          </Text>
          <Text style={[styles.walletSub, { color: colors.textMuted }]}>
            {wallets.length} {isIndonesian ? 'dompet terhubung' : 'wallets linked'}
          </Text>
        </Pressable>

        {/* Individual Wallet Cards */}
        {wallets.map((wallet) => {
          const stats = getWalletBalance(wallet.id, transactions);
          const isSelected = selectedWalletId === wallet.id;
          const cardColor = wallet.color || colors.primary;

          return (
            <Pressable
              key={wallet.id}
              onPress={() => handleSelect(wallet.id)}
              style={({ pressed }) => [
                styles.walletCard,
                {
                  backgroundColor: isSelected ? colors.surface : colors.surfaceLight,
                  borderColor: isSelected ? cardColor : colors.border,
                  borderWidth: isSelected ? 2.5 : 1.5,
                },
                isSelected && {
                  shadowColor: cardColor,
                  shadowOpacity: 0.25,
                  shadowRadius: 10,
                  elevation: 6,
                },
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.cardHeader}>
                <View
                  style={[
                    styles.iconBadge,
                    { backgroundColor: cardColor + '20', borderColor: cardColor },
                  ]}
                >
                  <Ionicons name={wallet.icon || 'wallet-outline'} size={16} color={cardColor} />
                </View>
                {isSelected && (
                  <View style={[styles.activePill, { backgroundColor: cardColor }]}>
                    <Text style={styles.activePillText}>
                      {isIndonesian ? 'AKTIF' : 'ACTIVE'}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={[styles.walletName, { color: colors.text }]} numberOfLines={1}>
                {wallet.name}
              </Text>
              <Text
                style={[
                  styles.walletBalance,
                  { color: stats.balance >= 0 ? colors.text : colors.expense },
                ]}
                numberOfLines={1}
              >
                {formatRupiah(stats.balance)}
              </Text>
              <Text style={[styles.walletSub, { color: colors.textMuted }]}>
                {stats.txCount} {isIndonesian ? 'transaksi' : (stats.txCount === 1 ? 'transaction' : 'transactions')}
              </Text>
            </Pressable>
          );
        })}

        {/* Card: Tambah Dompet Baru */}
        <Pressable
          onPress={onAddNewWallet}
          style={({ pressed }) => [
            styles.walletCard,
            styles.addCard,
            {
              borderColor: colors.borderLight,
              backgroundColor: isDark ? '#131D2A' : '#F8FAFC',
            },
            pressed && styles.pressed,
          ]}
        >
          <View
            style={[
              styles.addIconCircle,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Ionicons name="add" size={20} color={colors.primary} />
          </View>
          <Text style={[styles.addCardText, { color: colors.textSecondary }]}>
            {isIndonesian ? '+ Tambah' : '+ Add'}
          </Text>
          <Text style={[styles.addCardSub, { color: colors.textMuted }]}>
            {isIndonesian ? 'Dompet Baru' : 'New Wallet'}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '800',
    letterSpacing: -0.2,
    textTransform: 'uppercase',
  },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  manageBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
    paddingVertical: 4,
  },
  walletCard: {
    width: 155,
    borderRadius: 18,
    padding: 14,
    justifyContent: 'space-between',
    minHeight: 125,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activePillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  walletName: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  walletBalance: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  walletSub: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 4,
  },
  addCard: {
    borderStyle: 'dashed',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  addCardText: {
    fontSize: 13,
    fontWeight: '800',
  },
  addCardSub: {
    fontSize: 10,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
});

export default WalletCarousel;
