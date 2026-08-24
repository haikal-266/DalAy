import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../../theme/typography';
import { useTheme } from '../../stores/themeStore';

export const NeoModal = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
  headerRight,
  footer,
  maxHeight = '85%',
  width = '92%',
}) => {
  const { colors, isDark } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <Pressable style={styles.outsideOverlay} onPress={onClose} />

        <View
          style={[
            styles.modalBox,
            {
              width,
              maxHeight,
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.header,
              {
                backgroundColor: colors.surface,
                borderBottomColor: colors.borderLight,
              },
            ]}
          >
            <View style={styles.headerTitles}>
              <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
              {subtitle && (
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {subtitle}
                </Text>
              )}
            </View>
            <View style={styles.headerActions}>
              {headerRight}
              <Pressable
                onPress={onClose}
                style={[styles.closeBtn, { backgroundColor: colors.surfaceLight }]}
              >
                <Ionicons name="close" size={20} color={colors.textMuted} />
              </Pressable>
            </View>
          </View>

          {/* Content */}
          <ScrollView
            style={styles.body}
            contentContainerStyle={styles.bodyContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>

          {/* Footer if provided */}
          {footer && (
            <View
              style={[
                styles.footer,
                {
                  backgroundColor: colors.surface,
                  borderTopColor: colors.borderLight,
                },
              ]}
            >
              {footer}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  outsideOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  modalBox: {
    borderWidth: 1,
    borderRadius: 20,
    maxWidth: 520,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitles: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.size.xs,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  body: {
    flexGrow: 0,
  },
  bodyContent: {
    padding: 16,
  },
  footer: {
    padding: 14,
    borderTopWidth: 1,
  },
});

export default NeoModal;
