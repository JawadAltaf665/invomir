import { useIdTokenAuthRequest } from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { AppButton } from '@/src/components/common/AppButton';
import { AppText } from '@/src/components/common/AppText';
import { appConfig } from '@/src/config/environment';
import { authApi } from '@/src/features/auth/api/auth-api';
import { useAuthStore } from '@/src/store/auth-store';
import { theme } from '@/src/theme/theme';
import { ApiProblem } from '@/src/types/api';

WebBrowser.maybeCompleteAuthSession();

interface GoogleAuthButtonProps {
  titleKey?: 'auth.continueWithGoogle' | 'auth.signInWithGoogle' | 'auth.signUpWithGoogle';
}

export function GoogleAuthButton({ titleKey = 'auth.continueWithGoogle' }: GoogleAuthButtonProps) {
  const { t } = useTranslation();
  const setSession = useAuthStore((state) => state.setSession);
  const [localError, setLocalError] = useState<string | null>(null);
  const isConfigured = Boolean(appConfig.googleWebClientId);
  const [, result, promptAsync] = useIdTokenAuthRequest({
    webClientId: appConfig.googleWebClientId,
    iosClientId: appConfig.googleIosClientId,
    androidClientId: appConfig.googleAndroidClientId,
    selectAccount: true,
  });
  const googleMutation = useMutation({
    mutationFn: authApi.googleLogin,
    async onSuccess(token) {
      await setSession(token);
      router.replace('/dashboard');
    },
  });

  useEffect(() => {
    if (!result) {
      return;
    }

    if (result.type === 'success') {
      const idToken = result.params.id_token;

      if (!idToken) {
        setLocalError(t('auth.googleMissingToken'));
        return;
      }

      setLocalError(null);
      googleMutation.mutate({ idToken });
      return;
    }

    if (result.type === 'error') {
      setLocalError(result.error?.message ?? t('auth.googleUnavailable'));
    }
  }, [googleMutation, result, t]);

  const apiError = googleMutation.error as ApiProblem | null;
  const errorMessage = apiError?.message ?? localError;

  return (
    <>
      <AppButton
        title={isConfigured ? t(titleKey) : t('auth.googleNotConfigured')}
        iconName="logo-google"
        variant="secondary"
        disabled={!isConfigured || googleMutation.isPending}
        isLoading={googleMutation.isPending}
        onPress={() => {
          setLocalError(null);
          void promptAsync();
        }}
      />
      {errorMessage ? (
        <AppText variant="caption" color={theme.colors.error} align="center">
          {errorMessage}
        </AppText>
      ) : null}
    </>
  );
}
