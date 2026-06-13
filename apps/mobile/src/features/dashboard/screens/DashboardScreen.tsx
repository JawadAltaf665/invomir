import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import type { TFunction } from 'i18next';
import { Platform, Pressable, ScrollView, StyleProp, StyleSheet, useWindowDimensions, View, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppCard } from '@/src/components/common/AppCard';
import { AppText } from '@/src/components/common/AppText';
import { DashboardActionItemCard } from '@/src/components/dashboard/DashboardActionItemCard';
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
import type { DashboardDto } from '@/src/features/dashboard/types';
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

  const actionItems = actionItemsQuery.data?.items ?? [];
  const quickActions = getQuickActions(t, hasPermission);

  return (
    <AppScreen contentStyle={styles.screenContent}>
      <AppHeader
        title={t('dashboard.greeting', { name: user?.firstName ?? t('common.appName') })}
        subtitle={t('dashboard.subtitle', { currency: dashboard.currency })}
      />

      {actionItems.length > 0 ? (
        <View style={styles.section}>
          <SectionTitle title={t('dashboard.actionCenter')} />
          <View style={styles.stack}>
            {actionItems.map((item) => {
              const actionUrl = item.actionUrl;

              return (
                <DashboardActionItemCard
                  key={item.id}
                  item={item}
                  onPress={actionUrl ? () => router.push(toMobileHref(actionUrl)) : undefined}
                />
              );
            })}
          </View>
        </View>
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
