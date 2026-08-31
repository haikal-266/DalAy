import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
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
  onCancel,
  onConfirm,
  title = 'Konfirmasi',
  message = 'Apakah Anda yakin ingin melanjutkan tindakan ini?',
  confirmText,
  cancelText,
  type = 'danger', // 'danger' | 'warning' | 'info' | 'success'
  iconName,
  loading = false,
  showCancel = true,
  insideModal = false,
}) => {
  const { colors } = useTheme();
  const { t, isIndonesian } = useLanguage();
  const { width } = useWindowDimensions();

  const handleClose = onClose || onCancel || onConfirm || (() => { });
  const handleConfirm = onConfirm || handleClose;
  const isSingleButton = !showCancel || !onConfirm || onConfirm === onClose || onConfirm === onCancel;

  const resolvedConfirmText =
    confirmText ||
    (isSingleButton
      ? (isIndonesian ? 'Tutup' : 'Close')
      : (type === 'danger' ? t('modal.delete', 'Hapus') : t('modal.confirm', 'Konfirmasi')));
  const resolvedCancelText = cancelText || t('modal.cancel', 'Batal');

  // Type configuration
  const config = {
    danger: {
      color: colors.expense,
      bgColor: colors.expenseLight,
      borderColor: colors.expenseBorder,
      icon: iconName || 'alert-circle-outline',
      btnVariant: 'expense',
    },
    warning: {
      color: colors.brandGold || '#D97706',
      bgColor: colors.brandGoldLight || '#FEF3C7',
      borderColor: colors.brandGold || '#FDE68A',
      icon: iconName || 'warning-outline',
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

  if (!visible) return null;

  const content = (
    <View style={[styles.backdrop, insideModal && styles.insideModalBackdrop]}>
      <Pressable style={styles.backdropTouch} onPress={handleClose} />

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
          {!isSingleButton && (
            <View style={styles.buttonWrapper}>
              <NeoButton
                title={resolvedCancelText}
                variant="secondary"
                size="md"
                onPress={handleClose}
                disabled={loading}
                fullWidth
              />
            </View>
          )}
          <View style={styles.buttonWrapper}>
            <NeoButton
              title={resolvedConfirmText}
              variant={config.btnVariant}
              size="md"
              loading={loading}
              onPress={handleConfirm}
              fullWidth
            />
          </View>
        </View>
      </View>
    </View>
  );

  if (insideModal) {
    return content;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      {content}
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
  },
  insideModalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.35)',
    zIndex: 99999,
    elevation: 99999,
    padding: 12,
    borderRadius: 20,
  },
  backdropTouch: {
    ...StyleSheet.absoluteFillObject,
  },
  dialogContainer: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  iconEmblem: {
    width: 56,
    height: 56,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  message: {
    fontSize: TYPOGRAPHY.size.xs,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
    paddingHorizontal: 6,
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
