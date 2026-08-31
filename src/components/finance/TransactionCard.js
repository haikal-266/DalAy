import React, { memo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CategoryIcon } from '../common/CategoryIcon';
import { useTheme } from '../../stores/themeStore';
import { useLanguage } from '../../stores/languageStore';
import { formatRupiah, formatTimeIndo } from '../../utils/formatters';

const TransactionCardComponent = ({
  transaction,
  onEdit,
  onDelete,
}) => {
  const { colors } = useTheme();
  const { isIndonesian } = useLanguage();

  const isAdjustment = transaction.type === 'adjustment' || transaction.categoryId === 'cat_adjustment';
  const isIncrease = transaction.isIncrease ?? (transaction.adjustmentDiff !== undefined ? transaction.adjustmentDiff > 0 : transaction.type === 'income');
  const isIncome = transaction.type === 'income' && !isAdjustment;

  let fallbackIcon = 'cube';
  let fallbackColor = colors.expenseDark;
  let fallbackBgColor = colors.expenseLight;

  if (isAdjustment) {
    fallbackIcon = 'swap-horizontal';
    fallbackColor = colors.accent || '#3B82F6';
    fallbackBgColor = colors.accentLight || '#DBEAFE';
  } else if (isIncome) {
    fallbackIcon = 'wallet';
    fallbackColor = colors.incomeDark;
    fallbackBgColor = colors.incomeLight;
  }

  const isPositive = isAdjustment ? isIncrease : isIncome;
  const amountColor = isPositive ? (colors.income || '#10B981') : (colors.expense || '#EF4444');

  return (
    <Pressable
      onPress={() => onEdit && !isAdjustment && onEdit(transaction)}
      style={({ pressed }) => [
        styles.cardContainer,
        {
          backgroundColor: colors.surfaceLight,
          borderColor: colors.border,
        },
        pressed && styles.cardPressed,
      ]}
    >
      {/* Top Row: Icon + Title + Amount */}
      <View style={styles.topRow}>
        <CategoryIcon
          iconName={transaction.iconName || fallbackIcon}
          iconFamily={transaction.iconFamily || 'Ionicons'}
          color={transaction.categoryColor || fallbackColor}
          bgColor={transaction.categoryBgColor || fallbackBgColor}
          size={17}
          containerSize={36}
          borderRadius={10}
          style={styles.iconBadge}
        />

        <View style={styles.titleCol}>
          <Text
            style={[styles.titleText, { color: colors.text }]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {transaction.name}
          </Text>
        </View>

        <Text
          style={[
            styles.amountText,
            { color: amountColor },
          ]}
          numberOfLines={1}
        >
          {isPositive ? '+' : '-'}
          {formatRupiah(Math.abs(transaction.amount || 0))}
        </Text>
      </View>

      {/* Subtle Divider */}
      <View style={[styles.innerDivider, { backgroundColor: colors.borderLight || '#F1F5F9' }]} />

      {/* Bottom Row: Protected Left Column (Pills) & Protected Right Column (Time & Action) */}
      <View style={styles.bottomRow}>
        {/* Left Tags with strict truncation to prevent any horizontal overflow */}
        <View style={styles.leftTagsRow}>
          {/* Category Pill */}
          <View
            style={[
              styles.pillBadge,
              { backgroundColor: colors.surface, borderColor: colors.borderLight },
            ]}
          >
            <Text
              style={[styles.pillText, { color: colors.textSecondary }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {transaction.categoryName || (isIndonesian ? 'Lain-lain' : 'Other')}
            </Text>
          </View>

          {/* Wallet Pill */}
          {transaction.walletName ? (
            <View
              style={[
                styles.pillBadge,
                { backgroundColor: colors.surface, borderColor: colors.borderLight },
              ]}
            >
              <Ionicons name="wallet-outline" size={10} color={colors.primary} />
              <Text
                style={[styles.pillText, { color: colors.primary, fontWeight: '700' }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {transaction.walletName}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Right Info: Fixed width / non-shrinking Time and Delete Button */}
        <View style={styles.rightInfoRow}>
          <View style={styles.timeTag}>
            <Ionicons name="time-outline" size={11} color={colors.textMuted} />
            <Text style={[styles.timeText, { color: colors.textMuted }]} numberOfLines={1}>
              {formatTimeIndo(transaction.date)}
            </Text>
          </View>

          {onDelete && (
            <Pressable
              onPress={() => onDelete(transaction)}
              hitSlop={8}
              style={({ pressed }) => [
                styles.deleteBtn,
                pressed && styles.btnPressed,
              ]}
              accessibilityLabel="Hapus"
            >
              <Ionicons name="trash-outline" size={13} color={colors.expense || '#EF4444'} />
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
};

export const TransactionCard = memo(TransactionCardComponent);

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 13,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginVertical: 4,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    marginRight: 10,
  },
  titleCol: {
    flex: 1,
    flexShrink: 1,
    marginRight: 8,
  },
  titleText: {
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 0.1,
  },
  amountText: {
    fontSize: 14,
    fontWeight: '900',
    flexShrink: 0,
  },
  innerDivider: {
    height: 1,
    marginVertical: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  leftTagsRow: {
    flex: 1,
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginRight: 8,
    overflow: 'hidden',
  },
  pillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    maxWidth: '48%',
    flexShrink: 1,
  },
  pillText: {
    fontSize: 10,
    fontWeight: '600',
    flexShrink: 1,
  },
  rightInfoRow: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeTag: {
    flexShrink: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  timeText: {
    fontSize: 10.5,
    fontWeight: '600',
    flexShrink: 0,
  },
  deleteBtn: {
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  btnPressed: {
    opacity: 0.5,
  },
});

export default TransactionCard;
