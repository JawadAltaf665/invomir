import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppButton } from '@/src/components/common/AppButton';
import { AppText } from '@/src/components/common/AppText';
import { AppCard } from '@/src/components/common/AppCard';
import { ErrorState } from '@/src/components/feedback/ErrorState';
import { AppInput } from '@/src/components/forms/AppInput';
import { AppHeader } from '@/src/components/layout/AppHeader';
import { AppScreen } from '@/src/components/layout/AppScreen';
import { authApi } from '@/src/features/auth/api/auth-api';
import { ForgotPasswordFormValues, forgotPasswordSchema } from '@/src/features/auth/validation';
import { theme } from '@/src/theme/theme';
import { ApiProblem } from '@/src/types/api';

export function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });
  const forgotMutation = useMutation({
    mutationFn: authApi.forgotPassword,
  });

  const submit = form.handleSubmit((values) => {
    forgotMutation.mutate({ email: values.email.trim() });
  });

  const error = forgotMutation.error as ApiProblem | null;

  return (
    <AppScreen>
      <AppHeader title={t('auth.forgotTitle')} subtitle={t('auth.forgotSubtitle')} />
      <View style={styles.form}>
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <AppInput
              label={t('auth.email')}
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              error={fieldState.error?.message ? t(fieldState.error.message) : undefined}
              leftIconName="mail-outline"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          )}
        />
      </View>
      {forgotMutation.isSuccess ? (
        <AppCard>
          <AppText variant="body" color={theme.colors.success}>
            {t('auth.forgotSuccess')}
          </AppText>
        </AppCard>
      ) : null}
      {error ? <ErrorState message={error.message} /> : null}
      <AppButton title={t('common.continue')} isLoading={forgotMutation.isPending} onPress={submit} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: theme.spacing.md,
  },
});
