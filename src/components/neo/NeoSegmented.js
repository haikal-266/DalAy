import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../../theme/typography';
import { useTheme } from '../../stores/themeStore';

export const NeoSegmented = ({
  options = [],
  selectedValue,
  onSelect,
  onValueChange,
  onChange,
  style,
  allowMultiLine = false,
  numberOfLines,
}) => {
  const { colors, isDark } = useTheme();

  // Safely support onSelect, onValueChange, or onChange
  const handleSelect = (val) => {
    if (typeof onSelect === 'function') {
      onSelect(val);
    } else if (typeof onValueChange === 'function') {
      onValueChange(val);
    } else if (typeof onChange === 'function') {
      onChange(val);
    }
  };

  const linesCount = numberOfLines !== undefined ? numberOfLines : (allowMultiLine ? 2 : 1);

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
            onPress={() => handleSelect(opt.value)}
            style={[
              styles.option,
              allowMultiLine && styles.multiLineOption,
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
                  size={14}
                  color={isSelected ? activeBg : colors.textMuted}
                  style={styles.icon}
                />
              ) : opt.icon ? (
                <Text style={styles.icon}>{opt.icon}</Text>
              ) : null}
              <Text
                style={[
                  styles.label,
                  allowMultiLine && styles.multiLineLabel,
                  isSelected
                    ? [styles.selectedLabel, { color: activeBg }]
                    : [styles.unselectedLabel, { color: colors.textSecondary }],
                ]}
                numberOfLines={linesCount}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.75}
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
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
  },
  option: {
    flex: 1,
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  multiLineOption: {
    paddingVertical: 6,
    paddingHorizontal: 2,
    minHeight: 38,
  },
  selectedOption: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 1,
    width: '100%',
  },
  icon: {
    marginRight: 4,
  },
  label: {
    fontSize: TYPOGRAPHY.size.xs,
    letterSpacing: -0.1,
    textAlign: 'center',
    flexShrink: 1,
  },
  multiLineLabel: {
    fontSize: 11,
    lineHeight: 13.5,
  },
  selectedLabel: {
    fontWeight: '800',
  },
  unselectedLabel: {
    fontWeight: '600',
  },
});

export default NeoSegmented;
