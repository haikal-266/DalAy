import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TYPOGRAPHY } from '../../theme/typography';
import { useTheme } from '../../stores/themeStore';

export const NeoInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  error,
  helperText,
  leftIcon,
  leftIconName,
  rightIcon,
  rightIconName,
  multiline = false,
  numberOfLines = 1,
  style,
  inputStyle,
  keyboardType = 'default',
  secureTextEntry = false,
  autoCapitalize = 'none',
  editable = true,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const { colors, isDark } = useTheme();

  const resolvedLeftIconName = leftIconName || (typeof leftIcon === 'string' ? leftIcon : null);
  const resolvedRightIconName = rightIconName || (typeof rightIcon === 'string' ? rightIcon : null);

  return (
    <View style={[styles.wrapper, style]}>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}

      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
          isFocused && [styles.focusedContainer, { borderColor: colors.primary, backgroundColor: colors.surface }],
          error && [styles.errorContainer, { borderColor: colors.expense }],
          !editable && [styles.disabledContainer, { backgroundColor: colors.surfaceLight }],
          isDark && { shadowOpacity: 0 },
        ]}
      >
        {resolvedLeftIconName ? (
          <View style={styles.leftIconWrapper}>
            <Ionicons
              name={resolvedLeftIconName}
              size={18}
              color={isFocused ? colors.primary : colors.textMuted}
            />
          </View>
        ) : leftIcon && typeof leftIcon !== 'string' ? (
          <View style={styles.leftIconWrapper}>{leftIcon}</View>
        ) : null}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSubtle}
          multiline={multiline}
          numberOfLines={numberOfLines}
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          editable={editable}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          style={[
            styles.input,
            { color: colors.text },
            multiline && { minHeight: numberOfLines * 24, textAlignVertical: 'top' },
            inputStyle,
          ]}
          {...props}
        />

        {resolvedRightIconName ? (
          <View style={styles.rightIconWrapper}>
            <Ionicons
              name={resolvedRightIconName}
              size={18}
              color={isFocused ? colors.primary : colors.textMuted}
            />
          </View>
        ) : rightIcon && typeof rightIcon !== 'string' ? (
          <View style={styles.rightIconWrapper}>{rightIcon}</View>
        ) : null}
      </View>

      {error ? (
        <Text style={[styles.errorText, { color: colors.expense }]}>{error}</Text>
      ) : helperText ? (
        <Text style={[styles.helperText, { color: colors.textMuted }]}>{helperText}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 5,
    width: '100%',
  },
  label: {
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: '700',
    marginBottom: 5,
    letterSpacing: 0.3,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  focusedContainer: {
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  errorContainer: {},
  disabledContainer: {
    opacity: 0.6,
  },
  input: {
    flex: 1,
    fontSize: TYPOGRAPHY.size.sm,
    paddingVertical: 10,
  },
  leftIconWrapper: {
    marginRight: 8,
  },
  rightIconWrapper: {
    marginLeft: 8,
  },
  errorText: {
    fontSize: TYPOGRAPHY.size.xs,
    marginTop: 4,
    fontWeight: '600',
  },
  helperText: {
    fontSize: TYPOGRAPHY.size.xs,
    marginTop: 4,
  },
});

export default NeoInput;
