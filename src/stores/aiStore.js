import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { validateGeminiKey } from '../services/receiptScanner';
import { getFriendlyErrorMessage } from '../utils/errorHandler';

const STORAGE_KEY_GEMINI_KEY = '@dalay_gemini_api_key';
const STORAGE_KEY_AI_VALIDATED = '@dalay_gemini_is_validated';

const AiContext = createContext(null);

export const AiProvider = ({ children }) => {
  const [geminiApiKey, setGeminiApiKeyState] = useState('');
  const [isValidated, setIsValidated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    loadAiConfig();
  }, []);

  const loadAiConfig = async () => {
    try {
      const [savedKey, savedValidated] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY_GEMINI_KEY),
        AsyncStorage.getItem(STORAGE_KEY_AI_VALIDATED),
      ]);
      if (savedKey) {
        setGeminiApiKeyState(savedKey);
        setIsValidated(savedValidated === 'true');
      }
    } catch (e) {
      console.log('Error loading AI config:', e);
    } finally {
      setLoading(false);
    }
  };

  const setGeminiApiKey = async (newKey) => {
    const trimmed = (newKey || '').trim();
    setGeminiApiKeyState(trimmed);
    setIsValidated(false);
    try {
      if (trimmed) {
        await AsyncStorage.setItem(STORAGE_KEY_GEMINI_KEY, trimmed);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY_GEMINI_KEY);
      }
      await AsyncStorage.removeItem(STORAGE_KEY_AI_VALIDATED);
    } catch (e) {
      console.log('Error saving Gemini API Key:', e);
    }
  };

  const removeGeminiApiKey = async () => {
    setGeminiApiKeyState('');
    setIsValidated(false);
    try {
      await AsyncStorage.removeItem(STORAGE_KEY_GEMINI_KEY);
      await AsyncStorage.removeItem(STORAGE_KEY_AI_VALIDATED);
    } catch (e) {
      console.log('Error removing Gemini API Key:', e);
    }
  };

  const testAndSaveApiKey = async (keyToTest) => {
    const key = (keyToTest !== undefined ? keyToTest : geminiApiKey).trim();
    if (!key) {
      return { success: false, message: 'API Key tidak boleh kosong' };
    }

    setIsValidating(true);
    try {
      const result = await validateGeminiKey(key);
      if (result.success) {
        setGeminiApiKeyState(key);
        setIsValidated(true);
        await AsyncStorage.setItem(STORAGE_KEY_GEMINI_KEY, key);
        await AsyncStorage.setItem(STORAGE_KEY_AI_VALIDATED, 'true');
        return { success: true, message: result.message || 'API Key valid & siap digunakan!' };
      } else {
        setIsValidated(false);
        await AsyncStorage.setItem(STORAGE_KEY_AI_VALIDATED, 'false');
        return { success: false, message: result.message || 'API Key tidak valid atau kuota habis' };
      }
    } catch (err) {
      setIsValidated(false);
      return { success: false, message: getFriendlyErrorMessage(err, 'general', true) };
    } finally {
      setIsValidating(false);
    }
  };

  const hasApiKey = useMemo(() => {
    return Boolean(geminiApiKey && geminiApiKey.trim().length > 10);
  }, [geminiApiKey]);

  const value = useMemo(
    () => ({
      geminiApiKey,
      isValidated,
      isValidating,
      loading,
      hasApiKey,
      setGeminiApiKey,
      removeGeminiApiKey,
      testAndSaveApiKey,
    }),
    [geminiApiKey, isValidated, isValidating, loading, hasApiKey]
  );

  return <AiContext.Provider value={value}>{children}</AiContext.Provider>;
};

export const useAi = () => {
  const context = useContext(AiContext);
  if (!context) {
    throw new Error('useAi must be used within an AiProvider');
  }
  return context;
};
