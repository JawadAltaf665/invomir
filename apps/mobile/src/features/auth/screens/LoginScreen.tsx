import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppButton } from '@/src/components/common/AppButton';
import { AppText } from '@/src/components/common/AppText';
import { ErrorState } from '@/src/components/feedback/ErrorState';
import { AppInput } from '@/src/components/forms/AppInput';
import { AppScreen } from '@/src/components/layout/AppScreen';
import { AppHeader } from '@/src/components/layout/AppHeader';
import { authApi } from '@/src/features/auth/api/auth-api';
import { GoogleAuthButton } from '@/src/features/auth/components/GoogleAuthButton';
import { LoginFormValues, loginSchema } from '@/src/features/auth/validation';
import { useAuthStore } from '@/src/store/auth-store';
import { theme } from '@/src/theme/theme';
import { ApiProblem } from '@/src/types/api';

export function LoginScreen() {
  const { t } = useTranslation();
  const setSession = useAuthStore((state) => state.setSession);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    async onSuccess(token) {
      await setSession(token);
      router.replace('/dashboard');
    },
  });

  const submit = form.handleSubmit((values) => {
    loginMutation.mutate({
      email: values.email.trim(),
      password: values.password,
    });
  });

  const error = loginMutation.error as ApiProblem | null;

  return (
    <AppScreen>
      <AppHeader title={t('auth.loginTitle')} subtitle={t('auth.loginSubtitle')} />
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
        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <AppInput
              label={t('auth.password')}
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              error={fieldState.error?.message ? t(fieldState.error.message) : undefined}
              leftIconName="lock-closed-outline"
              isPassword
              autoComplete="password"
            />
          )}
        />
      </View>
      {error ? <ErrorState message={error.message} /> : null}
      <View style={styles.actions}>
        <GoogleAuthButton titleKey="auth.signInWithGoogle" />
        <AppButton title={t('auth.login')} isLoading={loginMutation.isPending} onPress={submit} />
        <AppButton
          title={t('auth.forgotPassword')}
          variant="ghost"
          onPress={() => router.push('/forgot-password')}
        />
        <AppText variant="bodySmall" color={theme.colors.textSecondary} align="center">
          {t('auth.passwordHint')}
        </AppText>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: theme.spacing.md,
  },
  actions: {
    gap: theme.spacing.sm,
  },
});
