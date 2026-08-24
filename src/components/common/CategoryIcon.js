import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { COLORS } from '../../theme/colors';

export const CategoryIcon = ({
  iconName = 'cube',
  iconFamily = 'Ionicons',
  color = COLORS.primary,
  bgColor = COLORS.primaryLight,
  size = 20,
  containerSize = 40,
  borderRadius = 12,
  style,
}) => {
  const renderIcon = () => {
    switch (iconFamily) {
      case 'MaterialCommunityIcons':
        return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
      case 'Feather':
        return <Feather name={iconName} size={size} color={color} />;
      case 'Ionicons':
      default:
        return <Ionicons name={iconName} size={size} color={color} />;
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          width: containerSize,
          height: containerSize,
          borderRadius,
          backgroundColor: bgColor,
        },
        style,
      ]}
    >
      {renderIcon()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CategoryIcon;
