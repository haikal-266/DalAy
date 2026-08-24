import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  addNotificationResponseReceivedListener,
  getLastNotificationResponseAsync,
} from 'expo-notifications';
import { LanguageProvider } from './src/stores/languageStore';
import { ThemeProvider, useTheme } from './src/stores/themeStore';
import { QuranProvider, useQuran } from './src/stores/quranStore';
import { FinanceProvider } from './src/stores/financeStore';
import { QuranScreen } from './src/screens/QuranScreen';
import { FinanceScreen } from './src/screens/FinanceScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { BottomTabBar } from './src/navigation/BottomTabBar';

const AppContent = () => {
  const [activeTab, setActiveTab] = useState('quran');
  const { colors, isDark } = useTheme();
  const { selectSpecificAyah } = useQuran();

  // Listen for notification clicks (both background tap and cold start)
  useEffect(() => {
    if (Platform.OS === 'web') return;

    // 1. Handle notification tap on cold launch
    getLastNotificationResponseAsync().then((response) => {
      if (response?.notification?.request?.content?.data) {
        const { surah, ayah } = response.notification.request.content.data;
        if (surah && ayah) {
          setActiveTab('quran');
          selectSpecificAyah(surah, ayah);
        }
      }
    }).catch(() => {});

    // 2. Handle notification tap while app is in foreground or background
    const subscription = addNotificationResponseReceivedListener((response) => {
      const data = response?.notification?.request?.content?.data;
      if (data?.surah && data?.ayah) {
        setActiveTab('quran');
        selectSpecificAyah(data.surah, data.ayah);
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'finance':
        return <FinanceScreen />;
      case 'settings':
        return <SettingsScreen />;
      case 'quran':
      default:
        return <QuranScreen />;
    }
  };

  return (
    <View style={[styles.outerContainer, { backgroundColor: colors.background }]}>
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: colors.background }]}
        edges={['top', 'left', 'right']}
      >
        <StatusBar
          style={isDark ? 'light' : 'dark'}
          backgroundColor={colors.background}
        />
        <View style={[styles.contentContainer, { backgroundColor: colors.background }]}>
          {renderActiveScreen()}
        </View>
        <BottomTabBar
          activeTab={activeTab}
          onTabPress={(tabId) => setActiveTab(tabId)}
        />
      </SafeAreaView>
    </View>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <ThemeProvider>
          <QuranProvider>
            <FinanceProvider>
              <AppContent />
            </FinanceProvider>
          </QuranProvider>
        </ThemeProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    alignItems: 'center',
  },
  safeArea: {
    flex: 1,
    width: '100%',
    maxWidth: 960,
  },
  contentContainer: {
    flex: 1,
  },
});
