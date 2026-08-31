import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Animated, ActivityIndicator } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
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

// Modern Branded Screen Loading View (Replaces old page immediately)
const ScreenLoadingView = ({ activeTab, colors, isIndonesian }) => {
  const pulseAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 120,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.9,
          duration: 450,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim, pulseAnim]);

  const getTabDetails = () => {
    switch (activeTab) {
      case 'finance':
        return {
          icon: 'wallet-outline',
          color: colors.brandGold || '#D97706',
          label: isIndonesian ? 'Memuat Keuangan...' : 'Loading Finance...',
        };
      case 'settings':
        return {
          icon: 'settings-outline',
          color: colors.accent || '#2563EB',
          label: isIndonesian ? 'Memuat Pengaturan...' : 'Loading Settings...',
        };
      case 'quran':
      default:
        return {
          icon: 'book-outline',
          color: colors.primary,
          label: isIndonesian ? 'Memuat Al-Quran...' : 'Loading Quran...',
        };
    }
  };

  const { icon, color, label } = getTabDetails();

  return (
    <Animated.View
      style={[
        styles.screenLoaderContainer,
        { backgroundColor: colors.background, opacity: fadeAnim },
      ]}
    >
      {/* Glowing Pulsing Icon Circle */}
      <Animated.View
        style={[
          styles.loaderIconCircle,
          {
            backgroundColor: `${color}18`,
            borderColor: `${color}35`,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <Ionicons name={icon} size={34} color={color} />
      </Animated.View>

      {/* Loading Spinner & Label */}
      <ActivityIndicator size="small" color={color} style={styles.loaderSpinner} />
      <Text style={[styles.loaderText, { color: colors.textSecondary }]}>
        {label}
      </Text>
    </Animated.View>
  );
};

const AppContent = () => {
  const [activeTab, setActiveTab] = useState('quran');
  const [renderedTab, setRenderedTab] = useState('quran');
  const [isLoading, setIsLoading] = useState(false);

  const { colors, isDark } = useTheme();
  const { currentLanguage, isIndonesian, loading: langLoading } = useLanguage();
  const { selectSpecificAyah } = useQuran();

  const handleTabPress = (tabId) => {
    if (tabId === activeTab) return;

    // 1. Instant Active Tab Switch (0ms response, bottom bar highlights and animates immediately)
    setActiveTab(tabId);

    // 2. Clear old screen immediately by triggering clean loading state
    setIsLoading(true);

    // 3. Mount destination screen cleanly on the very next frame
    setTimeout(() => {
      setRenderedTab(tabId);
      setIsLoading(false);
    }, 45);
  };

  useEffect(() => {
    if (langLoading) return;

    // Purge any stale repeating alarms and top up fresh distinct reminders in active language
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
          handleTabPress('quran');
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
  }, [currentLanguage, langLoading, selectSpecificAyah]);

  const renderActiveScreen = () => {
    switch (renderedTab) {
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
          {isLoading ? (
            <ScreenLoadingView
              activeTab={activeTab}
              colors={colors}
              isIndonesian={isIndonesian}
            />
          ) : (
            renderActiveScreen()
          )}
        </View>
        <BottomTabBar
          activeTab={activeTab}
          onTabPress={handleTabPress}
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
    position: 'relative',
  },
  screenLoaderContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  loaderIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  loaderSpinner: {
    marginBottom: 8,
  },
  loaderText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
