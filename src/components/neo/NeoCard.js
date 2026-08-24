import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../stores/themeStore';

export const NeoCard = ({
  children,
  style,
  variant = 'default', // 'default' | 'light' | 'white' | 'accent' | 'income' | 'expense' | 'outline' | 'flat'
  onPress,
  noShadow = false,
  shadowColor,
  borderColor,
  padding = 16,
  borderRadius = 16,
  borderWidth = 1,
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const { colors, isDark } = useTheme();

  const getVariantStyle = () => {
    switch (variant) {
      case 'light':
        return {
          backgroundColor: colors.surfaceLight,
          borderColor: borderColor || colors.borderLight,
        };
      case 'white':
        return {
          backgroundColor: colors.surface,
          borderColor: borderColor || colors.border,
        };
      case 'accent':
        return {
          backgroundColor: colors.primarySurface,
          borderColor: borderColor || colors.primaryLight,
        };
      case 'income':
        return {
          backgroundColor: colors.incomeLight,
          borderColor: borderColor || colors.incomeBorder,
        };
      case 'expense':
        return {
          backgroundColor: colors.expenseLight,
          borderColor: borderColor || colors.expenseBorder,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderColor: borderColor || colors.border,
        };
      case 'flat':
        return {
          backgroundColor: colors.surface,
          borderColor: 'transparent',
        };
      case 'default':
      default:
        return {
          backgroundColor: colors.surface,
          borderColor: borderColor || colors.border,
        };
    }
  };

  const currentShadow = noShadow || isDark
    ? {}
    : {
        shadowColor: shadowColor || colors.shadow || '#64748B',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: isPressed ? 0.03 : 0.07,
        shadowRadius: isPressed ? 4 : 10,
        elevation: isPressed ? 1 : 3,
        transform: isPressed && onPress ? [{ scale: 0.99 }] : [],
      };

  const containerStyle = [
    styles.base,
    getVariantStyle(),
    {
      padding,
      borderRadius,
      borderWidth,
    },
    currentShadow,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        onPressIn={() => setIsPressed(true)}
        onPressOut={() => setIsPressed(false)}
        style={containerStyle}
        {...props}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={containerStyle} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    marginVertical: 5,
  },
});

export default NeoCard;
