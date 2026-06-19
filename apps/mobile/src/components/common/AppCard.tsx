import { PropsWithChildren } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { theme } from '@/src/theme/theme';

interface AppCardProps {
  style?: StyleProp<ViewStyle>;
}

export function AppCard({ children, style }: PropsWithChildren<AppCardProps>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.large,
    borderWidth: 1,
    padding: theme.spacing.md,
    ...(theme.shadows.card ?? {}),
  },
});
