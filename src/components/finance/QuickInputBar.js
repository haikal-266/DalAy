import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../../theme/typography';
import { NeoCard } from '../neo/NeoCard';
import { NeoInput } from '../neo/NeoInput';
import { NeoButton } from '../neo/NeoButton';
import { NeoSegmented } from '../neo/NeoSegmented';
import { NeoTag } from '../neo/NeoTag';
import { useTheme } from '../../stores/themeStore';
import { parseFinancialInput } from '../../utils/parser';
import { formatRupiah } from '../../utils/formatters';

export const QuickInputBar = ({
  onAddFromNLP,
  onOpenManualModal,
  onFocusInput,
  selectedDate = new Date(),
}) => {
  const { colors } = useTheme();
  const [type, setType] = useState('expense'); // 'expense' | 'income'
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  // Live parsed items as user types
  const parsedPreview = useMemo(() => {
    if (!inputText.trim()) return [];
    return parseFinancialInput(inputText, type);
  }, [inputText, type]);

  const totalPreviewAmount = useMemo(() => {
    return parsedPreview.reduce((sum, item) => sum + item.amount, 0);
  }, [parsedPreview]);

  const handleSubmit = async () => {
    if (!inputText.trim() || parsedPreview.length === 0) {
      Alert.alert(
        'Format Belum Tepat',
        'Contoh input: "makan siang 25k, bensin 15k" atau "gaji 5jt"'
      );
      return;
    }

    setLoading(true);
    const result = await onAddFromNLP(inputText, type, selectedDate);
    setLoading(false);

    if (result.success) {
      setInputText('');
    } else {
      Alert.alert('Gagal Mencatat', result.message || 'Terjadi kesalahan.');
    }
  };

  return (
    <NeoCard variant="white" padding={16} style={styles.container}>
      {/* Header & Mode Switch */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Ionicons name="sparkles" size={16} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>
            CATAT CEPAT (NATURAL INPUT)
          </Text>
        </View>
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
          onSelect={setType}
          style={styles.segmented}
        />
      </View>

      {/* Input Field */}
      <NeoInput
        placeholder={
          type === 'expense'
            ? 'Ketik: "makan 25k, bensin 15rb, kopi 12k"...'
            : 'Ketik: "gaji 5jt, freelance web 1.5jt"...'
        }
        value={inputText}
        onChangeText={setInputText}
        onFocus={onFocusInput}
        multiline
        numberOfLines={2}
        style={styles.inputWrapper}
      />

      {/* Live Parsing Preview */}
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
            <View style={styles.previewTitleRow}>
              <Ionicons name="checkmark-circle" size={14} color={colors.incomeDark} />
              <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>
                Terbaca {parsedPreview.length} transaksi:
              </Text>
            </View>
            <Text style={[styles.previewTotal, { color: colors.text }]}>
              {formatRupiah(totalPreviewAmount)}
            </Text>
          </View>

          <View style={styles.previewBadges}>
            {parsedPreview.map((item, idx) => (
              <View key={`${item.name}_${item.amount}_${idx}`} style={styles.previewItem}>
                <NeoTag
                  iconName={item.iconName || 'cube'}
                  label={`${item.name}: ${formatRupiah(item.amount)}`}
                  color={item.categoryColor}
                  bgColor={item.categoryBgColor || colors.surfaceLight}
                  textColor={colors.text}
                  size="sm"
                />
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionRow}>
        <NeoButton
          title={
            parsedPreview.length > 0
              ? `Simpan ${parsedPreview.length} Transaksi`
              : 'Simpan Catatan'
          }
          iconName="checkmark-circle-outline"
          variant="primary"
          size="md"
          loading={loading}
          onPress={handleSubmit}
          style={styles.submitBtn}
        />

        <NeoButton
          title="Manual"
          iconName="add-circle-outline"
          variant="secondary"
          size="md"
          onPress={onOpenManualModal}
          style={styles.manualBtn}
        />
      </View>
    </NeoCard>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  header: {
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  title: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  segmented: {
    marginBottom: 2,
  },
  inputWrapper: {
    marginVertical: 4,
  },
  previewContainer: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 6,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  previewTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  previewTotal: {
    fontSize: 12,
    fontWeight: '900',
  },
  previewBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  previewItem: {
    marginRight: 4,
    marginBottom: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  submitBtn: {
    flex: 2.2,
  },
  manualBtn: {
    flex: 1.1,
  },
});

export default QuickInputBar;
