import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../../theme/typography';
import { NeoCard } from '../neo/NeoCard';
import { CategoryIcon } from '../common/CategoryIcon';
import { ConfirmModal } from '../neo/ConfirmModal';
import { useTheme } from '../../stores/themeStore';
import { useLanguage } from '../../stores/languageStore';
import { formatRupiah, formatTimeIndo } from '../../utils/formatters';

export const TransactionCard = ({ transaction, onEdit, onDelete }) => {
  const { colors } = useTheme();
  const { isIndonesian, t } = useLanguage();
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);

  const isIncome = transaction.type === 'income';

  return (
    <>
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
                {transaction.categoryName || (isIndonesian ? 'Lain-lain' : 'Other')}
              </Text>
              {transaction.walletName ? (
                <>
                  <Text style={[styles.dotSeparator, { color: colors.textSubtle }]}>•</Text>
                  <View
                    style={[
                      styles.walletBadge,
                      { backgroundColor: colors.surfaceLight, borderColor: colors.borderLight },
                    ]}
                  >
                    <Ionicons name="wallet-outline" size={10} color={colors.primary} />
                    <Text style={[styles.walletBadgeText, { color: colors.primary }]}>
                      {transaction.walletName}
                    </Text>
                  </View>
                </>
              ) : null}
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
                  style={({ pressed }) => [
                    styles.actionIconButton,
                    {
                      backgroundColor: colors.surfaceLight,
                      borderColor: colors.border,
                    },
                    pressed && styles.btnPressed,
                  ]}
                  accessibilityLabel="Edit"
                >
                  <Ionicons name="create-outline" size={14} color={colors.textSecondary} />
                </Pressable>
              )}

              {onDelete && (
                <Pressable
                  onPress={() => setDeleteConfirmVisible(true)}
                  style={({ pressed }) => [
                    styles.actionIconButton,
                    {
                      backgroundColor: colors.surfaceLight,
                      borderColor: colors.border,
                    },
                    pressed && styles.btnPressed,
                  ]}
                  accessibilityLabel="Hapus"
                >
                  <Ionicons name="trash-outline" size={14} color={colors.expense} />
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </NeoCard>

      {/* Modern Custom Delete Confirmation Dialog */}
      <ConfirmModal
        visible={deleteConfirmVisible}
        onClose={() => setDeleteConfirmVisible(false)}
        onConfirm={() => {
          setDeleteConfirmVisible(false);
          onDelete(transaction.id);
        }}
        title={isIndonesian ? 'Hapus Transaksi' : 'Delete Transaction'}
        message={
          isIndonesian
            ? `Yakin ingin menghapus catatan "${transaction.name}" (${formatRupiah(transaction.amount)})?`
            : `Are you sure you want to delete "${transaction.name}" (${formatRupiah(transaction.amount)})?`
        }
        type="danger"
        confirmText={t('modal.delete', 'Hapus')}
        cancelText={t('modal.cancel', 'Batal')}
      />
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 3,
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
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryNameText: {
    fontSize: 11,
    fontWeight: '600',
  },
  dotSeparator: {
    fontSize: 10,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: TYPOGRAPHY.size.sm,
    fontWeight: '900',
    marginBottom: 4,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIconButton: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  walletBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  btnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.92 }],
  },
});

export default TransactionCard;
