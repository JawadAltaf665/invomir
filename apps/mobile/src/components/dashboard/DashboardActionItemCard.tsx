import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/src/components/common/AppText';
import { DashboardActionItemDto } from '@/src/features/dashboard/types';
import { theme } from '@/src/theme/theme';

interface DashboardActionItemCardProps {
  item: DashboardActionItemDto;
  onPress?: () => void;
}

export function DashboardActionItemCard({ item, onPress }: DashboardActionItemCardProps) {
  const palette = getPalette(item.type);
  const canPress = Boolean(onPress && item.actionUrl);

  return (
    <Pressable
      accessibilityRole={canPress ? 'button' : undefined}
      disabled={!canPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: palette.background, borderColor: palette.border },
        pressed && canPress ? styles.pressed : null,
      ]}
    >
      <View style={[styles.iconShell, { backgroundColor: theme.colors.surface }]}>
        <Ionicons name={palette.iconName} size={18} color={palette.foreground} />
      </View>
      <View style={styles.copy}>
        <AppText variant="label" numberOfLines={1}>
          {item.title}
        </AppText>
        <AppText variant="caption" color={theme.colors.textSecondary} numberOfLines={2}>
          {item.message}
        </AppText>
      </View>
      {item.actionLabel && item.actionUrl ? (
        <View style={styles.action}>
          <AppText variant="caption" color={palette.foreground} numberOfLines={1}>
            {item.actionLabel}
          </AppText>
          <Ionicons name="chevron-forward" size={15} color={palette.foreground} />
        </View>
      ) : null}
    </Pressable>
  );
}

function getPalette(type: string): {
  background: string;
  border: string;
  foreground: string;
  iconName: keyof typeof Ionicons.glyphMap;
} {
  if (type === 'critical') {
    return {
      background: theme.colors.errorLight,
      border: theme.colors.errorLight,
      foreground: theme.colors.error,
      iconName: 'alert-circle-outline',
    };
  }

  if (type === 'warning') {
    return {
      background: theme.colors.warningLight,
      border: theme.colors.warningLight,
      foreground: theme.colors.warning,
      iconName: 'warning-outline',
    };
  }

  if (type === 'success') {
    return {
      background: theme.colors.successLight,
      border: theme.colors.successLight,
      foreground: theme.colors.success,
      iconName: 'checkmark-circle-outline',
    };
  }

  return {
    background: theme.colors.infoLight,
    border: theme.colors.infoLight,
    foreground: theme.colors.info,
    iconName: 'information-circle-outline',
  };
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
  },
  iconShell: {
    alignItems: 'center',
    borderRadius: theme.radius.full,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  action: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
    maxWidth: 108,
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
});
