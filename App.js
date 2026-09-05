import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, View, Animated, PanResponder, useWindowDimensions, Dimensions, Platform } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import { LanguageProvider, useLanguage } from './src/stores/languageStore';
import { ThemeProvider, useTheme } from './src/stores/themeStore';
import { QuranProvider, useQuran } from './src/stores/quranStore';
import { WalletProvider } from './src/stores/walletStore';
import { CategoryProvider } from './src/stores/categoryStore';
import { FinanceProvider } from './src/stores/financeStore';
import { SyncProvider } from './src/stores/syncStore';
import { AiProvider } from './src/stores/aiStore';
import { SwipeNavigationProvider, useSwipeNavigation } from './src/stores/swipeNavigationStore';
import { QuranScreen } from './src/screens/QuranScreen';
import { FinanceScreen } from './src/screens/FinanceScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { BottomTabBar } from './src/navigation/BottomTabBar';
import { TabletRightNavRail } from './src/navigation/TabletRightNavRail';
import { getNotificationModule, initNotificationSync } from './src/services/notificationService';
import { initializeDatabase } from './src/services/database';

const TABS = ['quran', 'finance', 'settings'];

const AppContent = () => {
  const [activeTab, setActiveTab] = useState('quran');
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const isTablet = Math.min(windowWidth, windowHeight) >= 600 || windowWidth >= 768;
  const [containerWidth, setContainerWidth] = useState(windowWidth);

  const { colors, isDark } = useTheme();
  const { currentLanguage, loading: langLoading } = useLanguage();
  const { selectSpecificAyah } = useQuran();
  const { swipeEnabledRef } = useSwipeNavigation();

  // Strict Device Orientation: Tablets strictly LANDSCAPE, Phones strictly PORTRAIT
  useEffect(() => {
    const configureDeviceOrientation = async () => {
      try {
        if (Platform.OS === 'web') return;
        const { width, height } = Dimensions.get('window');
        const minDimension = Math.min(width, height);
        const isTabletDevice = minDimension >= 600;

        if (isTabletDevice) {
          // Strictly lock Tablets to Landscape (no portrait leaking)
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
        } else {
          // Strictly lock Phones to Portrait
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        }
      } catch (e) {
        console.log('Screen orientation setup note:', e);
      }
    };

    configureDeviceOrientation();
  }, []);

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
        if (!swipeEnabledRef.current) return false;
        const { dx, dy } = gestureState;
        return Math.abs(dx) > 15 && Math.abs(dx) > Math.abs(dy) * 1.5;
      },
      onPanResponderGrant: () => {
        scrollX.stopAnimation((val) => {
          gestureStartScrollX.current = val;
        });
      },
      onPanResponderMove: (_, gestureState) => {
        const currentIndex = TABS.indexOf(activeTabRef.current);
        const baseOffset = -currentIndex * containerWidthRef.current;
        let newOffset = baseOffset + gestureState.dx;

        // Apply friction resistance at boundaries
        const maxOffset = 0;
        const minOffset = -2 * containerWidthRef.current;

        if (newOffset > maxOffset) {
          newOffset = maxOffset + (newOffset - maxOffset) * 0.3;
        } else if (newOffset < minOffset) {
          newOffset = minOffset + (newOffset - minOffset) * 0.3;
        }

        scrollX.setValue(newOffset);
      },
      onPanResponderRelease: (_, gestureState) => {
        const { dx, vx } = gestureState;
        const currentIndex = TABS.indexOf(activeTabRef.current);
        let targetIndex = currentIndex;

        const threshold = containerWidthRef.current * 0.22;
        const velocityThreshold = 0.4;

        if (dx < -threshold || (dx < -25 && vx < -velocityThreshold)) {
          targetIndex = Math.min(currentIndex + 1, TABS.length - 1);
        } else if (dx > threshold || (dx > 25 && vx > velocityThreshold)) {
          targetIndex = Math.max(currentIndex - 1, 0);
        }

        const newTab = TABS[targetIndex];
        activeTabRef.current = newTab;
        setActiveTab(newTab);

        Animated.spring(scrollX, {
          toValue: -targetIndex * containerWidthRef.current,
          velocity: -vx,
          tension: 180,
          friction: 22,
          useNativeDriver: true,
        }).start();
      },
      onPanResponderTerminate: () => {
        const currentIndex = TABS.indexOf(activeTabRef.current);
        Animated.spring(scrollX, {
          toValue: -currentIndex * containerWidthRef.current,
          tension: 200,
          friction: 20,
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
        style={[
          styles.safeArea,
          isTablet && styles.safeAreaTablet,
          { backgroundColor: colors.background },
        ]}
        edges={['top', 'left', 'right', isTablet ? 'bottom' : 'left']}
      >
        <StatusBar
          style={isDark ? 'light' : 'dark'}
          backgroundColor={colors.background}
        />

        {/* Main Tablet / Mobile Content Area */}
        <View style={[styles.mainShell, isTablet && styles.mainShellTablet]}>
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

          {/* Right Nav Rail for Tablet */}
          {isTablet && (
            <TabletRightNavRail
              activeTab={activeTab}
              onTabPress={handleTabPress}
            />
          )}
        </View>

        {/* Bottom Tab Bar for Mobile Phone */}
        {!isTablet && (
          <BottomTabBar
            activeTab={activeTab}
            onTabPress={handleTabPress}
          />
        )}
      </SafeAreaView>
    </View>
  );
};

export default function App() {
  useEffect(() => {
    initializeDatabase().catch((err) => {
      console.warn('[DB] App startup init error:', err);
    });
  }, []);

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <ThemeProvider>
          <AiProvider>
            <QuranProvider>
              <WalletProvider>
                <CategoryProvider>
                  <FinanceProvider>
                    <SyncProvider>
                      <SwipeNavigationProvider>
                        <AppContent />
                      </SwipeNavigationProvider>
                    </SyncProvider>
                  </FinanceProvider>
                </CategoryProvider>
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
    width: '100%',
    height: '100%',
  },
  safeArea: {
    flex: 1,
    width: '100%',
  },
  safeAreaTablet: {
    width: '100%',
  },
  mainShell: {
    flex: 1,
    flexDirection: 'column',
    width: '100%',
  },
  mainShellTablet: {
    flexDirection: 'row',
    width: '100%',
    height: '100%',
  },
  contentContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    width: '100%',
  },
  screensRow: {
    flex: 1,
    flexDirection: 'row',
  },
});
