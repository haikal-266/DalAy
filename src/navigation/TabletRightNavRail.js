import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../stores/themeStore';
import { useLanguage } from '../stores/languageStore';

const NavRailItem = ({ tab, isActive, onPress, colors }) => {
  const scaleAnim = useRef(new Animated.Value(isActive ? 1.05 : 1)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: isActive ? 1.06 : 1,
      tension: 300,
      friction: 18,
      useNativeDriver: true,
    }).start();
  }, [isActive, scaleAnim]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.railItem,
        isActive && { backgroundColor: `${tab.activeColor}14` },
        pressed && styles.railItemPressed,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={tab.label}
    >
      <Animated.View
        style={[
          styles.iconCapsule,
          {
            backgroundColor: isActive ? `${tab.activeColor}22` : 'transparent',
            borderColor: isActive ? `${tab.activeColor}40` : 'transparent',
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Ionicons
          name={isActive ? tab.iconActive : tab.iconInactive}
          size={22}
          color={isActive ? tab.activeColor : colors.textMuted}
        />
      </Animated.View>

      <Text
        style={[
          styles.railLabel,
          isActive
            ? [styles.activeLabel, { color: tab.activeColor }]
            : [styles.inactiveLabel, { color: colors.textSecondary }],
        ]}
        numberOfLines={1}
      >
        {tab.label}
      </Text>

      {isActive && (
        <View style={[styles.activeDot, { backgroundColor: tab.activeColor }]} />
      )}
    </Pressable>
  );
};

export const TabletRightNavRail = ({ activeTab, onTabPress }) => {
  const { colors } = useTheme();
  const { isIndonesian } = useLanguage();

  const tabs = [
    {
      id: 'quran',
      label: isIndonesian ? 'Al-Quran' : 'Quran',
      iconActive: 'book',
      iconInactive: 'book-outline',
      activeColor: colors.primary,
    },
    {
      id: 'finance',
      label: isIndonesian ? 'Keuangan' : 'Finance',
      iconActive: 'wallet',
      iconInactive: 'wallet-outline',
      activeColor: colors.brandGold || '#D97706',
    },
    {
      id: 'settings',
      label: isIndonesian ? 'Pengaturan' : 'Settings',
      iconActive: 'settings',
      iconInactive: 'settings-outline',
      activeColor: colors.accent || '#2563EB',
    },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderLeftColor: colors.borderLight,
        },
      ]}
    >
      {/* Top App Logo Mark */}
      <View style={styles.topSection}>
        <View style={[styles.appLogoBadge, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="sparkles" size={18} color={colors.primary} />
        </View>
        <Text style={[styles.appLogoText, { color: colors.primary }]}>DalAy</Text>
      </View>

      {/* Vertical Navigation Tabs */}
      <View style={styles.middleSection}>
        {tabs.map((tab) => (
          <NavRailItem
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            onPress={() => onTabPress(tab.id)}
            colors={colors}
          />
        ))}
      </View>

      {/* Bottom Spacer / Info */}
      <View style={styles.bottomSection}>
        <View
          style={[
            styles.statusPill,
            { backgroundColor: colors.income + '18', borderColor: colors.income + '35' },
          ]}
        >
          <View style={[styles.onlineDot, { backgroundColor: colors.income }]} />
          <Text style={[styles.statusText, { color: colors.income }]}>Pro</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 86,
    height: '100%',
    borderLeftWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Platform.select({
      web: {
        userSelect: 'none',
      },
    }),
  },
  topSection: {
    alignItems: 'center',
    gap: 4,
    paddingTop: 4,
  },
  appLogoBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appLogoText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: -0.2,
    includeFontPadding: false,
  },
  middleSection: {
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  railItem: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    position: 'relative',
  },
  railItemPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
  iconCapsule: {
    width: 44,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  railLabel: {
    fontSize: 10,
    letterSpacing: 0.1,
    includeFontPadding: false,
    textAlign: 'center',
  },
  activeLabel: {
    fontWeight: '800',
  },
  inactiveLabel: {
    fontWeight: '600',
  },
  activeDot: {
    position: 'absolute',
    left: 2,
    top: '50%',
    marginTop: -8,
    width: 3,
    height: 16,
    borderRadius: 2,
  },
  bottomSection: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  onlineDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 9,
    fontWeight: '800',
    includeFontPadding: false,
  },
});

export default TabletRightNavRail;
