import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../../theme/typography';
import { useTheme } from '../../stores/themeStore';

export const NeoSegmented = ({
  options = [],
  selectedValue,
  onSelect,
  style,
}) => {
  const { colors, isDark } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surfaceLight,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {options.map((opt) => {
        const isSelected = opt.value === selectedValue;
        const activeBg = opt.activeColor || colors.primary;

        return (
          <Pressable
            key={opt.value}
            onPress={() => onSelect(opt.value)}
            style={[
              styles.option,
              isSelected && [
                styles.selectedOption,
                {
                  backgroundColor: opt.activeBgColor || colors.surface,
                  shadowOpacity: isDark ? 0 : 0.08,
                },
              ],
            ]}
          >
            <View style={styles.optionContent}>
              {opt.iconName ? (
                <Ionicons
                  name={opt.iconName}
                  size={15}
                  color={isSelected ? activeBg : colors.textMuted}
                  style={styles.icon}
                />
              ) : opt.icon ? (
                <Text style={styles.icon}>{opt.icon}</Text>
              ) : null}
              <Text
                style={[
                  styles.label,
                  isSelected
                    ? [styles.selectedLabel, { color: activeBg }]
                    : [styles.unselectedLabel, { color: colors.textMuted }],
                ]}
              >
                {opt.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 12,
    padding: 3,
  },
  option: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  selectedOption: {
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 5,
  },
  label: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  selectedLabel: {
    fontWeight: '800',
  },
  unselectedLabel: {},
});

export default NeoSegmented;
