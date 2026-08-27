import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LanguageProvider, useLanguage } from './src/stores/languageStore';
import { ThemeProvider, useTheme } from './src/stores/themeStore';
import { QuranProvider, useQuran } from './src/stores/quranStore';
import { WalletProvider } from './src/stores/walletStore';
import { FinanceProvider } from './src/stores/financeStore';
import { SyncProvider } from './src/stores/syncStore';
import { QuranScreen } from './src/screens/QuranScreen';
import { FinanceScreen } from './src/screens/FinanceScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { BottomTabBar } from './src/navigation/BottomTabBar';
import { getNotificationModule, initNotificationSync } from './src/services/notificationService';

const AppContent = () => {
  const [activeTab, setActiveTab] = useState('quran');
  const { colors, isDark } = useTheme();
  const { currentLanguage } = useLanguage();
  const { selectSpecificAyah } = useQuran();

  useEffect(() => {
    // Purge any stale repeating alarms and top up fresh distinct reminders
    initNotificationSync(currentLanguage);

    let subscription = null;
    try {
      const Notifications = getNotificationModule();
      if (Notifications && typeof Notifications.addNotificationResponseReceivedListener === 'function') {
        subscription = Notifications.addNotificationResponseReceivedListener((response) => {
          const data = response?.notification?.request?.content?.data;
          if (data?.surah && data?.ayah && typeof selectSpecificAyah === 'function') {
            selectSpecificAyah(data.surah, data.ayah);
          }
          setActiveTab('quran');
        });
      }
    } catch (e) {
      console.log('Notification listener setup error:', e);
    }

    return () => {
      if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
      }
    };
  }, [currentLanguage]);

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
            <WalletProvider>
              <FinanceProvider>
                <SyncProvider>
                  <AppContent />
                </SyncProvider>
              </FinanceProvider>
            </WalletProvider>
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
