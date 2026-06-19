import { colors } from '@/src/constants/colors';
import { radius } from '@/src/constants/radius';
import { shadows } from '@/src/constants/shadows';
import { spacing } from '@/src/constants/spacing';
import { fontFamily, typography } from '@/src/constants/typography';

export const theme = {
  colors,
  spacing,
  radius,
  shadows,
  typography,
  fontFamily,
} as const;

export type AppTheme = typeof theme;
