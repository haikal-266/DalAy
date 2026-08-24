import React, { useState } from 'react';
import { StyleSheet, Text, Pressable, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../../theme/typography';
import { useTheme } from '../../stores/themeStore';

export const NeoButton = ({
  title,
  children,
  onPress,
  variant = 'primary', // 'primary' | 'secondary' | 'light' | 'income' | 'expense' | 'outline' | 'dark' | 'accent' | 'danger'
  size = 'md', // 'sm' | 'md' | 'lg'
  icon,
  iconName,
  iconSize,
  rightIcon,
  rightIconName,
  disabled = false,
  loading = false,
  style,
  textStyle,
  fullWidth = false,
  ...props
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const { colors, isDark } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          container: {
            backgroundColor: colors.surfaceLight,
            borderColor: colors.border,
          },
          text: {
            color: colors.text,
          },
          iconColor: colors.text,
        };
      case 'light':
        return {
          container: {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
          text: {
            color: colors.text,
          },
          iconColor: colors.primary,
        };
      case 'income':
        return {
          container: {
            backgroundColor: colors.income,
            borderColor: colors.income,
          },
          text: {
            color: '#FFFFFF',
          },
          iconColor: '#FFFFFF',
        };
      case 'expense':
      case 'danger':
        return {
          container: {
            backgroundColor: colors.expense,
            borderColor: colors.expense,
          },
          text: {
            color: '#FFFFFF',
          },
          iconColor: '#FFFFFF',
        };
      case 'accent':
        return {
          container: {
            backgroundColor: colors.primaryLight,
            borderColor: colors.primaryLight,
          },
          text: {
            color: colors.primaryDark,
          },
          iconColor: colors.primaryDark,
        };
      case 'outline':
        return {
          container: {
            backgroundColor: colors.surfaceLight,
            borderColor: colors.border,
            elevation: 0,
            shadowOpacity: 0,
          },
          text: {
            color: colors.text,
          },
          iconColor: colors.text,
        };
      case 'dark':
        return {
          container: {
            backgroundColor: isDark ? '#1E293B' : colors.text,
            borderColor: isDark ? '#334155' : colors.text,
          },
          text: {
            color: '#FFFFFF',
          },
          iconColor: '#FFFFFF',
        };
      case 'primary':
      default:
        return {
          container: {
            backgroundColor: colors.primary,
            borderColor: colors.primary,
          },
          text: {
            color: '#FFFFFF',
          },
          iconColor: '#FFFFFF',
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          container: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10 },
          text: { fontSize: TYPOGRAPHY.size.xs },
          iconSize: iconSize || 14,
        };
      case 'lg':
        return {
          container: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: 16 },
          text: { fontSize: TYPOGRAPHY.size.md },
          iconSize: iconSize || 20,
        };
      case 'md':
      default:
        return {
          container: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 },
          text: { fontSize: TYPOGRAPHY.size.sm },
          iconSize: iconSize || 17,
        };
    }
  };

  const vStyle = getVariantStyles();
  const sStyle = getSizeStyles();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={[
        styles.base,
        vStyle.container,
        sStyle.container,
        isPressed && styles.pressed,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        isDark && { shadowOpacity: 0 },
        style,
      ]}
      {...props}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={vStyle.text.color} size="small" style={styles.loader} />
        ) : (
          <>
            {iconName ? (
              <View style={styles.iconLeft}>
                <Ionicons name={iconName} size={sStyle.iconSize} color={vStyle.iconColor} />
              </View>
            ) : icon ? (
              <View style={styles.iconLeft}>{icon}</View>
            ) : null}

            {title ? (
              <Text style={[styles.text, vStyle.text, sStyle.text, textStyle]}>
                {title}
              </Text>
            ) : (
              children
            )}

            {rightIconName ? (
              <View style={styles.iconRight}>
                <Ionicons name={rightIconName} size={sStyle.iconSize} color={vStyle.iconColor} />
              </View>
            ) : rightIcon ? (
              <View style={styles.iconRight}>{rightIcon}</View>
            ) : null}
          </>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  text: {
    fontWeight: '700',
    textAlign: 'center',
  },
  iconLeft: {
    marginRight: 6,
  },
  iconRight: {
    marginLeft: 6,
  },
  loader: {
    marginVertical: 2,
  },
  disabled: {
    opacity: 0.5,
  },
});

export default NeoButton;
