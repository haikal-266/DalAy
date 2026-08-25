import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LanguageProvider } from './src/stores/languageStore';
import { ThemeProvider, useTheme } from './src/stores/themeStore';
import { QuranProvider } from './src/stores/quranStore';
import { FinanceProvider } from './src/stores/financeStore';
import { SyncProvider } from './src/stores/syncStore';
import { QuranScreen } from './src/screens/QuranScreen';
import { FinanceScreen } from './src/screens/FinanceScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { BottomTabBar } from './src/navigation/BottomTabBar';

const AppContent = () => {
  const [activeTab, setActiveTab] = useState('quran');
  const { colors, isDark } = useTheme();

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
              <SyncProvider>
                <AppContent />
              </SyncProvider>
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
