import { StyleSheet, View } from 'react-native';

import { LoadingSkeleton } from '@/src/components/feedback/LoadingSkeleton';
import { theme } from '@/src/theme/theme';

interface LoadingStateProps {
  rows?: number;
}

export function LoadingState({ rows = 4 }: LoadingStateProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: rows }).map((_, index) => (
        <View key={index} style={styles.card}>
          <LoadingSkeleton height={18} width="42%" />
          <LoadingSkeleton height={32} />
          <LoadingSkeleton height={14} width="72%" />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.large,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
  },
});
