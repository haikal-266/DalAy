import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NeoModal } from '../neo/NeoModal';
import { NeoButton } from '../neo/NeoButton';
import { useTheme } from '../../stores/themeStore';
import { useLanguage } from '../../stores/languageStore';
import { useWallet } from '../../stores/walletStore';
import { useFinance } from '../../stores/financeStore';
import { formatRupiah } from '../../utils/formatters';

const QUICK_AMOUNTS = [
  { label: '+10rb', value: 10000 },
  { label: '+25rb', value: 25000 },
  { label: '+50rb', value: 50000 },
  { label: '+100rb', value: 100000 },
  { label: '+500rb', value: 500000 },
];

const ADMIN_FEES = [
  { label: '0k (Gratis)', value: 0 },
  { label: '1k', value: 1000 },
  { label: '2k', value: 2000 },
  { label: '3k', value: 3000 },
  { label: '6k', value: 6000 },
  { label: '10k', value: 10000 },
];

export const TransferModal = ({
  visible,
  onClose,
  onSuccess,
  defaultSourceWalletId,
}) => {
  const { colors, isDark } = useTheme();
  const { t, isIndonesian } = useLanguage();
  const { wallets, selectedWalletId, getWalletBalance } = useWallet();
  const { transactions, transferBalance } = useFinance();

  const [sourceWalletId, setSourceWalletId] = useState(null);
  const [targetWalletId, setTargetWalletId] = useState(null);
  const [amountStr, setAmountStr] = useState('');
  const [adminFeeStr, setAdminFeeStr] = useState('0');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdminFeeInput, setShowAdminFeeInput] = useState(false);

  // Initialize source & target wallets when modal opens
  useEffect(() => {
    if (visible && wallets.length > 0) {
      const initialSourceId =
        defaultSourceWalletId && defaultSourceWalletId !== 'all'
          ? defaultSourceWalletId
          : selectedWalletId !== 'all'
          ? selectedWalletId
          : wallets[0]?.id;

      setSourceWalletId(initialSourceId);

      // Find first different wallet for target
      const otherWallet = wallets.find((w) => w.id !== initialSourceId) || wallets[0];
      setTargetWalletId(otherWallet?.id);

      setAmountStr('');
      setAdminFeeStr('0');
      setShowAdminFeeInput(false);
      setNote('');
      setIsSubmitting(false);
    }
  }, [visible, wallets, selectedWalletId, defaultSourceWalletId]);

  const sourceWallet = useMemo(
    () => wallets.find((w) => w.id === sourceWalletId) || wallets[0],
    [wallets, sourceWalletId]
  );

  const targetWallet = useMemo(
    () => wallets.find((w) => w.id === targetWalletId) || wallets[1] || wallets[0],
    [wallets, targetWalletId]
  );

  const sourceStats = useMemo(() => {
    if (!sourceWallet) return { balance: 0 };
    return getWalletBalance(sourceWallet.id, transactions);
  }, [sourceWallet, transactions, getWalletBalance]);

  const targetStats = useMemo(() => {
    if (!targetWallet) return { balance: 0 };
    return getWalletBalance(targetWallet.id, transactions);
  }, [targetWallet, transactions, getWalletBalance]);

  const numAmount = useMemo(() => {
    const clean = amountStr.replace(/[^0-9]/g, '');
    return clean ? Number.parseInt(clean, 10) : 0;
  }, [amountStr]);

  const numFee = useMemo(() => {
    const clean = adminFeeStr.replace(/[^0-9]/g, '');
    return clean ? Number.parseInt(clean, 10) : 0;
  }, [adminFeeStr]);

  // Projected balances after transfer
  const projectedSourceBalance = sourceStats.balance - numAmount - numFee;
  const projectedTargetBalance = targetStats.balance + numAmount;

  const isSameWallet = sourceWalletId === targetWalletId;
  const isValidAmount = numAmount > 0;
  const isInsufficient = numAmount + numFee > sourceStats.balance && sourceStats.balance > 0;

  // Swap source and target wallets
  const handleSwap = () => {
    const temp = sourceWalletId;
    setSourceWalletId(targetWalletId);
    setTargetWalletId(temp);
  };

  const handleQuickAddAmount = (addVal) => {
    setAmountStr((prev) => {
      const current = prev ? Number.parseInt(prev.replace(/[^0-9]/g, ''), 10) || 0 : 0;
      return String(current + addVal);
    });
  };

  const handleUseAllBalance = () => {
    if (sourceStats.balance > 0) {
      const maxTransfer = Math.max(0, sourceStats.balance - numFee);
      setAmountStr(String(maxTransfer));
    }
  };

  const handleConfirmTransfer = async () => {
    if (isSameWallet || !isValidAmount || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await transferBalance({
        sourceWalletId: sourceWallet.id,
        sourceWalletName: sourceWallet.name,
        targetWalletId: targetWallet.id,
        targetWalletName: targetWallet.name,
        amount: numAmount,
        adminFee: numFee,
        note: note.trim(),
      });

      if (typeof onSuccess === 'function') {
        onSuccess(
          isIndonesian
            ? `Berhasil transfer ${formatRupiah(numAmount)} dari ${sourceWallet.name} ke ${targetWallet.name}`
            : `Transferred ${formatRupiah(numAmount)} from ${sourceWallet.name} to ${targetWallet.name}`
        );
      }
      onClose();
    } catch (err) {
      console.log('Error transferring balance:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <NeoModal
      visible={visible}
      onClose={onClose}
      title={t('modal.transferTitle', 'Transfer Antar Dompet')}
      subtitle={t('modal.transferSubtitle', 'Pindahkan saldo antar rekening, e-wallet, atau kas')}
      maxHeight="92%"
      footer={
        <View style={styles.footerRow}>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => [
              styles.cancelBtn,
              { backgroundColor: colors.surfaceLight, borderColor: colors.border },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
              {t('modal.cancel', 'Batal')}
            </Text>
          </Pressable>
          <View style={styles.confirmBtnWrapper}>
            <NeoButton
              title={
                isSubmitting
                  ? isIndonesian
                    ? 'Memproses...'
                    : 'Processing...'
                  : t('modal.confirmTransfer', 'Konfirmasi Transfer')
              }
              variant="primary"
              onPress={handleConfirmTransfer}
              disabled={!isValidAmount || isSameWallet || isSubmitting}
              loading={isSubmitting}
              iconName="swap-horizontal"
              fullWidth
            />
          </View>
        </View>
      }
    >
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
        {/* Source and Target Wallets Interactive Box */}
        <View
          style={[
            styles.walletExchangeCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {/* FROM WALLET SECTION */}
          <View style={styles.exchangeSection}>
            <View style={styles.exchangeHeaderRow}>
              <View style={styles.labelWithIcon}>
                <Ionicons name="arrow-up-circle" size={16} color={colors.expense || '#EF4444'} />
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                  {t('modal.fromWallet', 'Dari Dompet (Sumber)')}
                </Text>
              </View>
              <Text
                style={[
                  styles.currentBalanceText,
                  { color: sourceStats.balance >= 0 ? colors.income : colors.expense },
                ]}
              >
                {formatRupiah(sourceStats.balance)}
              </Text>
            </View>

            {/* Horizontal Wallet Selector Chips for Source */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
              {wallets.map((w) => {
                const isChosen = w.id === sourceWalletId;
                const cardColor = w.color || colors.primary;
                return (
                  <Pressable
                    key={`src-${w.id}`}
                    onPress={() => setSourceWalletId(w.id)}
                    style={({ pressed }) => [
                      styles.walletChip,
                      {
                        backgroundColor: isChosen ? cardColor + '20' : colors.surfaceLight,
                        borderColor: isChosen ? cardColor : colors.border,
                        borderWidth: isChosen ? 2 : 1,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Ionicons
                      name={w.icon || 'wallet-outline'}
                      size={14}
                      color={isChosen ? cardColor : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.walletChipText,
                        { color: isChosen ? colors.text : colors.textSecondary, fontWeight: isChosen ? '800' : '600' },
                      ]}
                      numberOfLines={1}
                    >
                      {w.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* SWAP BUTTON IN THE MIDDLE */}
          <View style={styles.swapDividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Pressable
              onPress={handleSwap}
              style={({ pressed }) => [
                styles.swapCircleBtn,
                { backgroundColor: colors.primary, borderColor: colors.surface },
                pressed && styles.pressed,
              ]}
              accessibilityLabel="Tukar Dompet Asal dan Tujuan"
            >
              <Ionicons name="swap-vertical" size={18} color="#FFFFFF" />
            </Pressable>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* TO WALLET SECTION */}
          <View style={styles.exchangeSection}>
            <View style={styles.exchangeHeaderRow}>
              <View style={styles.labelWithIcon}>
                <Ionicons name="arrow-down-circle" size={16} color={colors.income || '#10B981'} />
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
                  {t('modal.toWallet', 'Ke Dompet (Tujuan)')}
                </Text>
              </View>
              <Text
                style={[
                  styles.currentBalanceText,
                  { color: targetStats.balance >= 0 ? colors.income : colors.expense },
                ]}
              >
                {formatRupiah(targetStats.balance)}
              </Text>
            </View>

            {/* Horizontal Wallet Selector Chips for Target */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
              {wallets.map((w) => {
                const isChosen = w.id === targetWalletId;
                const isSame = w.id === sourceWalletId;
                const cardColor = w.color || colors.primary;
                return (
                  <Pressable
                    key={`dst-${w.id}`}
                    onPress={() => setTargetWalletId(w.id)}
                    style={({ pressed }) => [
                      styles.walletChip,
                      {
                        backgroundColor: isChosen ? cardColor + '20' : colors.surfaceLight,
                        borderColor: isChosen ? cardColor : isSame ? colors.borderLight : colors.border,
                        borderWidth: isChosen ? 2 : 1,
                        opacity: isSame ? 0.4 : 1,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <Ionicons
                      name={w.icon || 'wallet-outline'}
                      size={14}
                      color={isChosen ? cardColor : colors.textSecondary}
                    />
                    <Text
                      style={[
                        styles.walletChipText,
                        { color: isChosen ? colors.text : colors.textSecondary, fontWeight: isChosen ? '800' : '600' },
                      ]}
                      numberOfLines={1}
                    >
                      {w.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>

        {/* Validation Warning if same wallet */}
        {isSameWallet && (
          <View style={[styles.warningBox, { backgroundColor: '#FEF2F2', borderColor: '#EF4444' }]}>
            <Ionicons name="alert-circle" size={16} color="#EF4444" />
            <Text style={[styles.warningText, { color: '#B91C1C' }]}>
              {t('modal.sameWalletError', 'Dompet asal dan tujuan tidak boleh sama.')}
            </Text>
          </View>
        )}

        {/* TRANSFER AMOUNT INPUT */}
        <View style={styles.formSection}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            {t('modal.transferAmount', 'Jumlah Transfer')}
          </Text>
          <View
            style={[
              styles.amountInputContainer,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.currencyPrefix, { color: colors.primary }]}>Rp</Text>
            <TextInput
              value={amountStr ? Number.parseInt(amountStr, 10).toLocaleString('id-ID') : ''}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9]/g, '');
                setAmountStr(cleaned);
              }}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              style={[styles.amountInput, { color: colors.text }]}
            />
            {numAmount > 0 && (
              <Pressable onPress={() => setAmountStr('')} hitSlop={10}>
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            )}
          </View>

          {/* Quick Amount Chips */}
          <View style={styles.quickChipsRow}>
            {QUICK_AMOUNTS.map((item) => (
              <Pressable
                key={item.label}
                onPress={() => handleQuickAddAmount(item.value)}
                style={({ pressed }) => [
                  styles.quickChip,
                  { backgroundColor: colors.surfaceLight, borderColor: colors.border },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.quickChipText, { color: colors.text }]}>{item.label}</Text>
              </Pressable>
            ))}
            {sourceStats.balance > 0 && (
              <Pressable
                onPress={handleUseAllBalance}
                style={({ pressed }) => [
                  styles.quickChip,
                  { backgroundColor: colors.primaryLight, borderColor: colors.primary },
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.quickChipText, { color: colors.primaryDark, fontWeight: '800' }]}>
                  {isIndonesian ? 'Semua Saldo' : 'All Balance'}
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        {/* ADMIN FEE SECTION (OPTIONAL) */}
        <View style={styles.formSection}>
          <Pressable
            onPress={() => setShowAdminFeeInput(!showAdminFeeInput)}
            style={styles.adminFeeToggleRow}
          >
            <View style={styles.adminFeeLabelGroup}>
              <Ionicons name="receipt-outline" size={15} color={colors.textSecondary} />
              <Text style={[styles.inputLabel, { color: colors.text, marginBottom: 0 }]}>
                {t('modal.adminFee', 'Biaya Admin (Opsional)')}
              </Text>
            </View>
            <View style={styles.feeCurrentDisplay}>
              <Text style={[styles.feeValText, { color: numFee > 0 ? colors.expense : colors.textMuted }]}>
                {numFee > 0 ? formatRupiah(numFee) : isIndonesian ? 'Gratis (Rp 0)' : 'Free (Rp 0)'}
              </Text>
              <Ionicons
                name={showAdminFeeInput ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={colors.textSecondary}
              />
            </View>
          </Pressable>

          {showAdminFeeInput && (
            <View style={styles.adminFeeExpandedContent}>
              <View style={styles.feeChipsRow}>
                {ADMIN_FEES.map((fee) => {
                  const isSelectedFee = numFee === fee.value;
                  return (
                    <Pressable
                      key={fee.label}
                      onPress={() => setAdminFeeStr(String(fee.value))}
                      style={({ pressed }) => [
                        styles.feeChip,
                        {
                          backgroundColor: isSelectedFee ? colors.primary + '20' : colors.surfaceLight,
                          borderColor: isSelectedFee ? colors.primary : colors.border,
                        },
                        pressed && styles.pressed,
                      ]}
                    >
                      <Text
                        style={[
                          styles.feeChipText,
                          { color: isSelectedFee ? colors.primaryDark : colors.textSecondary, fontWeight: isSelectedFee ? '800' : '600' },
                        ]}
                      >
                        {fee.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* NOTES / CATATAN */}
        <View style={styles.formSection}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>
            {t('modal.transferNotes', 'Catatan / Keterangan (Opsional)')}
          </Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder={t('modal.transferNotesPlaceholder', 'misal: Top up GoPay, Tarik tunai ATM...')}
            placeholderTextColor={colors.textMuted}
            style={[
              styles.textInput,
              { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
            ]}
          />
        </View>

        {/* REAL-TIME BALANCE IMPACT PREVIEW CARD */}
        {numAmount > 0 && !isSameWallet && (
          <View
            style={[
              styles.previewCard,
              { backgroundColor: isDark ? '#141E28' : '#F0FDF4', borderColor: colors.primary },
            ]}
          >
            <View style={styles.previewHeader}>
              <Ionicons name="sparkles" size={14} color={colors.primary} />
              <Text style={[styles.previewTitle, { color: colors.primaryDark }]}>
                {t('modal.balancePreview', 'SIMULASI DAMPAK SALDO :')}
              </Text>
            </View>

            <View style={styles.previewRow}>
              <View style={styles.previewCol}>
                <Text style={[styles.previewWalletName, { color: colors.textSecondary }]} numberOfLines={1}>
                  {sourceWallet?.name} (Asal)
                </Text>
                <Text style={[styles.previewBalanceVal, { color: projectedSourceBalance >= 0 ? colors.text : colors.expense }]}>
                  {formatRupiah(projectedSourceBalance)}
                </Text>
                <Text style={[styles.previewDiffText, { color: colors.expense }]}>
                  -{formatRupiah(numAmount + numFee)}
                </Text>
              </View>

              <Ionicons name="arrow-forward" size={18} color={colors.primary} style={styles.previewArrow} />

              <View style={styles.previewCol}>
                <Text style={[styles.previewWalletName, { color: colors.textSecondary }]} numberOfLines={1}>
                  {targetWallet?.name} (Tujuan)
                </Text>
                <Text style={[styles.previewBalanceVal, { color: colors.text }]}>
                  {formatRupiah(projectedTargetBalance)}
                </Text>
                <Text style={[styles.previewDiffText, { color: colors.income }]}>
                  +{formatRupiah(numAmount)}
                </Text>
              </View>
            </View>

            {isInsufficient && (
              <View style={styles.insufficientHintRow}>
                <Ionicons name="information-circle-outline" size={13} color="#F59E0B" />
                <Text style={styles.insufficientHintText}>
                  {isIndonesian
                    ? 'Saldo dompet asal lebih kecil dari transfer, saldo akan menjadi minus/hutang.'
                    : 'Transfer exceeds source balance, wallet will enter debt.'}
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </NeoModal>
  );
};

const styles = StyleSheet.create({
  scrollBody: {
    paddingBottom: 16,
    gap: 14,
  },
  walletExchangeCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  exchangeSection: {
    gap: 8,
  },
  exchangeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  currentBalanceText: {
    fontSize: 12,
    fontWeight: '800',
  },
  chipScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  walletChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  walletChipText: {
    fontSize: 12,
  },
  swapDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  swapCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  warningText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  formSection: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    gap: 6,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: '900',
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
  },
  quickChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  quickChip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  adminFeeToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  adminFeeLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  feeCurrentDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  feeValText: {
    fontSize: 11,
    fontWeight: '700',
  },
  adminFeeExpandedContent: {
    marginTop: 4,
  },
  feeChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  feeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  feeChipText: {
    fontSize: 11,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  previewCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 12,
    gap: 8,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewCol: {
    flex: 1,
  },
  previewWalletName: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  previewBalanceVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  previewDiffText: {
    fontSize: 10,
    fontWeight: '700',
  },
  previewArrow: {
    marginHorizontal: 10,
  },
  insufficientHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  insufficientHintText: {
    fontSize: 10,
    color: '#D97706',
    fontWeight: '500',
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  confirmBtnWrapper: {
    flex: 1,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
});

export default TransferModal;
