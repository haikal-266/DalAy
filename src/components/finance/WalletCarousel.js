import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../stores/themeStore';
import { useLanguage } from '../../stores/languageStore';
import { useWallet } from '../../stores/walletStore';
import { useFinance } from '../../stores/financeStore';
import { formatRupiah } from '../../utils/formatters';
import { useSwipeNavigation } from '../../stores/swipeNavigationStore';

export const WalletCarousel = ({ onOpenManageWallets, onAddNewWallet, onOpenTransfer }) => {
  const { colors, isDark } = useTheme();
  const { isIndonesian } = useLanguage();
  const { width: windowWidth } = useWindowDimensions();
  const { setSwipeEnabled } = useSwipeNavigation();
  const {
    wallets,
    selectedWalletId,
    selectWallet,
    getWalletBalance,
  } = useWallet();
  const { transactions } = useFinance();

  const scrollViewRef = useRef(null);

  // Total slides = wallets.length + 1 ("Tambah Dompet")
  const totalSlides = wallets.length + 1;
  const slideKeys = [...wallets.map((w) => `slide_${w.id}`), 'slide_add_new'];

  const [activeIndex, setActiveIndex] = useState(() => {
    if (selectedWalletId === 'all') return 0;
    const idx = wallets.findIndex((w) => w.id === selectedWalletId);
    return idx >= 0 ? idx : 0;
  });

  const scrollToIndex = (index, animated = true) => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({
        x: index * windowWidth,
        animated,
      });
      setActiveIndex(index);
    }
  };

  // Sync scroll position if selectedWalletId changes externally or on initial mount
  useEffect(() => {
    if (selectedWalletId === 'all') return;
    const idx = wallets.findIndex((w) => w.id === selectedWalletId);
    if (idx >= 0 && idx !== activeIndex) {
      scrollToIndex(idx, true);
    }
  }, [selectedWalletId]);

  useEffect(() => {
    if (selectedWalletId === 'all') return;
    const idx = wallets.findIndex((w) => w.id === selectedWalletId);
    if (idx >= 0) {
      const timer = setTimeout(() => {
        scrollToIndex(idx, false);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleScrollEnd = (e) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / windowWidth);
    if (newIndex >= 0 && newIndex < totalSlides && newIndex !== activeIndex) {
      setActiveIndex(newIndex);
      // Auto-select wallet corresponding to this slide for default input context
      if (newIndex < wallets.length) {
        const targetWallet = wallets[newIndex];
        if (targetWallet) {
          selectWallet(targetWallet.id);
        }
      }
    }
  };

  const handleSelect = (id, index) => {
    if (id === 'add_new') {
      onAddNewWallet();
      return;
    }
    selectWallet(id);
    scrollToIndex(index, true);
  };

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Ionicons name="wallet" size={15} color={colors.primary} />
          <Text
            style={[styles.headerTitle, { color: colors.text }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {isIndonesian ? 'Dompet & Rekening' : 'Wallets & Accounts'}
          </Text>
        </View>

        <View style={styles.headerActions}>
          {/* Transfer Button */}
          {wallets.length > 1 && (
            <Pressable
              onPress={onOpenTransfer}
              style={({ pressed }) => [
                styles.transferHeaderBtn,
                {
                  backgroundColor: colors.primaryLight || '#F0FDF4',
                  borderColor: colors.primary,
                },
                pressed && styles.pressed,
              ]}
              accessibilityLabel="Transfer Antar Dompet"
            >
              <Ionicons name="swap-horizontal" size={12} color={colors.primaryDark} />
              <Text style={[styles.transferHeaderBtnText, { color: colors.primaryDark }]}>
                {isIndonesian ? 'Transfer' : 'Transfer'}
              </Text>
            </Pressable>
          )}

          {/* Manage Button */}
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
            <Ionicons name="settings-outline" size={12} color={colors.textSecondary} />
            <Text style={[styles.manageBtnText, { color: colors.textSecondary }]}>
              {isIndonesian ? 'Kelola' : 'Manage'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Full-Card Native Paging Swiper (Apple Wallet / GoPay Style) */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled={true}
        showsHorizontalScrollIndicator={false}
        onTouchStart={() => setSwipeEnabled(false)}
        onTouchEnd={() => setSwipeEnabled(true)}
        onTouchCancel={() => setSwipeEnabled(true)}
        onScrollBeginDrag={() => setSwipeEnabled(false)}
        onMomentumScrollEnd={(e) => {
          setSwipeEnabled(true);
          handleScrollEnd(e);
        }}
        decelerationRate="fast"
      >
        {/* Individual Wallet Slides */}
        {wallets.map((wallet, idx) => {
          const stats = getWalletBalance(wallet.id, transactions);
          const isSelected = selectedWalletId === wallet.id;
          const cardColor = wallet.color || colors.primary;
          const slideIndex = idx;

          return (
            <View key={wallet.id} style={[styles.slideContainer, { width: windowWidth }]}>
              <Pressable
                onPress={() => handleSelect(wallet.id, slideIndex)}
                style={({ pressed }) => [
                  styles.walletCard,
                  {
                    backgroundColor: isSelected ? colors.surface : colors.surfaceLight,
                    borderColor: isSelected ? cardColor : colors.border,
                    borderWidth: isSelected ? 2 : 1.5,
                  },
                  isSelected && {
                    shadowColor: cardColor,
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 4,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardHeaderLeft}>
                    <View
                      style={[
                        styles.iconBadge,
                        { backgroundColor: cardColor + '20', borderColor: cardColor },
                      ]}
                    >
                      <Ionicons name={wallet.icon || 'wallet-outline'} size={18} color={cardColor} />
                    </View>
                    <View style={styles.headerTitleCol}>
                      <Text style={[styles.walletName, { color: colors.text }]} numberOfLines={1}>
                        {wallet.name}
                      </Text>
                      <Text style={[styles.walletTypeLabel, { color: colors.textMuted }]}>
                        {wallet.type === 'bank'
                          ? (isIndonesian ? 'Rekening Bank' : 'Bank Account')
                          : wallet.type === 'ewallet'
                          ? (isIndonesian ? 'Dompet Digital' : 'E-Wallet')
                          : wallet.type === 'cash'
                          ? (isIndonesian ? 'Uang Tunai' : 'Cash')
                          : (isIndonesian ? 'Dompet Kustom' : 'Custom Wallet')}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.headerRightBadges}>
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
                        <Text style={[styles.debtBadgeText, { color: colors.expense || '#EF4444' }]}>
                          {isIndonesian ? 'Hutang' : 'Debt'}
                        </Text>
                      </View>
                    )}
                    {isSelected && (
                      <View style={[styles.activePill, { backgroundColor: cardColor }]}>
                        <Ionicons name="checkmark-circle" size={11} color="#FFFFFF" />
                        <Text style={styles.activePillText}>
                          {isIndonesian ? 'AKTIF' : 'ACTIVE'}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>
                    {isIndonesian ? 'SALDO TERSEDIA' : 'AVAILABLE BALANCE'}
                  </Text>
                  <Text
                    style={[
                      styles.walletBalance,
                      { color: stats.balance >= 0 ? colors.text : colors.expense },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                  >
                    {formatRupiah(stats.balance)}
                  </Text>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={[styles.walletSub, { color: colors.textMuted }]}>
                    <Ionicons name="receipt-outline" size={12} color={colors.textMuted} /> {stats.txCount} {isIndonesian ? 'transaksi tercatat' : 'transactions recorded'}
                  </Text>
                  <Text style={[styles.swipeHint, { color: colors.textMuted }]}>
                    {isIndonesian ? 'Geser untuk ganti dompet ›' : 'Swipe to switch ›'}
                  </Text>
                </View>
              </Pressable>
            </View>
          );
        })}

        {/* Slide N+1: Tambah Dompet Baru */}
        <View style={[styles.slideContainer, { width: windowWidth }]}>
          <Pressable
            onPress={onAddNewWallet}
            style={({ pressed }) => [
              styles.walletCard,
              styles.addCard,
              {
                borderColor: colors.primary,
                borderWidth: 2,
                backgroundColor: isDark ? '#131D2A' : '#F8FAFC',
              },
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.addCardContent}>
              <View
                style={[
                  styles.addIconCircle,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Ionicons name="add" size={26} color={colors.primary} />
              </View>
              <Text style={[styles.addCardText, { color: colors.text }]}>
                {isIndonesian ? 'Tambah Dompet Baru' : 'Add New Wallet'}
              </Text>
              <Text style={[styles.addCardSub, { color: colors.textMuted }]}>
                {isIndonesian
                  ? 'Hubungkan rekening bank, e-wallet, atau kas fisik'
                  : 'Link a bank account, e-wallet, or physical cash'}
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      {/* Pagination Dots Indicator (Apple Wallet / GoPay style) */}
      <View style={styles.paginationRow}>
        {slideKeys.map((slideKey, idx) => {
          const isActive = idx === activeIndex;
          return (
            <Pressable
              key={`page-dot-${slideKey}`}
              onPress={() => scrollToIndex(idx, true)}
              hitSlop={8}
            >
              <View
                style={[
                  styles.dot,
                  isActive
                    ? [styles.activeDot, { backgroundColor: colors.primary }]
                    : [styles.inactiveDot, { backgroundColor: isDark ? '#334155' : '#CBD5E1' }],
                ]}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: -16,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 10,
    gap: 8,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
    flexShrink: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  transferHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
  },
  transferHeaderBtnText: {
    fontSize: 10,
    fontWeight: '800',
  },
  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
  },
  manageBtnText: {
    fontSize: 10,
    fontWeight: '700',
  },
  slideContainer: {
    paddingHorizontal: 16,
  },
  walletCard: {
    borderRadius: 18,
    padding: 16,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerTitleCol: {
    flex: 1,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletName: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  walletTypeLabel: {
    fontSize: 11,
    marginTop: 1,
  },
  headerRightBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  debtBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  debtBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activePillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  cardBody: {
    marginVertical: 8,
  },
  balanceLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  walletBalance: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.2)',
    paddingTop: 8,
  },
  walletSub: {
    fontSize: 11,
    fontWeight: '600',
  },
  swipeHint: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  addCard: {
    borderWidth: 2,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
  },
  addCardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  addCardText: {
    fontSize: 14,
    fontWeight: '800',
  },
  addCardSub: {
    fontSize: 11,
    textAlign: 'center',
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 22,
  },
  inactiveDot: {
    width: 6,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});

export default WalletCarousel;
