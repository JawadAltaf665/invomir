import { ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PropsWithChildren, useEffect, useMemo } from 'react';
import { I18nextProvider } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { OfflineSyncBanner } from '@/src/components/feedback/OfflineSyncBanner';
import { configureNetworkManager } from '@/src/services/network/network-manager';
import { i18n } from '@/src/translations/i18n';
import { navigationTheme } from '@/src/theme/navigation-theme';
import { setUnauthorizedHandler } from '@/src/services/api/api-client';
import { useAuthStore } from '@/src/store/auth-store';

export function AppProviders({ children }: PropsWithChildren) {
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const clearLocalSession = useAuthStore((state) => state.clearLocalSession);
  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 30_000,
            gcTime: 5 * 60_000,
          },
        },
      }),
    [],
  );

  useEffect(() => {
    const unsubscribeNetwork = configureNetworkManager();

    setUnauthorizedHandler(() => {
      void clearLocalSession();
      queryClient.clear();
    });

    void restoreSession();

    return () => {
      unsubscribeNetwork();
      setUnauthorizedHandler(null);
    };
  }, [clearLocalSession, queryClient, restoreSession]);

  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <NavigationThemeProvider value={navigationTheme}>
          <View style={styles.root}>
            {children}
            <OfflineSyncBanner />
          </View>
        </NavigationThemeProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
