import { Ionicons } from '@expo/vector-icons';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { AppCard } from '@/src/components/common/AppCard';
import { AppText } from '@/src/components/common/AppText';
import { layout } from '@/src/constants/layout';
import { theme } from '@/src/theme/theme';

type IconName = keyof typeof Ionicons.glyphMap;
type MetricTone = 'primary' | 'success' | 'warning' | 'danger';

interface DashboardMetricCardProps {
  label: string;
  value: string;
  helper?: string;
  iconName: IconName;
  tone?: MetricTone;
  style?: StyleProp<ViewStyle>;
}

export function DashboardMetricCard({
  label,
  value,
  helper,
  iconName,
  tone = 'primary',
  style,
}: DashboardMetricCardProps) {
  const color = getToneColor(tone);

  return (
    <AppCard style={[styles.card, style]}>
      <View style={[styles.iconShell, { backgroundColor: `${color}18` }]}>
        <Ionicons name={iconName} size={18} color={color} />
      </View>
      <View style={styles.copy}>
        <AppText variant="caption" color={theme.colors.textMuted}>
          {label}
        </AppText>
        <AppText variant="h3" numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </AppText>
        {helper ? (
          <AppText variant="caption" color={theme.colors.textSecondary} numberOfLines={1}>
            {helper}
          </AppText>
        ) : null}
      </View>
    </AppCard>
  );
}

function getToneColor(tone: MetricTone): string {
  if (tone === 'success') {
    return theme.colors.success;
  }

  if (tone === 'warning') {
    return theme.colors.warning;
  }

  if (tone === 'danger') {
    return theme.colors.error;
  }

  return theme.colors.primary;
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.xs,
    minHeight: 118,
    padding: theme.spacing.sm,
    width: layout.dashboardMetricWidth,
  },
  iconShell: {
    alignItems: 'center',
    borderRadius: theme.radius.medium,
    height: 34,
    justifyContent: 'center',
    width: 34,
  },
  copy: {
    gap: theme.spacing.xxs,
  },
});
