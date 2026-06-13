import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/src/components/common/AppText';
import { theme } from '@/src/theme/theme';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function AppHeader({ title, subtitle, action }: AppHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.copy}>
        <AppText variant="h2">{title}</AppText>
        {subtitle ? (
          <AppText variant="bodySmall" color={theme.colors.textSecondary}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  copy: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
});
