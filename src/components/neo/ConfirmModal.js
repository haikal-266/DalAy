import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../../theme/typography';
import { useTheme } from '../../stores/themeStore';
import { useLanguage } from '../../stores/languageStore';
import { NeoButton } from './NeoButton';

export const ConfirmModal = ({
  visible = false,
  onClose,
  onConfirm,
  title = 'Konfirmasi',
  message = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
  confirmText,
  cancelText,
  type = 'danger', // 'danger' | 'warning' | 'info' | 'success'
  iconName,
  loading = false,
}) => {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const { width } = useWindowDimensions();

  const resolvedConfirmText = confirmText || (type === 'danger' ? t('modal.delete', 'Hapus') : t('modal.confirm', 'Konfirmasi'));
  const resolvedCancelText = cancelText || t('modal.cancel', 'Batal');

  // Type configuration
  const config = {
    danger: {
      color: colors.expense,
      bgColor: colors.expenseLight,
      borderColor: colors.expenseBorder,
      icon: iconName || 'trash-outline',
      btnVariant: 'expense',
    },
    warning: {
      color: colors.brandGold || '#D97706',
      bgColor: colors.brandGoldLight || '#FEF3C7',
      borderColor: colors.brandGold || '#FDE68A',
      icon: iconName || 'alert-circle-outline',
      btnVariant: 'accent',
    },
    info: {
      color: colors.primary,
      bgColor: colors.primaryLight,
      borderColor: colors.primary,
      icon: iconName || 'information-circle-outline',
      btnVariant: 'primary',
    },
    success: {
      color: colors.incomeDark || '#16A34A',
      bgColor: colors.incomeLight,
      borderColor: colors.incomeBorder,
      icon: iconName || 'checkmark-circle-outline',
      btnVariant: 'income',
    },
  }[type] || {
    color: colors.expense,
    bgColor: colors.expenseLight,
    borderColor: colors.expenseBorder,
    icon: 'alert-circle-outline',
    btnVariant: 'expense',
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTouch} onPress={onClose} />

        <View
          style={[
            styles.dialogContainer,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              maxWidth: Math.min(width - 36, 420),
            },
          ]}
        >
          {/* Top Decorative Icon Emblem */}
          <View
            style={[
              styles.iconEmblem,
              {
                backgroundColor: config.bgColor,
                borderColor: config.borderColor,
              },
            ]}
          >
            <Ionicons name={config.icon} size={30} color={config.color} />
          </View>

          {/* Title & Description */}
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.message, { color: colors.textSecondary }]}>
            {message}
          </Text>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <View style={styles.buttonWrapper}>
              <NeoButton
                title={resolvedCancelText}
                variant="secondary"
                size="md"
                onPress={onClose}
                disabled={loading}
                fullWidth
              />
            </View>
            <View style={styles.buttonWrapper}>
              <NeoButton
                title={resolvedConfirmText}
                variant={config.btnVariant}
                size="md"
                loading={loading}
                onPress={onConfirm}
                fullWidth
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 15, 25, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(8px)',
      },
    }),
  },
  backdropTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  dialogContainer: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 22,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 20,
  },
  iconEmblem: {
    width: 64,
    height: 64,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  message: {
    fontSize: TYPOGRAPHY.size.xs,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  buttonWrapper: {
    flex: 1,
  },
});

export default ConfirmModal;
