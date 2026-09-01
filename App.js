import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, Animated, PanResponder, useWindowDimensions } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LanguageProvider, useLanguage } from './src/stores/languageStore';
import { ThemeProvider, useTheme } from './src/stores/themeStore';
import { QuranProvider, useQuran } from './src/stores/quranStore';
import { WalletProvider } from './src/stores/walletStore';
import { FinanceProvider } from './src/stores/financeStore';
import { SyncProvider } from './src/stores/syncStore';
import { AiProvider } from './src/stores/aiStore';
import { SwipeNavigationProvider, useSwipeNavigation } from './src/stores/swipeNavigationStore';
import { QuranScreen } from './src/screens/QuranScreen';
import { FinanceScreen } from './src/screens/FinanceScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { BottomTabBar } from './src/navigation/BottomTabBar';
import { getNotificationModule, initNotificationSync } from './src/services/notificationService';

const TABS = ['quran', 'finance', 'settings'];

const AppContent = () => {
  const [activeTab, setActiveTab] = useState('quran');
  const { width: windowWidth } = useWindowDimensions();
  const [containerWidth, setContainerWidth] = useState(Math.min(windowWidth, 960));

  const { colors, isDark } = useTheme();
  const { currentLanguage, loading: langLoading } = useLanguage();
  const { selectSpecificAyah } = useQuran();
  const { swipeEnabledRef } = useSwipeNavigation();

  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  const containerWidthRef = useRef(containerWidth);
  containerWidthRef.current = containerWidth;

  const scrollX = useRef(new Animated.Value(0)).current;
  const gestureStartScrollX = useRef(0);

  const handleTabPress = useCallback((tabId) => {
    const targetIndex = TABS.indexOf(tabId);
    if (targetIndex === -1) return;

    activeTabRef.current = tabId;
    setActiveTab(tabId);

    Animated.spring(scrollX, {
      toValue: -targetIndex * containerWidthRef.current,
      tension: 200,
      friction: 20,
      useNativeDriver: true,
    }).start();
  }, [scrollX]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (swipeEnabledRef?.current === false) return false;
        return (
          Math.abs(gestureState.dx) > 12 &&
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.6
        );
      },
      onMoveShouldSetPanResponderCapture: () => false,
      onPanResponderGrant: () => {
        const currentIndex = TABS.indexOf(activeTabRef.current);
        gestureStartScrollX.current = -currentIndex * containerWidthRef.current;
      },
      onPanResponderMove: (_, gestureState) => {
        if (swipeEnabledRef?.current === false) return;

        const currentIndex = TABS.indexOf(activeTabRef.current);
        let dx = gestureState.dx;

        // Resistensi saat ditarik di ujung kiri atau kanan layar
        if ((currentIndex === 0 && dx > 0) || (currentIndex === TABS.length - 1 && dx < 0)) {
          dx = dx * 0.25;
        }

        scrollX.setValue(gestureStartScrollX.current + dx);
      },
      onPanResponderTerminationRequest: () => true,
      onPanResponderRelease: (_, gestureState) => {
        const width = containerWidthRef.current || 1;
        const currentIndex = TABS.indexOf(activeTabRef.current);

        if (swipeEnabledRef?.current === false) {
          scrollX.setValue(-currentIndex * width);
          return;
        }

        const { dx, vx } = gestureState;
        let targetIndex = currentIndex;

        // Geser ke tab kanan (swipe kiri) jika jarak > 18% lebar layar atau flick cepat
        if ((dx < -width * 0.18 || (dx < -20 && vx < -0.3)) && currentIndex < TABS.length - 1) {
          targetIndex = currentIndex + 1;
        }
        // Geser ke tab kiri (swipe kanan) jika jarak > 18% lebar layar atau flick cepat
        else if ((dx > width * 0.18 || (dx > 20 && vx > 0.3)) && currentIndex > 0) {
          targetIndex = currentIndex - 1;
        }

        const targetTab = TABS[targetIndex];
        activeTabRef.current = targetTab;
        setActiveTab(targetTab);

        Animated.spring(scrollX, {
          toValue: -targetIndex * width,
          tension: 220,
          friction: 22,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const onContainerLayout = useCallback((event) => {
    const { width } = event.nativeEvent.layout;
    if (width > 0 && Math.abs(width - containerWidth) > 1) {
      setContainerWidth(width);
      containerWidthRef.current = width;
      const currentIndex = TABS.indexOf(activeTabRef.current);
      scrollX.setValue(-currentIndex * width);
    }
  }, [containerWidth, scrollX]);

  useEffect(() => {
    if (langLoading) return;

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
  }, [currentLanguage, langLoading, selectSpecificAyah, handleTabPress]);

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

        <View
          style={[styles.contentContainer, { backgroundColor: colors.background }]}
          onLayout={onContainerLayout}
          {...panResponder.panHandlers}
        >
          <Animated.View
            style={[
              styles.screensRow,
              {
                width: containerWidth * 3,
                transform: [{ translateX: scrollX }],
              },
            ]}
          >
            <View style={{ width: containerWidth, flex: 1 }}>
              <QuranScreen onNavigateTab={handleTabPress} />
            </View>
            <View style={{ width: containerWidth, flex: 1 }}>
              <FinanceScreen onNavigateTab={handleTabPress} />
            </View>
            <View style={{ width: containerWidth, flex: 1 }}>
              <SettingsScreen onNavigateTab={handleTabPress} />
            </View>
          </Animated.View>
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
          <AiProvider>
            <QuranProvider>
              <WalletProvider>
                <FinanceProvider>
                  <SyncProvider>
                    <SwipeNavigationProvider>
                      <AppContent />
                    </SwipeNavigationProvider>
                  </SyncProvider>
                </FinanceProvider>
              </WalletProvider>
            </QuranProvider>
          </AiProvider>
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
    overflow: 'hidden',
  },
  screensRow: {
    flex: 1,
    flexDirection: 'row',
  },
});
