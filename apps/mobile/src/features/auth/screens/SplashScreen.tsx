import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppText } from '@/src/components/common/AppText';
import { AppScreen } from '@/src/components/layout/AppScreen';
import { theme } from '@/src/theme/theme';
import { useAuthStore } from '@/src/store/auth-store';

export function SplashScreen() {
  const { t } = useTranslation();
  const status = useAuthStore((state) => state.status);

  if (status === 'authenticated') {
    return <Redirect href="/dashboard" />;
  }

  if (status === 'anonymous') {
    return <Redirect href="/welcome" />;
  }

  return (
    <AppScreen scroll={false} contentStyle={styles.content}>
      <View style={styles.logo}>
        <AppText variant="h1" color={theme.colors.white}>
          IM
        </AppText>
      </View>
      <AppText variant="h1">{t('common.appName')}</AppText>
      <ActivityIndicator color={theme.colors.primary} />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.large,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
});
