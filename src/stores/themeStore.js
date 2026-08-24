import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEME_PRESETS, DEFAULT_THEME_ID, getThemeById } from '../theme/themes';

const STORAGE_KEY_THEME = '@quranku_active_theme';
const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [currentThemeId, setCurrentThemeId] = useState(DEFAULT_THEME_ID);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem(STORAGE_KEY_THEME);
      if (savedTheme && THEME_PRESETS.some((t) => t.id === savedTheme)) {
        setCurrentThemeId(savedTheme);
      }
    } catch (e) {
      console.log('Error loading theme:', e);
    } finally {
      setLoading(false);
    }
  };

  const setTheme = async (themeId) => {
    if (!THEME_PRESETS.some((t) => t.id === themeId)) return;
    setCurrentThemeId(themeId);
    try {
      await AsyncStorage.setItem(STORAGE_KEY_THEME, themeId);
    } catch (e) {
      console.log('Error saving theme:', e);
    }
  };

  const activeTheme = useMemo(() => getThemeById(currentThemeId), [currentThemeId]);

  const value = useMemo(
    () => ({
      currentThemeId,
      activeTheme,
      colors: activeTheme.colors,
      isDark: activeTheme.isDark,
      setTheme,
      availableThemes: THEME_PRESETS,
      loading,
    }),
    [currentThemeId, activeTheme, loading]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
