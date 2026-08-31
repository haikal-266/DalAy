import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NeoCard } from '../neo/NeoCard';
import { NeoInput } from '../neo/NeoInput';
import { NeoButton } from '../neo/NeoButton';
import { NeoSegmented } from '../neo/NeoSegmented';
import { NeoTag } from '../neo/NeoTag';
import { ConfirmModal } from '../neo/ConfirmModal';
import { QuickWalletSelectModal } from './QuickWalletSelectModal';
import { useTheme } from '../../stores/themeStore';
import { useLanguage } from '../../stores/languageStore';
import { parseFinancialInput } from '../../utils/parser';
import { formatRupiah } from '../../utils/formatters';

export const QuickInputBar = ({
  onAdd,
  onOpenManual,
  onOpenReceipt,
  onFocus,
  onFocusInput,
  selectedDate = new Date(),
}) => {
  const { colors } = useTheme();
  const { t, isIndonesian } = useLanguage();
  const [type, setType] = useState('expense'); // 'expense' | 'income'
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState(null); // { title, message, type }

  const handleInputFocus = (e) => {
    if (typeof onFocus === 'function') onFocus(e);
    if (typeof onFocusInput === 'function') onFocusInput(e);
  };

  // Live parsed items as user types
  const parsedPreview = useMemo(() => {
    if (!inputText.trim()) return [];
    return parseFinancialInput(inputText, type);
  }, [inputText, type]);

  const totalPreviewAmount = useMemo(() => {
    return parsedPreview.reduce((sum, item) => sum + item.amount, 0);
  }, [parsedPreview]);

  const handleSubmit = () => {
    if (!inputText.trim() || parsedPreview.length === 0) {
      setAlertConfig({
        title: isIndonesian ? 'Format Belum Tepat' : 'Invalid Input Format',
        message: isIndonesian
          ? 'Contoh penulisan cepat:\n• "makan siang 25k, bensin 15rb, kopi 12k"\n• "gaji 5jt, freelance web 1.5jt"'
          : 'Quick logging example:\n• "lunch 25k, gas 15k, coffee 12k"\n• "salary 5000k, freelance 1500k"',
        type: 'warning',
      });
      return;
    }

    // Open small popup modal to choose wallet
    setWalletModalVisible(true);
  };

  const handleConfirmWallet = async (wallet) => {
    setWalletModalVisible(false);
    setLoading(true);
    const result = await onAdd(
      inputText,
      type,
      selectedDate,
      wallet?.id,
      wallet?.name
    );
    setLoading(false);

    if (result?.success) {
      setInputText('');
    } else if (result && !result.success) {
      setAlertConfig({
        title: isIndonesian ? 'Gagal Mencatat' : 'Failed to Record',
        message:
          result.message ||
          (isIndonesian
            ? 'Terjadi kesalahan saat menyimpan transaksi.'
            : 'An error occurred while saving transaction.'),
        type: 'danger',
      });
    }
  };

  return (
    <NeoCard variant="white" padding={14} style={styles.container}>
      {/* Header Title Row */}
      <View style={styles.titleRow}>
        <View style={styles.titleLeft}>
          <Ionicons name="sparkles" size={15} color={colors.primary} />
          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {t('finance.quickInputTitle', 'CATAT CEPAT (NATURAL INPUT)')}
          </Text>
        </View>
      </View>

      {/* Full-width Type Selector to prevent clipping */}
      <View style={styles.segmentedWrapper}>
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
          onSelect={setType}
        />
      </View>

      {/* Input Field */}
      <NeoInput
        placeholder={
          type === 'expense'
            ? t('finance.quickInputPlaceholderExpense', 'Ketik: "makan 25k, bensin 15rb, kopi 12k"...')
            : t('finance.quickInputPlaceholderIncome', 'Ketik: "gaji 5jt, freelance web 1.5jt"...')
        }
        value={inputText}
        onChangeText={setInputText}
        onFocus={handleInputFocus}
        multiline
        numberOfLines={2}
        style={styles.inputWrapper}
      />

      {/* Real-time Parser Chips Preview */}
      {parsedPreview.length > 0 && (
        <View
          style={[
            styles.previewContainer,
            {
              backgroundColor: colors.surfaceLight,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.previewHeader}>
            <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
              {t('finance.detectedTransactions', 'Terbaca transaksi:')}
            </Text>
            <Text style={[styles.previewTotal, { color: colors.text }]}>
              {t('finance.totalLabel', 'TOTAL')}: {formatRupiah(totalPreviewAmount)}
            </Text>
          </View>
          <View style={styles.chipsRow}>
            {parsedPreview.map((item, idx) => (
              <NeoTag
                key={`${item.name}-${idx}`}
                label={`${item.categoryEmoji || '🏷️'} ${item.name}: ${formatRupiah(
                  item.amount
                )}`}
                color={type === 'expense' ? colors.expense : colors.income}
                bgColor={
                  type === 'expense' ? colors.expenseLight : colors.incomeLight
                }
                textColor={
                  type === 'expense' ? colors.expenseDark : colors.incomeDark
                }
                size="sm"
              />
            ))}
          </View>
        </View>
      )}

      {/* Action Buttons: Save Note on left, Scan + Manual stacked on right */}
      <View style={styles.actionGrid}>
        <View style={styles.leftCol}>
          <NeoButton
            title={
              parsedPreview.length > 1
                ? `${t('finance.saveTransactions', 'Simpan')} (${parsedPreview.length})`
                : t('finance.saveRecord', 'Simpan Catatan')
            }
            iconName="checkmark-circle"
            variant={type === 'expense' ? 'expense' : 'income'}
            size="sm"
            loading={loading}
            disabled={!inputText.trim() || parsedPreview.length === 0}
            onPress={handleSubmit}
            style={styles.saveNoteBtn}
          />
        </View>
        <View style={styles.rightCol}>
          {typeof onOpenReceipt === 'function' && (
            <NeoButton
              title={t('finance.scanReceiptBtn', 'Scan Struk')}
              iconName="receipt-outline"
              variant="secondary"
              size="sm"
              onPress={onOpenReceipt}
              style={styles.rightBtn}
            />
          )}
          <NeoButton
            title={t('finance.manualBtn', 'Manual')}
            iconName="create-outline"
            variant="secondary"
            size="sm"
            onPress={onOpenManual}
            style={styles.rightBtn}
          />
        </View>
      </View>

      {/* Small Popup Modal to Choose Destination Wallet */}
      <QuickWalletSelectModal
        visible={walletModalVisible}
        onClose={() => setWalletModalVisible(false)}
        onConfirm={handleConfirmWallet}
        type={type}
        parsedItems={parsedPreview}
        totalAmount={totalPreviewAmount}
      />

      {/* Modern Alert / Confirmation Dialog */}
      {alertConfig && (
        <ConfirmModal
          visible={Boolean(alertConfig)}
          onClose={() => setAlertConfig(null)}
          onConfirm={() => setAlertConfig(null)}
          title={alertConfig.title}
          message={alertConfig.message}
          type={alertConfig.type}
          confirmText={isIndonesian ? 'Tutup' : 'Close'}
          cancelText={isIndonesian ? 'Tutup' : 'Close'}
        />
      )}
    </NeoCard>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  titleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  title: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  segmentedWrapper: {
    marginBottom: 12,
  },
  inputWrapper: {
    marginBottom: 10,
  },
  previewContainer: {
    marginBottom: 12,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  previewTotal: {
    fontSize: 11,
    fontWeight: '800',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  actionGrid: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 8,
    marginTop: 4,
  },
  leftCol: {
    flex: 1,
  },
  saveNoteBtn: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
  },
  rightCol: {
    flex: 1,
    flexDirection: 'column',
    gap: 6,
  },
  rightBtn: {
    flex: 1,
  },
});

export default QuickInputBar;
