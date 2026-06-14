import { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/src/components/common/AppText';
import { theme } from '@/src/theme/theme';

interface AppBadgeProps {
  foreground?: string;
  background?: string;
}

export function AppBadge({
  children,
  foreground = theme.colors.textSecondary,
  background = theme.colors.surfaceMuted,
}: PropsWithChildren<AppBadgeProps>) {
  return (
    <View style={[styles.badge, { backgroundColor: background }]}>
      <AppText variant="caption" color={foreground}>
        {children}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
  },
});
