import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NeoCard } from '../neo/NeoCard';
import { NeoButton } from '../neo/NeoButton';
import { ConfirmModal } from '../neo/ConfirmModal';
import { useTheme } from '../../stores/themeStore';
import { useLanguage } from '../../stores/languageStore';
import { useAi } from '../../stores/aiStore';

export const GeminiAiCard = ({ onToast }) => {
  const { colors } = useTheme();
  const { t, isIndonesian } = useLanguage();
  const {
    geminiApiKey,
    isValidated,
    isValidating,
    hasApiKey,
    removeGeminiApiKey,
    testAndSaveApiKey,
  } = useAi();

  const [inputKey, setInputKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(null);

  useEffect(() => {
    setInputKey(geminiApiKey || '');
  }, [geminiApiKey]);

  const handleValidateAndSave = async () => {
    if (!inputKey.trim()) {
      if (typeof onToast === 'function') {
        onToast(
          isIndonesian ? 'API Key tidak boleh kosong' : 'API Key cannot be empty',
          'warning-outline'
        );
      }
      return;
    }

    const res = await testAndSaveApiKey(inputKey.trim());
    if (res.success) {
      if (typeof onToast === 'function') {
        onToast(
          isIndonesian ? 'API Key valid & disimpan!' : 'API Key validated & saved!',
          'checkmark-circle'
        );
      }
    } else {
      if (typeof onToast === 'function') {
        onToast(res.message || (isIndonesian ? 'API Key tidak valid' : 'Invalid API Key'), 'alert-circle');
      }
    }
  };

  const handleRemoveKey = () => {
    setConfirmDialog({
      title: isIndonesian ? 'Hapus API Key?' : 'Remove API Key?',
      message: isIndonesian
        ? 'Fitur AI Scan Struk memerlukan API Key Gemini untuk aktif kembali.'
        : 'AI Receipt Scanner requires a Gemini API Key to work.',
      type: 'danger',
      confirmText: isIndonesian ? 'Hapus' : 'Remove',
      onConfirm: async () => {
        await removeGeminiApiKey();
        setInputKey('');
        setConfirmDialog(null);
        if (typeof onToast === 'function') {
          onToast(
            isIndonesian ? 'API Key berhasil dihapus' : 'API Key removed',
            'trash-outline'
          );
        }
      },
    });
  };

  const handleOpenStudioLink = () => {
    Linking.openURL('https://aistudio.google.com/app/apikey');
  };

  return (
    <>
      <NeoCard variant="white" padding={12} style={styles.card}>
        {/* Minimalist Header */}
        <View style={styles.headerRow}>
          <View style={styles.titleRow}>
            <Ionicons name="sparkles" size={16} color={colors.accent || '#8B5CF6'} />
            <Text style={[styles.title, { color: colors.text }]}>
              Google Gemini AI
            </Text>
          </View>

          {/* Simple Status Indicator */}
          {hasApiKey && isValidated ? (
            <View style={[styles.statusDot, { backgroundColor: '#22C55E' }]} />
          ) : hasApiKey ? (
            <View style={[styles.statusDot, { backgroundColor: '#F59E0B' }]} />
          ) : (
            <View style={[styles.statusDot, { backgroundColor: colors.border }]} />
          )}
        </View>

        {/* Minimalist Input Field */}
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: colors.backgroundSecondary || colors.surfaceLight || '#F8FAFC',
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons name="key-outline" size={16} color={colors.textSecondary} style={styles.keyIcon} />
          <TextInput
            style={[styles.textInput, { color: colors.text }]}
            value={inputKey}
            onChangeText={setInputKey}
            placeholder={t('settings.apiKeyPlaceholder', 'Tempel API key AIzaSy...')}
            placeholderTextColor={colors.textMuted || '#94A3B8'}
            secureTextEntry={!showKey}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {inputKey.length > 0 && (
            <Pressable
              onPress={() => setShowKey(!showKey)}
              style={styles.eyeBtn}
              hitSlop={8}
            >
              <Ionicons
                name={showKey ? 'eye-off-outline' : 'eye-outline'}
                size={16}
                color={colors.textSecondary}
              />
            </Pressable>
          )}
        </View>

        {/* Action Row */}
        <View style={styles.actionRow}>
          <Pressable
            onPress={handleOpenStudioLink}
            style={({ pressed }) => [styles.linkBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={[styles.linkText, { color: colors.accent || '#8B5CF6' }]}>
              {isIndonesian ? 'Dapatkan Key Gratis ↗' : 'Get Free Key ↗'}
            </Text>
          </Pressable>

          <View style={styles.buttonGroup}>
            {hasApiKey && (
              <NeoButton
                title={isIndonesian ? 'Hapus' : 'Remove'}
                variant="ghost"
                size="sm"
                onPress={handleRemoveKey}
              />
            )}
            <NeoButton
              title={isValidating ? '...' : (isIndonesian ? 'Simpan' : 'Save')}
              iconName="checkmark-circle-outline"
              variant="primary"
              size="sm"
              loading={isValidating}
              onPress={handleValidateAndSave}
            />
          </View>
        </View>
      </NeoCard>

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <ConfirmModal
          visible={Boolean(confirmDialog)}
          title={confirmDialog.title}
          message={confirmDialog.message}
          type={confirmDialog.type || 'danger'}
          confirmText={confirmDialog.confirmText || 'OK'}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 10,
    height: 42,
    marginBottom: 10,
  },
  keyIcon: {
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '600',
    height: '100%',
  },
  eyeBtn: {
    padding: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  linkBtn: {
    paddingVertical: 4,
  },
  linkText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  buttonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
