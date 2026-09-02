import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../stores/themeStore';
import { useLanguage } from '../stores/languageStore';

const TabButton = ({ tab, isActive, onPress, colors }) => {
  const scaleAnim = useRef(new Animated.Value(isActive ? 1 : 0.94)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isActive ? 1.05 : 0.94,
      tension: 300,
      friction: 18,
      useNativeDriver: true,
    }).start();
  }, [isActive, scaleAnim]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tabItem,
        pressed && styles.tabItemPressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={tab.label}
    >
      {/* Sleek Capsule Badge around the Icon */}
      <Animated.View
        style={[
          styles.iconCapsule,
          {
            backgroundColor: isActive ? `${tab.activeColor}1A` : 'transparent',
            borderColor: isActive ? `${tab.activeColor}35` : 'transparent',
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Ionicons
          name={isActive ? tab.iconActive : tab.iconInactive}
          size={20}
          color={isActive ? tab.activeColor : colors.textMuted}
        />
      </Animated.View>

      {/* Tab Label */}
      <Text
        style={[
          styles.tabLabel,
          isActive
            ? [styles.activeTabLabel, { color: tab.activeColor }]
            : [styles.inactiveTabLabel, { color: colors.textMuted }],
        ]}
        numberOfLines={1}
      >
        {tab.label}
      </Text>
    </Pressable>
  );
};

export const BottomTabBar = ({ activeTab, onTabPress }) => {
  const { colors } = useTheme();
  const { t } = useLanguage();

  const tabs = [
    {
      id: 'quran',
      label: t('tabs.quran', 'Al-Quran'),
      iconActive: 'book',
      iconInactive: 'book-outline',
      activeColor: colors.primary,
    },
    {
      id: 'finance',
      label: t('tabs.finance', 'Finance'),
      iconActive: 'wallet',
      iconInactive: 'wallet-outline',
      activeColor: colors.brandGold || '#D97706',
    },
    {
      id: 'settings',
      label: t('tabs.settings', 'Settings'),
      iconActive: 'settings',
      iconInactive: 'settings-outline',
      activeColor: colors.accent || '#2563EB',
    },
  ];

  return (
    <View
      style={[
        styles.wrapper,
        {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderLight,
        },
      ]}
    >
      <View style={styles.container}>
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            onPress={() => onTabPress(tab.id)}
            colors={colors}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: 1,
    paddingTop: 5,
    paddingBottom: Platform.OS === 'ios' ? 22 : 6,
    paddingHorizontal: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 6,
    width: '100%',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    maxWidth: 580,
    width: '100%',
    alignSelf: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
    minHeight: 46,
  },
  iconCapsule: {
    width: 48,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 3,
  },
  tabItemPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.94 }],
  },
  tabLabel: {
    fontSize: 11,
    letterSpacing: 0.1,
    includeFontPadding: false,
  },
  activeTabLabel: {
    fontWeight: '800',
  },
  inactiveTabLabel: {
    fontWeight: '600',
  },
});

export default BottomTabBar;
