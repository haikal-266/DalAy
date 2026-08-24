import React from 'react';
import { View, Text, StyleSheet, Alert, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../../theme/typography';
import { NeoCard } from '../neo/NeoCard';
import { CategoryIcon } from '../common/CategoryIcon';
import { useTheme } from '../../stores/themeStore';
import { formatRupiah, formatTimeIndo } from '../../utils/formatters';

export const TransactionCard = ({ transaction, onEdit, onDelete }) => {
  const { colors } = useTheme();
  const isIncome = transaction.type === 'income';

  const handleDeletePrompt = () => {
    Alert.alert(
      'Hapus Transaksi',
      `Yakin ingin menghapus catatan "${transaction.name}" (${formatRupiah(transaction.amount)})?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => onDelete(transaction.id),
        },
      ]
    );
  };

  return (
    <NeoCard
      variant="white"
      padding={12}
      style={styles.card}
    >
      <View style={styles.row}>
        {/* Category Icon Badge */}
        <CategoryIcon
          iconName={transaction.iconName || (isIncome ? 'wallet' : 'cube')}
          iconFamily={transaction.iconFamily || 'Ionicons'}
          color={transaction.categoryColor || (isIncome ? colors.incomeDark : colors.expenseDark)}
          bgColor={transaction.categoryBgColor || (isIncome ? colors.incomeLight : colors.expenseLight)}
          size={18}
          containerSize={42}
          borderRadius={12}
          style={styles.iconBadge}
        />

        {/* Info */}
        <View style={styles.infoCol}>
          <Text style={[styles.titleText, { color: colors.text }]} numberOfLines={1}>
            {transaction.name}
          </Text>

          <View style={styles.metaRow}>
            <Text style={[styles.categoryNameText, { color: colors.textSecondary }]}>
              {transaction.categoryName || 'Lain-lain'}
            </Text>
            <Text style={[styles.dotSeparator, { color: colors.textSubtle }]}>•</Text>
            <Text style={[styles.timeText, { color: colors.textMuted }]}>
              {formatTimeIndo(transaction.date)}
            </Text>
          </View>
        </View>

        {/* Amount & Actions */}
        <View style={styles.amountCol}>
          <Text
            style={[
              styles.amountText,
              { color: isIncome ? colors.incomeDark : colors.expenseDark },
            ]}
          >
            {isIncome ? '+' : '-'}
            {formatRupiah(transaction.amount)}
          </Text>

          <View style={styles.btnRow}>
            {onEdit && (
              <Pressable
                onPress={() => onEdit(transaction)}
                style={[
                  styles.actionIconButton,
                  {
                    backgroundColor: colors.surfaceLight,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons name="create-outline" size={14} color={colors.textSecondary} />
              </Pressable>
            )}
            <Pressable
              onPress={handleDeletePrompt}
              style={[
                styles.actionIconButton,
                {
                  backgroundColor: colors.expenseLight,
                  borderColor: colors.expenseBorder,
                },
              ]}
            >
              <Ionicons name="trash-outline" size={13} color={colors.expense} />
            </Pressable>
          </View>
        </View>
      </View>
    </NeoCard>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    marginRight: 10,
  },
  infoCol: {
    flex: 1,
    marginRight: 8,
  },
  titleText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  categoryNameText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dotSeparator: {
    marginHorizontal: 4,
    fontSize: 10,
  },
  timeText: {
    fontSize: 11,
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '900',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  actionIconButton: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TransactionCard;
