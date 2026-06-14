import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import type { TFunction } from 'i18next';
import { useEffect, useMemo, useState } from 'react';
import { GestureResponderEvent, Platform, Pressable, ScrollView, StyleProp, StyleSheet, useWindowDimensions, View, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

import { AppCard } from '@/src/components/common/AppCard';
import { AppText } from '@/src/components/common/AppText';
import { DashboardMetricCard } from '@/src/components/dashboard/DashboardMetricCard';
import { EmptyState } from '@/src/components/feedback/EmptyState';
import { ErrorState } from '@/src/components/feedback/ErrorState';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { PermissionState } from '@/src/components/feedback/PermissionState';
import { InvoiceCard } from '@/src/components/invoice/InvoiceCard';
import { AppHeader } from '@/src/components/layout/AppHeader';
import { AppScreen } from '@/src/components/layout/AppScreen';
import { layout } from '@/src/constants/layout';
import { dashboardApi } from '@/src/features/dashboard/api/dashboard-api';
import type { DashboardActionItemDto, DashboardDto } from '@/src/features/dashboard/types';
import { queryKeys } from '@/src/services/api/query-keys';
import { useAuthStore } from '@/src/store/auth-store';
import { theme } from '@/src/theme/theme';
import { permissions } from '@/src/types/permissions';
import { formatCount, formatMoney } from '@/src/utils/formatters';

type IconName = keyof typeof Ionicons.glyphMap;
type QuickAction = {
  title: string;
  subtitle: string;
  iconName: IconName;
  tone: 'primary' | 'secondary' | 'neutral' | 'success';
  onPress: () => void;
};

export function DashboardScreen() {
  const { t } = useTranslation();
  const { width } = useWindowDimensions();
  const user = useAuthStore((state) => state.user);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canView = hasPermission(permissions.dashboard.view);
  const useMetricGrid = Platform.OS !== 'web' && width >= layout.tabletBreakpoint;
  const dashboardQuery = useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: dashboardApi.getDashboard,
    enabled: canView,
  });
  const actionItemsQuery = useQuery({
    queryKey: queryKeys.dashboardActionItems,
    queryFn: dashboardApi.getActionItems,
    enabled: canView,
  });
  const actionItems = actionItemsQuery.data?.items ?? [];
  const quickActions = getQuickActions(t, hasPermission);
  const isRefreshingDashboard = dashboardQuery.isRefetching || actionItemsQuery.isRefetching;
  const refreshDashboard = () => {
    void Promise.all([dashboardQuery.refetch(), actionItemsQuery.refetch()]);
  };

  if (!canView) {
    return (
      <AppScreen>
        <PermissionState />
      </AppScreen>
    );
  }

  if (dashboardQuery.isLoading) {
    return (
      <AppScreen>
        <AppHeader title={t('dashboard.title')} />
        <LoadingState rows={4} />
      </AppScreen>
    );
  }

  if (dashboardQuery.isError) {
    return (
      <AppScreen>
        <AppHeader title={t('dashboard.title')} />
        <ErrorState message={dashboardQuery.error.message} onRetry={() => dashboardQuery.refetch()} />
      </AppScreen>
    );
  }

  const dashboard = dashboardQuery.data;

  if (!dashboard) {
    return (
      <AppScreen>
        <EmptyState
          title={t('dashboard.emptyTitle')}
          message={t('dashboard.emptyMessage')}
          actionLabel={t('dashboard.createInvoice')}
          onAction={() => router.push('/invoices/new')}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen contentStyle={styles.screenContent}>
      <AppHeader
        title={t('dashboard.greeting', { name: user?.firstName ?? t('common.appName') })}
        subtitle={t('dashboard.subtitle', { currency: dashboard.currency })}
        action={
          <Pressable
            accessibilityLabel={t('common.refresh')}
            accessibilityRole="button"
            disabled={isRefreshingDashboard}
            hitSlop={10}
            onPress={refreshDashboard}
            style={({ pressed }) => [
              styles.refreshButton,
              (pressed || isRefreshingDashboard) ? styles.pressed : null,
            ]}
          >
            <Ionicons name="refresh-outline" size={19} color={theme.colors.primary} />
          </Pressable>
        }
      />

      {actionItems.length > 0 ? (
        <ActionCenterCarousel title={t('dashboard.actionCenter')} items={actionItems} />
      ) : null}

      {useMetricGrid ? (
        <View style={styles.metricsGrid}>{renderMetricCards(dashboard, t, styles.metricGridCard)}</View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.metricsRail}>
          {renderMetricCards(dashboard, t)}
        </ScrollView>
      )}

      <View style={styles.section}>
        <SectionTitle title={t('dashboard.quickActions')} />
        <View style={styles.stack}>
          {quickActions.map((action) => (
            <QuickActionTile key={action.title} {...action} />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <SectionTitle title={t('dashboard.invoiceStatus')} />
        <View style={styles.statusGrid}>
          <StatusCountCard
            label={t('invoices.statuses.draft')}
            count={dashboard.invoiceCounts.draft}
            iconName="create-outline"
            onPress={() => router.push('/invoices?status=draft')}
          />
          <StatusCountCard
            label={t('invoices.statuses.sent')}
            count={dashboard.invoiceCounts.sent}
            iconName="send-outline"
            onPress={() => router.push('/invoices?status=sent')}
          />
          <StatusCountCard
            label={t('invoices.statuses.viewed')}
            count={dashboard.invoiceCounts.viewed}
            iconName="eye-outline"
            onPress={() => router.push('/invoices?status=viewed')}
          />
          <StatusCountCard
            label={t('invoices.statuses.overdue')}
            count={dashboard.invoiceCounts.overdue}
            iconName="alert-circle-outline"
            onPress={() => router.push('/invoices?status=overdue')}
          />
        </View>
      </View>

      <View style={styles.section}>
        <SectionTitle title={t('dashboard.recentInvoices')} />
        {dashboard.recentInvoices.length > 0 ? (
          dashboard.recentInvoices.map((invoice) => (
            <InvoiceCard
              key={invoice.id}
              invoice={{ ...invoice, ratesUpdatedAt: null }}
              onPress={() => router.push(`/invoices/${invoice.id}`)}
            />
          ))
        ) : (
          <EmptyState title={t('invoices.emptyTitle')} message={t('invoices.emptyMessage')} />
        )}
      </View>

      <View style={styles.section}>
        <SectionTitle title={t('dashboard.topClients')} />
        {dashboard.topClients.length > 0 ? (
          dashboard.topClients.map((client) => (
            <AppCard key={client.id} style={styles.topClient}>
              <View style={styles.clientRank}>
                <Ionicons name="business-outline" size={17} color={theme.colors.primary} />
              </View>
              <View style={styles.topClientCopy}>
                <AppText variant="label" numberOfLines={1}>
                  {client.name}
                </AppText>
                <AppText variant="caption" color={theme.colors.textSecondary}>
                  {formatCount(client.invoiceCount, 'invoice', 'invoices')}
                </AppText>
              </View>
              <AppText variant="label" numberOfLines={1} style={styles.topClientAmount}>
                {formatMoney(client.revenue, dashboard.currency)}
              </AppText>
            </AppCard>
          ))
        ) : (
          <EmptyState title={t('clients.emptyTitle')} message={t('clients.emptyMessage')} />
        )}
      </View>
    </AppScreen>
  );
}

function renderMetricCards(
  dashboard: DashboardDto,
  t: TFunction,
  metricStyle?: StyleProp<ViewStyle>,
) {
  return [
    <DashboardMetricCard
      key="revenue"
      label={t('dashboard.totalRevenue')}
      value={formatMoney(dashboard.revenue.allTime, dashboard.currency)}
      helper={t('dashboard.thisMonth')}
      iconName="trending-up-outline"
      style={metricStyle}
    />,
    <DashboardMetricCard
      key="outstanding"
      label={t('dashboard.outstanding')}
      value={formatMoney(dashboard.outstanding, dashboard.currency)}
      iconName="time-outline"
      tone="warning"
      style={metricStyle}
    />,
    <DashboardMetricCard
      key="overdue"
      label={t('dashboard.overdue')}
      value={formatMoney(dashboard.overdue, dashboard.currency)}
      iconName="alert-circle-outline"
      tone="danger"
      style={metricStyle}
    />,
    <DashboardMetricCard
      key="paid"
      label={t('dashboard.paidInvoices')}
      value={String(dashboard.invoiceCounts.paid)}
      helper={formatCount(dashboard.invoiceCounts.paid, 'invoice', 'invoices')}
      iconName="checkmark-done-outline"
      tone="success"
      style={metricStyle}
    />,
  ];
}

function SectionTitle({ title }: { title: string }) {
  return (
    <AppText variant="h3" style={styles.sectionTitle}>
      {title}
    </AppText>
  );
}

function ActionCenterCarousel({ title, items }: { title: string; items: readonly DashboardActionItemDto[] }) {
  const [hiddenIds, setHiddenIds] = useState<readonly string[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const visibleItems = useMemo(
    () => items.filter((item) => !hiddenIds.includes(item.id)),
    [hiddenIds, items],
  );
  const activeItem = visibleItems[activeIndex] ?? visibleItems[0] ?? null;
  const progress = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * 8 }],
  }));

  useEffect(() => {
    if (activeIndex >= visibleItems.length) {
      setActiveIndex(0);
    }
  }, [activeIndex, visibleItems.length]);

  useEffect(() => {
    if (visibleItems.length <= 1) {
      return;
    }

    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % visibleItems.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [visibleItems.length]);

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(1, { duration: 260 });
  }, [activeItem?.id, progress]);

  if (!activeItem) {
    return null;
  }

  const palette = getActionItemPalette(activeItem.type);
  const canPress = Boolean(activeItem.actionUrl);

  const dismiss = (event: GestureResponderEvent) => {
    event.stopPropagation();
    setHiddenIds((current) => [...current, activeItem.id]);
  };

  return (
    <View style={styles.section}>
      <SectionTitle title={title} />
      <Animated.View style={animatedStyle}>
        <Pressable
          accessibilityRole={canPress ? 'button' : undefined}
          disabled={!canPress}
          onPress={canPress ? () => router.push(toMobileHref(activeItem.actionUrl ?? '')) : undefined}
          style={({ pressed }) => [
            styles.actionBanner,
            { backgroundColor: palette.background, borderColor: palette.border },
            pressed && canPress ? styles.pressed : null,
          ]}
        >
          <View style={[styles.actionBannerIcon, { backgroundColor: theme.colors.surface }]}>
            <Ionicons name={palette.iconName} size={18} color={palette.foreground} />
          </View>
          <View style={styles.actionBannerCopy}>
            <AppText variant="label" numberOfLines={1}>
              {activeItem.title}
            </AppText>
            <AppText variant="caption" color={theme.colors.textSecondary} numberOfLines={2}>
              {activeItem.message}
            </AppText>
          </View>
          {activeItem.actionLabel && activeItem.actionUrl ? (
            <View style={styles.actionBannerAction}>
              <AppText variant="caption" color={palette.foreground} numberOfLines={1}>
                {activeItem.actionLabel}
              </AppText>
              <Ionicons name="chevron-forward" size={15} color={palette.foreground} />
            </View>
          ) : null}
          <Pressable
            accessibilityRole="button"
            hitSlop={10}
            onPress={dismiss}
            style={({ pressed }) => [styles.actionBannerClose, pressed ? styles.pressed : null]}
          >
            <Ionicons name="close" size={14} color={palette.foreground} />
          </Pressable>
        </Pressable>
      </Animated.View>
      {visibleItems.length > 1 ? (
        <View style={styles.bannerDots}>
          {visibleItems.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.bannerDot,
                index === activeIndex ? { backgroundColor: theme.colors.primary, width: 16 } : null,
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function getActionItemPalette(type: string): {
  background: string;
  border: string;
  foreground: string;
  iconName: IconName;
} {
  if (type === 'critical') {
    return {
      background: theme.colors.errorLight,
      border: theme.colors.errorLight,
      foreground: theme.colors.error,
      iconName: 'alert-circle-outline',
    };
  }

  if (type === 'warning') {
    return {
      background: theme.colors.warningLight,
      border: theme.colors.warningLight,
      foreground: theme.colors.warning,
      iconName: 'warning-outline',
    };
  }

  if (type === 'success') {
    return {
      background: theme.colors.successLight,
      border: theme.colors.successLight,
      foreground: theme.colors.success,
      iconName: 'checkmark-circle-outline',
    };
  }

  return {
    background: theme.colors.infoLight,
    border: theme.colors.infoLight,
    foreground: theme.colors.info,
    iconName: 'information-circle-outline',
  };
}

function getQuickActions(t: TFunction, hasPermission: (permission: string) => boolean): QuickAction[] {
  return [
    hasPermission(permissions.invoice.create)
      ? {
          title: t('dashboard.createInvoice'),
          subtitle: t('tabs.invoices'),
          iconName: 'document-text-outline' as IconName,
          tone: 'primary' as const,
          onPress: () => router.push('/invoices/new'),
        }
      : null,
    hasPermission(permissions.client.create)
      ? {
          title: t('dashboard.addClient'),
          subtitle: t('tabs.clients'),
          iconName: 'person-add-outline' as IconName,
          tone: 'secondary' as const,
          onPress: () => router.push('/clients/new'),
        }
      : null,
    hasPermission(permissions.report.view)
      ? {
          title: t('dashboard.viewReports'),
          subtitle: t('tabs.reports'),
          iconName: 'bar-chart-outline' as IconName,
          tone: 'neutral' as const,
          onPress: () => router.push('/reports'),
        }
      : null,
    hasPermission(permissions.payment.view)
      ? {
          title: t('dashboard.recordPayment'),
          subtitle: t('dashboard.payments'),
          iconName: 'card-outline' as IconName,
          tone: 'success' as const,
          onPress: () => router.push('/payments'),
        }
      : null,
  ].filter((action): action is QuickAction => Boolean(action));
}

function QuickActionTile({
  title,
  subtitle,
  iconName,
  tone,
  onPress,
}: {
  title: string;
  subtitle: string;
  iconName: IconName;
  tone: 'primary' | 'secondary' | 'neutral' | 'success';
  onPress: () => void;
}) {
  const palette = getQuickActionPalette(tone);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.quickActionTile, pressed ? styles.pressed : null]}>
      <View style={[styles.quickActionIcon, { backgroundColor: palette.background }]}>
        <Ionicons name={iconName} size={19} color={palette.foreground} />
      </View>
      <View style={styles.quickActionCopy}>
        <AppText variant="label" numberOfLines={1}>
          {title}
        </AppText>
        <AppText variant="caption" color={theme.colors.textSecondary} numberOfLines={1}>
          {subtitle}
        </AppText>
      </View>
      <Ionicons name="chevron-forward" size={17} color={theme.colors.textMuted} />
    </Pressable>
  );
}

function StatusCountCard({
  label,
  count,
  iconName,
  onPress,
}: {
  label: string;
  count: number;
  iconName: IconName;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.statusCard, pressed ? styles.pressed : null]}>
      <Ionicons name={iconName} size={18} color={theme.colors.primary} />
      <View style={styles.statusCopy}>
        <AppText variant="h3">{String(count)}</AppText>
        <AppText variant="caption" color={theme.colors.textSecondary} numberOfLines={1}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

function getQuickActionPalette(tone: 'primary' | 'secondary' | 'neutral' | 'success') {
  if (tone === 'secondary' || tone === 'success') {
    return {
      background: theme.colors.successLight,
      foreground: theme.colors.success,
    };
  }

  if (tone === 'neutral') {
    return {
      background: theme.colors.surfaceMuted,
      foreground: theme.colors.info,
    };
  }

  return {
    background: theme.colors.primaryLight,
    foreground: theme.colors.primary,
  };
}

function toMobileHref(actionUrl: string): string {
  if (actionUrl.startsWith('/app/payments')) {
    return '/payments';
  }

  if (actionUrl.startsWith('/app/subscriptions') || actionUrl.startsWith('/app/billing')) {
    return '/subscriptions';
  }

  if (actionUrl.startsWith('/app/invoices')) {
    return '/invoices';
  }

  if (actionUrl.startsWith('/app/settings')) {
    return '/settings';
  }

  return '/settings';
}

const styles = StyleSheet.create({
  screenContent: {
    gap: theme.spacing.md,
  },
  section: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    lineHeight: 24,
  },
  stack: {
    gap: theme.spacing.sm,
  },
  refreshButton: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  actionBanner: {
    alignItems: 'center',
    borderRadius: theme.radius.xl,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minHeight: 82,
    padding: theme.spacing.sm,
    paddingRight: theme.spacing.xs,
  },
  actionBannerIcon: {
    alignItems: 'center',
    borderRadius: theme.radius.full,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  actionBannerCopy: {
    flex: 1,
    gap: 2,
  },
  actionBannerAction: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
    maxWidth: 102,
  },
  actionBannerClose: {
    alignItems: 'center',
    borderRadius: theme.radius.full,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  bannerDots: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xxs,
    justifyContent: 'center',
  },
  bannerDot: {
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.full,
    height: 5,
    width: 5,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  metricGridCard: {
    width: '48%',
  },
  metricsRail: {
    gap: theme.spacing.sm,
    paddingRight: theme.spacing.md,
  },
  quickActionTile: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.large,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    minHeight: 58,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    ...(theme.shadows.card ?? {}),
  },
  quickActionIcon: {
    alignItems: 'center',
    borderRadius: theme.radius.full,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  quickActionCopy: {
    flex: 1,
    gap: 2,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  statusCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.large,
    borderWidth: 1,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
    width: '48%',
  },
  statusCopy: {
    flex: 1,
    gap: 2,
  },
  topClient: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
  },
  clientRank: {
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.full,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  topClientCopy: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  topClientAmount: {
    flexShrink: 1,
    maxWidth: 120,
    textAlign: 'right',
  },
  pressed: {
    opacity: 0.86,
    transform: [{ scale: 0.99 }],
  },
});
