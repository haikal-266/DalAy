import { Platform } from 'react-native';

export const TYPOGRAPHY = {
  // Font Families
  fontFamily: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'sans-serif',
  }),
  fontFamilyMono: Platform.select({
    ios: 'Courier',
    android: 'monospace',
    default: 'monospace',
  }),
  fontFamilyArabic: Platform.select({
    ios: 'Geeza Pro',
    android: 'serif',
    default: 'serif',
  }),

  // Font Sizes
  size: {
    xs: 11,
    sm: 13,
    md: 15,
    lg: 18,
    xl: 22,
    xxl: 28,
    huge: 36,
    arabic: 26,
    arabicLg: 32,
  },

  // Font Weights
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    black: '900',
  }
};

export default TYPOGRAPHY;
