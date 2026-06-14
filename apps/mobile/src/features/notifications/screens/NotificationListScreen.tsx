import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FlatList, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppButton } from '@/src/components/common/AppButton';
import { AppCard } from '@/src/components/common/AppCard';
import { AppText } from '@/src/components/common/AppText';
import { EmptyState } from '@/src/components/feedback/EmptyState';
import { ErrorState } from '@/src/components/feedback/ErrorState';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { PermissionState } from '@/src/components/feedback/PermissionState';
import { AppHeader } from '@/src/components/layout/AppHeader';
import { AppScreen } from '@/src/components/layout/AppScreen';
import { layout } from '@/src/constants/layout';
import { notificationsApi } from '@/src/features/notifications/api/notifications-api';
import { NotificationDto } from '@/src/features/notifications/types';
import { useBottomTabScrollChrome } from '@/src/hooks/useBottomTabScrollChrome';
import { queryKeys } from '@/src/services/api/query-keys';
import { useAuthStore } from '@/src/store/auth-store';
import { theme } from '@/src/theme/theme';
import { permissions } from '@/src/types/permissions';
import { formatDate } from '@/src/utils/formatters';

const query = { page: 1, limit: 30, status: null, type: null, priority: null, search: null };

export function NotificationListScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const handleBottomTabScroll = useBottomTabScrollChrome();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canView = hasPermission(permissions.notification.view);
  const notificationsQuery = useQuery({
    queryKey: queryKeys.notifications(query),
    queryFn: () => notificationsApi.listNotifications(query),
    enabled: canView,
  });
  const markAllReadMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    async onSuccess() {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.notifications(query) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.unreadNotificationCount }),
      ]);
    },
  });

  if (!canView) {
    return (
      <AppScreen>
        <PermissionState />
      </AppScreen>
    );
  }

  return (
    <AppScreen scroll={false} padded={false} contentStyle={styles.screenContent}>
      <View style={styles.content}>
        <AppHeader
          title={t('more.notifications')}
          action={
            <AppButton
              title={t('notifications.markAllRead')}
              variant="ghost"
              fullWidth={false}
              isLoading={markAllReadMutation.isPending}
              onPress={() => markAllReadMutation.mutate()}
            />
          }
        />
        {notificationsQuery.isLoading ? <LoadingState rows={4} /> : null}
        {notificationsQuery.isError ? (
          <ErrorState message={notificationsQuery.error.message} onRetry={() => notificationsQuery.refetch()} />
        ) : null}
        {!notificationsQuery.isLoading && !notificationsQuery.isError ? (
          <FlatList
            data={notificationsQuery.data?.items ?? []}
            keyExtractor={(item) => item.id}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            onScroll={handleBottomTabScroll}
            scrollEventThrottle={16}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <EmptyState
                iconName="notifications-outline"
                title={t('notifications.emptyTitle')}
                message={t('notifications.emptyMessage')}
              />
            }
            renderItem={({ item }) => <NotificationCard notification={item} />}
            refreshing={notificationsQuery.isRefetching}
            onRefresh={notificationsQuery.refetch}
          />
        ) : null}
      </View>
    </AppScreen>
  );
}

function NotificationCard({ notification }: { notification: NotificationDto }) {
  return (
    <AppCard style={[styles.card, notification.isRead ? null : styles.unreadCard]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardCopy}>
          <AppText variant="label" numberOfLines={1}>
            {notification.title}
          </AppText>
          <AppText variant="bodySmall" color={theme.colors.textSecondary} numberOfLines={2}>
            {notification.message}
          </AppText>
        </View>
        {!notification.isRead ? <View style={styles.unreadDot} /> : null}
      </View>
      <AppText variant="caption" color={theme.colors.textMuted}>
        {formatDate(notification.createdAt)}
      </AppText>
    </AppCard>
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
  card: {
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
  },
  unreadCard: {
    borderColor: theme.colors.primary,
  },
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  cardCopy: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  unreadDot: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
    height: 8,
    marginTop: theme.spacing.xs,
    width: 8,
  },
});
