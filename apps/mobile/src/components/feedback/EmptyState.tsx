import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/src/components/common/AppButton';
import { AppText } from '@/src/components/common/AppText';
import { theme } from '@/src/theme/theme';

type IconName = keyof typeof Ionicons.glyphMap;

interface EmptyStateProps {
  iconName?: IconName;
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  iconName = 'document-text-outline',
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconShell}>
        <Ionicons name={iconName} size={28} color={theme.colors.primary} />
      </View>
      <View style={styles.copy}>
        <AppText variant="h3" align="center">
          {title}
        </AppText>
        <AppText variant="body" color={theme.colors.textSecondary} align="center">
          {message}
        </AppText>
      </View>
      {actionLabel && onAction ? (
        <AppButton title={actionLabel} iconName="add-outline" onPress={onAction} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xxl,
  },
  iconShell: {
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.full,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  copy: {
    gap: theme.spacing.xs,
  },
});
