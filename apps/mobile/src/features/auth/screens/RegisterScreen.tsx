import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppButton } from '@/src/components/common/AppButton';
import { ErrorState } from '@/src/components/feedback/ErrorState';
import { AppInput } from '@/src/components/forms/AppInput';
import { FilterChip } from '@/src/components/forms/FilterChip';
import { AppScreen } from '@/src/components/layout/AppScreen';
import { AppHeader } from '@/src/components/layout/AppHeader';
import { supportedCurrencies } from '@/src/constants/currencies';
import { authApi } from '@/src/features/auth/api/auth-api';
import { GoogleAuthButton } from '@/src/features/auth/components/GoogleAuthButton';
import { RegisterFormValues, registerSchema } from '@/src/features/auth/validation';
import { useAuthStore } from '@/src/store/auth-store';
import { theme } from '@/src/theme/theme';
import { ApiProblem } from '@/src/types/api';

export function RegisterScreen() {
  const { t } = useTranslation();
  const setSession = useAuthStore((state) => state.setSession);
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      businessName: '',
      email: '',
      password: '',
      currency: 'USD',
      taxPercent: 0,
    },
  });
  const registerMutation = useMutation({
    mutationFn: authApi.register,
    async onSuccess(token) {
      await setSession(token);
      router.replace('/dashboard');
    },
  });

  const submit = form.handleSubmit((values) => {
    registerMutation.mutate({
      ...values,
      email: values.email.trim(),
      businessName: values.businessName.trim(),
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
    });
  });

  const error = registerMutation.error as ApiProblem | null;

  return (
    <AppScreen>
      <AppHeader title={t('auth.registerTitle')} subtitle={t('auth.registerSubtitle')} />
      <View style={styles.form}>
        <Controller
          control={form.control}
          name="firstName"
          render={({ field, fieldState }) => (
            <AppInput
              label={t('auth.firstName')}
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              error={fieldState.error?.message ? t(fieldState.error.message) : undefined}
              leftIconName="person-outline"
              autoComplete="given-name"
            />
          )}
        />
        <Controller
          control={form.control}
          name="lastName"
          render={({ field, fieldState }) => (
            <AppInput
              label={t('auth.lastName')}
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              error={fieldState.error?.message ? t(fieldState.error.message) : undefined}
              leftIconName="person-outline"
              autoComplete="family-name"
            />
          )}
        />
        <Controller
          control={form.control}
          name="businessName"
          render={({ field, fieldState }) => (
            <AppInput
              label={t('auth.businessName')}
              value={field.value}
              onBlur={field.onBlur}
              onChangeText={field.onChange}
              error={fieldState.error?.message ? t(fieldState.error.message) : undefined}
              leftIconName="business-outline"
            />
          )}
        />
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
              autoComplete="new-password"
            />
          )}
        />
        <Controller
          control={form.control}
          name="currency"
          render={({ field }) => (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {supportedCurrencies.map((currency) => (
                <FilterChip
                  key={currency}
                  label={currency}
                  selected={field.value === currency}
                  onPress={() => field.onChange(currency)}
                />
              ))}
            </ScrollView>
          )}
        />
        <Controller
          control={form.control}
          name="taxPercent"
          render={({ field, fieldState }) => (
            <AppInput
              label={t('auth.taxPercent')}
              value={String(field.value)}
              onBlur={field.onBlur}
              onChangeText={(value) => field.onChange(Number(value) || 0)}
              error={fieldState.error?.message ? t(fieldState.error.message) : undefined}
              leftIconName="calculator-outline"
              keyboardType="decimal-pad"
            />
          )}
        />
      </View>
      {error ? <ErrorState message={error.message} /> : null}
      <GoogleAuthButton titleKey="auth.signUpWithGoogle" />
      <AppButton title={t('auth.register')} isLoading={registerMutation.isPending} onPress={submit} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: theme.spacing.md,
  },
  chips: {
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.xs,
  },
});
