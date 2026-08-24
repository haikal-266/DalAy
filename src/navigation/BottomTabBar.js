import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../stores/themeStore';

export const BottomTabBar = ({ activeTab, onTabPress }) => {
  const { colors } = useTheme();

  const tabs = [
    {
      id: 'quran',
      label: 'Al-Quran',
      iconActive: 'book',
      iconInactive: 'book-outline',
      activeColor: colors.primary,
    },
    {
      id: 'finance',
      label: 'Keuangan',
      iconActive: 'wallet',
      iconInactive: 'wallet-outline',
      activeColor: colors.brandGold || '#D97706',
    },
    {
      id: 'settings',
      label: 'Pengaturan',
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
          borderTopColor: colors.border,
        },
      ]}
    >
      <View style={styles.container}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <Pressable
              key={tab.id}
              onPress={() => onTabPress(tab.id)}
              style={({ pressed }) => [
                styles.tabItem,
                pressed && styles.tabItemPressed,
              ]}
            >
              <Ionicons
                name={isActive ? tab.iconActive : tab.iconInactive}
                size={23}
                color={isActive ? tab.activeColor : colors.textMuted}
                style={styles.icon}
              />
              <Text
                style={[
                  styles.tabLabel,
                  isActive
                    ? [styles.activeTabLabel, { color: tab.activeColor }]
                    : [styles.inactiveTabLabel, { color: colors.textMuted }],
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderTopWidth: 1,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingHorizontal: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.94 }],
  },
  icon: {
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 11,
    letterSpacing: 0.1,
  },
  activeTabLabel: {
    fontWeight: '800',
  },
  inactiveTabLabel: {
    fontWeight: '600',
  },
});

export default BottomTabBar;
