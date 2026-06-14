import { StyleSheet, View } from 'react-native';

import { AppCard } from '@/src/components/common/AppCard';
import { AppText } from '@/src/components/common/AppText';
import { theme } from '@/src/theme/theme';

interface PlanUsageCardProps {
  label: string;
  used: number;
  limit: number | null;
  unlimitedLabel: string;
}

export function PlanUsageCard({ label, used, limit, unlimitedLabel }: PlanUsageCardProps) {
  const percentage = limit ? Math.min(100, Math.round((used / limit) * 100)) : 18;

  return (
    <AppCard style={styles.card}>
      <View style={styles.header}>
        <AppText variant="label">{label}</AppText>
        <AppText variant="caption" color={theme.colors.textSecondary}>
          {limit ? `${used}/${limit}` : `${used}`}
        </AppText>
      </View>
      <View style={styles.track}>
        <View style={[styles.bar, { width: `${percentage}%` }]} />
      </View>
      <AppText variant="bodySmall" color={theme.colors.textMuted}>
        {limit ? `${percentage}%` : unlimitedLabel}
      </AppText>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.sm,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  track: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.full,
    height: 8,
    overflow: 'hidden',
  },
  bar: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
    height: 8,
  },
});
