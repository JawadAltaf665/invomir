import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { Alert, Linking, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppButton } from '@/src/components/common/AppButton';
import { AppCard } from '@/src/components/common/AppCard';
import { AppText } from '@/src/components/common/AppText';
import { MoneyText } from '@/src/components/common/MoneyText';
import { EmptyState } from '@/src/components/feedback/EmptyState';
import { ErrorState } from '@/src/components/feedback/ErrorState';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { PermissionState } from '@/src/components/feedback/PermissionState';
import { FilterChip } from '@/src/components/forms/FilterChip';
import { AppHeader } from '@/src/components/layout/AppHeader';
import { AppScreen } from '@/src/components/layout/AppScreen';
import { subscriptionsApi } from '@/src/features/subscriptions/api/subscriptions-api';
import {
  CurrentSubscriptionDto,
  SubscriptionFeaturesDto,
  SubscriptionInterval,
  SubscriptionPlanDto,
} from '@/src/features/subscriptions/types';
import { queryKeys } from '@/src/services/api/query-keys';
import { useAuthStore } from '@/src/store/auth-store';
import { theme } from '@/src/theme/theme';
import { permissions } from '@/src/types/permissions';
import { formatDate } from '@/src/utils/formatters';
import { useState } from 'react';

const intervalOptions: readonly SubscriptionInterval[] = ['month', 'year'];
const featureOrder: readonly (keyof SubscriptionFeaturesDto)[] = [
  'onlinePayments',
  'reminders',
  'reportsExport',
  'teamSeats',
];

export function SubscriptionScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canView = hasPermission(permissions.subscription.view);
  const canManage = hasPermission(permissions.subscription.manage);
  const [interval, setInterval] = useState<SubscriptionInterval>('month');
  const [activePlan, setActivePlan] = useState<string | null>(null);
  const subscriptionQuery = useQuery({
    queryKey: queryKeys.subscription,
    queryFn: subscriptionsApi.getCurrentSubscription,
    enabled: canView,
  });
  const plansQuery = useQuery({
    queryKey: queryKeys.subscriptionPlans,
    queryFn: subscriptionsApi.getPlans,
    enabled: canView,
  });
  const checkoutMutation = useMutation({
    mutationFn: ({ plan, interval: checkoutInterval }: { plan: string; interval: SubscriptionInterval }) =>
      subscriptionsApi.createCheckout({ plan, interval: checkoutInterval }),
    async onSuccess(checkout) {
      await openExternalUrl(checkout.checkoutUrl);
    },
    onSettled() {
      setActivePlan(null);
    },
  });
  const cancelMutation = useMutation({
    mutationFn: subscriptionsApi.cancelSubscription,
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: queryKeys.subscription });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboardActionItems });
    },
  });

  if (!canView) {
    return (
      <AppScreen>
        <PermissionState />
      </AppScreen>
    );
  }

  const subscription = subscriptionQuery.data;
  const plans = plansQuery.data?.plans ?? [];
  const isLoading = subscriptionQuery.isLoading || plansQuery.isLoading;
  const canCancel = Boolean(
    subscription?.stripeSubscriptionId &&
      subscription.status !== 'cancelled' &&
      !subscription.cancelAtPeriodEnd,
  );

  const startCheckout = (plan: SubscriptionPlanDto) => {
    if (!canManage || checkoutMutation.isPending) {
      return;
    }

    setActivePlan(plan.plan);
    checkoutMutation.mutate({ plan: plan.plan, interval });
  };

  const confirmCancellation = () => {
    Alert.alert(t('subscriptions.cancelTitle'), t('subscriptions.cancelMessage'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('subscriptions.cancelConfirm'),
        style: 'destructive',
        onPress: () => cancelMutation.mutate(),
      },
    ]);
  };

  return (
    <AppScreen contentStyle={styles.content}>
      <AppHeader
        title={t('subscriptions.title')}
        subtitle={t('subscriptions.subtitle')}
        action={
          <AppButton
            title={t('common.refresh')}
            iconName="refresh-outline"
            variant="ghost"
            fullWidth={false}
            onPress={() => {
              void subscriptionQuery.refetch();
              void plansQuery.refetch();
            }}
          />
        }
      />

      {isLoading ? <LoadingState rows={4} /> : null}
      {subscriptionQuery.isError ? (
        <ErrorState message={subscriptionQuery.error.message} onRetry={() => subscriptionQuery.refetch()} />
      ) : null}
      {plansQuery.isError ? <ErrorState message={plansQuery.error.message} onRetry={() => plansQuery.refetch()} /> : null}
      {checkoutMutation.isError ? <ErrorState message={checkoutMutation.error.message} /> : null}
      {cancelMutation.isError ? <ErrorState message={cancelMutation.error.message} /> : null}

      {subscription ? (
        <>
          <CurrentPlanCard subscription={subscription} />

          {subscription.status === 'trialing' && subscription.trialEndsAt ? (
            <AppCard style={styles.trialCard}>
              <View style={styles.inlineIcon}>
                <Ionicons name="sparkles-outline" size={18} color={theme.colors.primary} />
              </View>
              <View style={styles.flexCopy}>
                <AppText variant="label">{t('subscriptions.trialTitle')}</AppText>
                <AppText variant="bodySmall" color={theme.colors.textSecondary}>
                  {t('subscriptions.trialMessage', {
                    days: subscription.trialDaysRemaining ?? 0,
                    date: formatDate(subscription.trialEndsAt),
                  })}
                </AppText>
              </View>
            </AppCard>
          ) : null}

          <UsageCard subscription={subscription} />

          <AppCard style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={styles.flexCopy}>
                <AppText variant="h3">{t('subscriptions.plansTitle')}</AppText>
                <AppText variant="bodySmall" color={theme.colors.textSecondary}>
                  {t('subscriptions.plansSubtitle')}
                </AppText>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {intervalOptions.map((option) => (
                <FilterChip
                  key={option}
                  label={t(`subscriptions.intervals.${option}`)}
                  selected={interval === option}
                  onPress={() => setInterval(option)}
                />
              ))}
            </ScrollView>
            {plans.length > 0 ? (
              plans.map((plan) => (
                <PlanCard
                  key={plan.plan}
                  plan={plan}
                  currentPlan={subscription.plan}
                  interval={interval}
                  canManage={canManage}
                  isLoading={checkoutMutation.isPending && activePlan === plan.plan}
                  onCheckout={() => startCheckout(plan)}
                />
              ))
            ) : (
              <EmptyState
                iconName="albums-outline"
                title={t('subscriptions.noPlansTitle')}
                message={t('subscriptions.noPlansMessage')}
              />
            )}
          </AppCard>

          <AppCard style={styles.card}>
            <AppText variant="h3">{t('subscriptions.billingActionsTitle')}</AppText>
            <AppText variant="bodySmall" color={theme.colors.textSecondary}>
              {subscription.cancelAtPeriodEnd
                ? t('subscriptions.cancellationScheduled', {
                    date: subscription.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : t('common.unknown'),
                  })
                : t('subscriptions.billingActionsSubtitle')}
            </AppText>
            {canManage ? (
              <AppButton
                title={t('subscriptions.cancelPlan')}
                iconName="ban-outline"
                variant="danger"
                disabled={!canCancel}
                isLoading={cancelMutation.isPending}
                onPress={confirmCancellation}
              />
            ) : (
              <Notice message={t('subscriptions.managePermission')} />
            )}
          </AppCard>
        </>
      ) : null}
    </AppScreen>
  );
}

function CurrentPlanCard({ subscription }: { subscription: CurrentSubscriptionDto }) {
  const { t } = useTranslation();

  return (
    <AppCard style={styles.currentCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.flexCopy}>
          <AppText variant="caption" color={theme.colors.textMuted}>
            {t('subscriptions.currentPlan')}
          </AppText>
          <AppText variant="h2">{formatPlanName(subscription.plan)}</AppText>
        </View>
        <View style={styles.statusPill}>
          <AppText variant="caption" color={theme.colors.primaryDark}>
            {t(`subscriptions.statuses.${subscription.status}`, { defaultValue: subscription.status })}
          </AppText>
        </View>
      </View>
      <View style={styles.priceRow}>
        <View>
          <MoneyText amount={subscription.pricePerMonth} currency={subscription.currency} variant="h2" />
          <AppText variant="caption" color={theme.colors.textSecondary}>
            {t('subscriptions.perMonth')}
          </AppText>
        </View>
        <View style={styles.priceDivider} />
        <View>
          <MoneyText amount={subscription.pricePerYear} currency={subscription.currency} variant="h2" />
          <AppText variant="caption" color={theme.colors.textSecondary}>
            {t('subscriptions.perYear')}
          </AppText>
        </View>
      </View>
      {subscription.currentPeriodEnd ? (
        <AppText variant="bodySmall" color={theme.colors.textSecondary}>
          {t('subscriptions.renewsOn', { date: formatDate(subscription.currentPeriodEnd) })}
        </AppText>
      ) : null}
    </AppCard>
  );
}

function UsageCard({ subscription }: { subscription: CurrentSubscriptionDto }) {
  const { t } = useTranslation();

  return (
    <AppCard style={styles.card}>
      <AppText variant="h3">{t('subscriptions.usageTitle')}</AppText>
      <UsageRow label={t('subscriptions.clients')} used={subscription.usage.clients.used} limit={subscription.usage.clients.limit} />
      <UsageRow
        label={t('subscriptions.invoicesThisMonth')}
        used={subscription.usage.invoicesThisMonth.used}
        limit={subscription.usage.invoicesThisMonth.limit}
      />
    </AppCard>
  );
}

function UsageRow({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const { t } = useTranslation();
  const percentage = limit ? Math.min(100, Math.round((used / limit) * 100)) : 100;

  return (
    <View style={styles.usageRow}>
      <View style={styles.sectionHeader}>
        <AppText variant="label">{label}</AppText>
        <AppText variant="caption" color={theme.colors.textSecondary}>
          {limit === null ? t('subscriptions.unlimitedUsage', { used }) : t('subscriptions.limitedUsage', { used, limit })}
        </AppText>
      </View>
      <View style={styles.usageTrack}>
        <View style={[styles.usageFill, { width: `${percentage}%` }]} />
      </View>
    </View>
  );
}

function PlanCard({
  plan,
  currentPlan,
  interval,
  canManage,
  isLoading,
  onCheckout,
}: {
  plan: SubscriptionPlanDto;
  currentPlan: string;
  interval: SubscriptionInterval;
  canManage: boolean;
  isLoading: boolean;
  onCheckout: () => void;
}) {
  const { t } = useTranslation();
  const isCurrent = plan.plan === currentPlan;
  const isPaid = plan.plan !== 'free';
  const checkoutAvailable = interval === 'year' ? plan.yearlyCheckoutAvailable : plan.monthlyCheckoutAvailable;
  const price = interval === 'year' ? plan.pricePerYear : plan.pricePerMonth;

  return (
    <AppCard style={[styles.planCard, isCurrent ? styles.currentPlanBorder : null]}>
      <View style={styles.sectionHeader}>
        <View style={styles.flexCopy}>
          <AppText variant="h3">{plan.name}</AppText>
          <AppText variant="bodySmall" color={theme.colors.textSecondary}>
            {plan.description}
          </AppText>
        </View>
        {isCurrent ? (
          <View style={styles.currentPill}>
            <AppText variant="caption" color={theme.colors.white}>
              {t('subscriptions.current')}
            </AppText>
          </View>
        ) : null}
      </View>
      <View>
        <MoneyText amount={price} currency={plan.currency} variant="display" />
        <AppText variant="caption" color={theme.colors.textSecondary}>
          {t(`subscriptions.priceCadence.${interval}`)}
        </AppText>
      </View>
      <View style={styles.limitList}>
        <PlanLimit iconName="people-outline" label={formatLimit(t, 'subscriptions.clients', plan.limits.clients)} />
        <PlanLimit iconName="document-text-outline" label={formatLimit(t, 'subscriptions.invoicesThisMonth', plan.limits.invoicesPerMonth)} />
        <PlanLimit iconName="person-add-outline" label={t('subscriptions.teamSeats', { count: plan.limits.teamSeats })} />
      </View>
      <View style={styles.featureList}>
        {featureOrder.map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <Ionicons
              name={plan.features[feature] ? 'checkmark-circle-outline' : 'remove-circle-outline'}
              size={17}
              color={plan.features[feature] ? theme.colors.success : theme.colors.textMuted}
            />
            <AppText variant="caption" color={theme.colors.textSecondary}>
              {t(`subscriptions.features.${feature}`)}
            </AppText>
          </View>
        ))}
      </View>
      {isPaid && !isCurrent ? (
        <AppButton
          title={t('subscriptions.startCheckout')}
          iconName="open-outline"
          disabled={!canManage || !checkoutAvailable}
          isLoading={isLoading}
          onPress={onCheckout}
        />
      ) : null}
      {!canManage && isPaid ? <Notice message={t('subscriptions.managePermission')} /> : null}
    </AppCard>
  );
}

function PlanLimit({ iconName, label }: { iconName: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.featureRow}>
      <Ionicons name={iconName} size={17} color={theme.colors.primary} />
      <AppText variant="caption" color={theme.colors.textSecondary}>
        {label}
      </AppText>
    </View>
  );
}

function Notice({ message }: { message: string }) {
  return (
    <View style={styles.notice}>
      <Ionicons name="information-circle-outline" size={18} color={theme.colors.textSecondary} />
      <AppText variant="caption" color={theme.colors.textSecondary} style={styles.noticeText}>
        {message}
      </AppText>
    </View>
  );
}

async function openExternalUrl(url: string) {
  if (Platform.OS === 'web') {
    await Linking.openURL(url);
    return;
  }

  await WebBrowser.openBrowserAsync(url);
}

function formatPlanName(plan: string): string {
  return plan.charAt(0).toUpperCase() + plan.slice(1);
}

function formatLimit(t: ReturnType<typeof useTranslation>['t'], key: string, limit: number | null): string {
  return limit === null ? t('subscriptions.unlimitedLabel', { label: t(key) }) : t('subscriptions.limitedLabel', { label: t(key), limit });
}

const styles = StyleSheet.create({
  content: {
    gap: theme.spacing.md,
  },
  card: {
    gap: theme.spacing.md,
  },
  currentCard: {
    gap: theme.spacing.md,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  flexCopy: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  statusPill: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
  },
  priceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  priceDivider: {
    backgroundColor: theme.colors.border,
    height: 42,
    width: 1,
  },
  trialCard: {
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  inlineIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.full,
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  chips: {
    gap: theme.spacing.xs,
  },
  usageRow: {
    gap: theme.spacing.xs,
  },
  usageTrack: {
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.full,
    height: 8,
    overflow: 'hidden',
  },
  usageFill: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
    height: 8,
  },
  planCard: {
    gap: theme.spacing.md,
  },
  currentPlanBorder: {
    borderColor: theme.colors.primary,
  },
  currentPill: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
  },
  limitList: {
    gap: theme.spacing.xs,
  },
  featureList: {
    gap: theme.spacing.xs,
  },
  featureRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  notice: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: theme.radius.medium,
    flexDirection: 'row',
    gap: theme.spacing.xs,
    padding: theme.spacing.sm,
  },
  noticeText: {
    flex: 1,
  },
});
