import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
  Keyboard,
  LayoutAnimation,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../../theme/typography';
import { useTheme } from '../../stores/themeStore';

/**
 * Unified Shared Modal Component for all DalAy feature modals
 */
export const NeoModal = ({
  visible,
  onClose,
  title,
  subtitle,
  children,
  headerRight,
  footer,
  maxHeight = '88%',
  width = '92%',
}) => {
  const { colors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const isTablet = windowWidth >= 768;

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setKeyboardVisible(true);
      }
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setKeyboardVisible(false);
      }
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[
          styles.backdrop,
          keyboardVisible && {
            justifyContent: 'flex-start',
            paddingTop: Platform.OS === 'android' ? 40 : 54,
          },
        ]}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <Pressable style={styles.outsideOverlay} onPress={onClose} />

        <View
          style={[
            styles.modalBox,
            {
              width: isTablet ? '70%' : width,
              maxWidth: 520,
              maxHeight,
              backgroundColor: colors.surface,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Standardized Header */}
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
              <Text
                style={[styles.title, { color: colors.text }]}
                numberOfLines={1}
              >
                {title}
              </Text>
              {subtitle ? (
                <Text
                  style={[styles.subtitle, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {subtitle}
                </Text>
              ) : null}
            </View>

            <View style={styles.headerActions}>
              {headerRight}
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.closeBtn,
                  {
                    backgroundColor: colors.surfaceLight,
                    borderColor: colors.border,
                  },
                  pressed && styles.closeBtnPressed,
                ]}
                accessibilityLabel="Tutup"
              >
                <Ionicons name="close" size={18} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>

          {/* Scrollable Modal Body */}
          <ScrollView
            style={styles.body}
            contentContainerStyle={[
              styles.bodyContent,
              keyboardVisible && { paddingBottom: 160 },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={true}
          >
            {children}
          </ScrollView>

          {/* Standardized Footer */}
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
    backgroundColor: 'rgba(5, 15, 25, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(8px)',
      },
    }),
  },
  outsideOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  modalBox: {
    borderWidth: 1.5,
    borderRadius: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
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
    marginRight: 8,
  },
  title: {
    fontSize: TYPOGRAPHY.size.md,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  closeBtnPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.92 }],
  },
  body: {
    flexGrow: 0,
  },
  bodyContent: {
    padding: 16,
    paddingBottom: 32,
  },
  footer: {
    padding: 14,
    borderTopWidth: 1,
  },
});

export default NeoModal;
