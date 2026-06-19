import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppButton } from '@/src/components/common/AppButton';
import { AppText } from '@/src/components/common/AppText';
import { theme } from '@/src/theme/theme';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title, message, onRetry }: ErrorStateProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.iconShell}>
        <Ionicons name="warning-outline" size={26} color={theme.colors.error} />
      </View>
      <AppText variant="h3" align="center">
        {title ?? t('states.errorTitle')}
      </AppText>
      <AppText variant="body" color={theme.colors.textSecondary} align="center">
        {message}
      </AppText>
      {onRetry ? (
        <AppButton title={t('common.retry')} iconName="refresh-outline" onPress={onRetry} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.xxl,
  },
  iconShell: {
    alignItems: 'center',
    backgroundColor: theme.colors.errorLight,
    borderRadius: theme.radius.full,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
});
