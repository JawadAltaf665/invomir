import { Theme } from '@react-navigation/native';

import { theme } from '@/src/theme/theme';

export const navigationTheme: Theme = {
  dark: false,
  colors: {
    primary: theme.colors.primary,
    background: theme.colors.background,
    card: theme.colors.surface,
    text: theme.colors.textPrimary,
    border: theme.colors.border,
    notification: theme.colors.error,
  },
  fonts: {
    regular: {
      fontFamily: theme.fontFamily,
      fontWeight: '400',
    },
    medium: {
      fontFamily: theme.fontFamily,
      fontWeight: '500',
    },
    bold: {
      fontFamily: theme.fontFamily,
      fontWeight: '700',
    },
    heavy: {
      fontFamily: theme.fontFamily,
      fontWeight: '700',
    },
  },
};
