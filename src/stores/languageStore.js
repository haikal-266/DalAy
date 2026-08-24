import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPPORTED_LANGUAGES, DEFAULT_LANGUAGE_ID, TRANSLATIONS } from '../i18n/translations';

const STORAGE_KEY_LANGUAGE = '@dalay_active_language';
const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState(DEFAULT_LANGUAGE_ID);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLang = await AsyncStorage.getItem(STORAGE_KEY_LANGUAGE);
      if (savedLang && SUPPORTED_LANGUAGES.some((l) => l.id === savedLang)) {
        setCurrentLanguage(savedLang);
      }
    } catch (e) {
      console.log('Error loading language:', e);
    } finally {
      setLoading(false);
    }
  };

  const setLanguage = async (langId) => {
    if (!SUPPORTED_LANGUAGES.some((l) => l.id === langId)) return;
    setCurrentLanguage(langId);
    try {
      await AsyncStorage.setItem(STORAGE_KEY_LANGUAGE, langId);
    } catch (e) {
      console.log('Error saving language:', e);
    }
  };

  /**
   * Helper function to retrieve nested translated string
   * e.g. t('quran.appName') -> 'DalAy'
   */
  const t = useCallback(
    (path, fallback = '') => {
      if (!path) return fallback;
      const keys = path.split('.');

      // Try current language dictionary
      let current = TRANSLATIONS[currentLanguage];
      for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
          current = current[key];
        } else {
          current = null;
          break;
        }
      }

      if (typeof current === 'string') return current;

      // Fallback to English dictionary
      let fallbackDict = TRANSLATIONS[DEFAULT_LANGUAGE_ID];
      for (const key of keys) {
        if (fallbackDict && typeof fallbackDict === 'object' && key in fallbackDict) {
          fallbackDict = fallbackDict[key];
        } else {
          fallbackDict = null;
          break;
        }
      }

      if (typeof fallbackDict === 'string') return fallbackDict;

      return fallback || path;
    },
    [currentLanguage]
  );

  const value = useMemo(
    () => ({
      currentLanguage,
      setLanguage,
      t,
      availableLanguages: SUPPORTED_LANGUAGES,
      isIndonesian: currentLanguage === 'id',
      isEnglish: currentLanguage === 'en',
      loading,
    }),
    [currentLanguage, t, loading]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export default LanguageContext;
