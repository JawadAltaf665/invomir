import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppButton } from '@/src/components/common/AppButton';
import { ClientCard } from '@/src/components/client/ClientCard';
import { EmptyState } from '@/src/components/feedback/EmptyState';
import { ErrorState } from '@/src/components/feedback/ErrorState';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { PermissionState } from '@/src/components/feedback/PermissionState';
import { SearchInput } from '@/src/components/forms/SearchInput';
import { AppHeader } from '@/src/components/layout/AppHeader';
import { AppScreen } from '@/src/components/layout/AppScreen';
import { layout } from '@/src/constants/layout';
import { clientsApi } from '@/src/features/clients/api/clients-api';
import { useBottomTabScrollChrome } from '@/src/hooks/useBottomTabScrollChrome';
import { queryKeys } from '@/src/services/api/query-keys';
import { useAuthStore } from '@/src/store/auth-store';
import { theme } from '@/src/theme/theme';
import { permissions } from '@/src/types/permissions';

const pageSizeIncrement = 10;

export function ClientListScreen() {
  const { t } = useTranslation();
  const handleBottomTabScroll = useBottomTabScrollChrome();
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleLimit, setVisibleLimit] = useState(pageSizeIncrement);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canView = hasPermission(permissions.client.view);
  const query = useMemo(
    () => ({
      q: searchTerm,
      page: 1,
      limit: visibleLimit,
    }),
    [searchTerm, visibleLimit],
  );
  const clientsQuery = useQuery({
    queryKey: queryKeys.clients(query),
    queryFn: () => clientsApi.listClients(query),
    enabled: canView,
  });

  if (!canView) {
    return (
      <AppScreen>
        <PermissionState />
      </AppScreen>
    );
  }

  const clients = clientsQuery.data?.items ?? [];
  const totalClients = clientsQuery.data?.totalCount ?? clients.length;
  const canViewMore = clients.length < totalClients;

  return (
    <AppScreen scroll={false} padded={false} contentStyle={styles.screenContent}>
      <View style={styles.content}>
        <AppHeader
          title={t('clients.title')}
          action={
            <AppButton
              title={t('common.add')}
              iconName="add-outline"
              fullWidth={false}
              onPress={() => router.push('/clients/new')}
            />
          }
        />
        <SearchInput
          label={t('common.search')}
          placeholder={t('clients.searchPlaceholder')}
          value={searchTerm}
          onChangeText={(value) => {
            setSearchTerm(value);
            setVisibleLimit(pageSizeIncrement);
          }}
        />
        {clientsQuery.isLoading ? <LoadingState rows={4} /> : null}
        {clientsQuery.isError ? (
          <ErrorState message={clientsQuery.error.message} onRetry={() => clientsQuery.refetch()} />
        ) : null}
        {!clientsQuery.isLoading && !clientsQuery.isError ? (
          <FlatList
            data={clients}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            onScroll={handleBottomTabScroll}
            scrollEventThrottle={16}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListFooterComponent={
              canViewMore ? (
                <View style={styles.footer}>
                  <AppButton
                    title={t('common.viewTenMore')}
                    iconName="chevron-down-outline"
                    variant="secondary"
                    isLoading={clientsQuery.isFetching && !clientsQuery.isRefetching}
                    onPress={() => setVisibleLimit((current) => current + pageSizeIncrement)}
                  />
                </View>
              ) : null
            }
            ListEmptyComponent={
              <EmptyState
                iconName="people-outline"
                title={t('clients.emptyTitle')}
                message={t('clients.emptyMessage')}
                actionLabel={t('clients.add')}
                onAction={() => router.push('/clients/new')}
              />
            }
            renderItem={({ item }) => (
              <ClientCard client={item} onPress={() => router.push(`/clients/${item.id}`)} />
            )}
            refreshing={clientsQuery.isRefetching}
            onRefresh={clientsQuery.refetch}
          />
        ) : null}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
    minHeight: 0,
  },
  content: {
    flex: 1,
    gap: theme.spacing.md,
    minHeight: 0,
    padding: theme.spacing.md,
  },
  list: {
    flex: 1,
    minHeight: 0,
  },
  listContent: {
    paddingBottom: layout.bottomTabOverlayHeight,
  },
  separator: {
    height: theme.spacing.sm,
  },
  footer: {
    paddingTop: theme.spacing.xs,
  },
});
