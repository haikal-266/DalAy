import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';
import { TYPOGRAPHY } from '../../theme/typography';

export const NeoTag = ({
  label,
  icon,
  iconName,
  color = COLORS.primary,
  bgColor = COLORS.primaryLight,
  textColor,
  onPress,
  selected = false,
  size = 'md', // 'sm' | 'md'
  style,
  textStyle,
}) => {
  const isSm = size === 'sm';

  const containerStyle = [
    styles.base,
    {
      backgroundColor: selected ? COLORS.primary : bgColor || COLORS.surfaceLight,
      borderColor: selected ? COLORS.primary : COLORS.border,
      paddingVertical: isSm ? 3 : 6,
      paddingHorizontal: isSm ? 8 : 12,
    },
    style,
  ];

  const content = (
    <View style={styles.row}>
      {iconName ? (
        <Ionicons
          name={iconName}
          size={isSm ? 12 : 14}
          color={selected ? '#FFFFFF' : textColor || color}
          style={styles.icon}
        />
      ) : icon ? (
        <Text style={[styles.icon, isSm && styles.iconSm]}>{icon}</Text>
      ) : null}
      <Text
        style={[
          styles.text,
          {
            color: selected ? '#FFFFFF' : textColor || color,
            fontSize: isSm ? TYPOGRAPHY.size.xs : TYPOGRAPHY.size.sm,
          },
          textStyle,
        ]}
      >
        {label}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={containerStyle}>
        {content}
      </Pressable>
    );
  }

  return <View style={containerStyle}>{content}</View>;
};

const styles = StyleSheet.create({
  base: {
    borderWidth: 1,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginRight: 6,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 5,
  },
  iconSm: {
    fontSize: 11,
    marginRight: 3,
  },
  text: {
    fontWeight: '700',
  },
});

export default NeoTag;
