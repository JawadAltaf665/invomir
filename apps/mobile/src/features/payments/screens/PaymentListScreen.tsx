import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Linking, Platform, ScrollView, Share, StyleSheet, View } from 'react-native';
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
import { invoicesApi } from '@/src/features/invoices/api/invoices-api';
import { InvoiceListItemDto, InvoiceStatus } from '@/src/features/invoices/types';
import { paymentsApi } from '@/src/features/payments/api/payments-api';
import { PaymentHistoryItemDto, PaymentStatusFilter } from '@/src/features/payments/types';
import { settingsApi } from '@/src/features/settings/api/settings-api';
import { queryKeys } from '@/src/services/api/query-keys';
import { useAuthStore } from '@/src/store/auth-store';
import { theme } from '@/src/theme/theme';
import { permissions } from '@/src/types/permissions';
import { formatDate } from '@/src/utils/formatters';

const paymentStatuses: readonly PaymentStatusFilter[] = ['all', 'completed', 'failed', 'refunded'];
const payableInvoiceStatuses: readonly InvoiceStatus[] = ['sent', 'viewed', 'overdue'];
const paymentQueryBase = { page: 1, limit: 20 } as const;

export function PaymentListScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canView = hasPermission(permissions.payment.view);
  const canManagePayments = hasPermission(permissions.payment.manage);
  const canViewInvoices = hasPermission(permissions.invoice.view);
  const canSendInvoices = hasPermission(permissions.invoice.send);
  const [statusFilter, setStatusFilter] = useState<PaymentStatusFilter>('all');
  const paymentsQuery = useQuery({
    queryKey: queryKeys.payments({ ...paymentQueryBase, status: statusFilter }),
    queryFn: () => paymentsApi.listPayments({ ...paymentQueryBase, status: statusFilter }),
    enabled: canView,
  });
  const profileQuery = useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: settingsApi.getCurrentUser,
    enabled: canView,
  });
  const payableInvoiceQueries = useQueries({
    queries: payableInvoiceStatuses.map((status) => {
      const query = {
        status,
        page: 1,
        limit: 4,
        sortBy: 'due' as const,
        sortDirection: 'asc' as const,
      };

      return {
        queryKey: queryKeys.invoices(query),
        queryFn: () => invoicesApi.listInvoices(query),
        enabled: canView && canViewInvoices,
      };
    }),
  });
  const connectMutation = useMutation({
    mutationFn: paymentsApi.createStripeConnect,
    async onSuccess(result) {
      await openExternalUrl(result.oauthUrl);
    },
  });
  const paymentLinkMutation = useMutation({
    mutationFn: async ({ invoice, action }: { invoice: InvoiceListItemDto; action: 'open' | 'share' }) => {
      const result = await invoicesApi.resendInvoice(invoice.id);
      return { action, result };
    },
    async onSuccess({ action, result }) {
      await queryClient.invalidateQueries({ queryKey: ['invoices'] });

      if (action === 'share') {
        await Share.share({
          title: result.invoiceNumber,
          message: result.paymentLink,
          url: result.paymentLink,
        });
        return;
      }

      await openExternalUrl(result.paymentLink);
    },
  });

  if (!canView) {
    return (
      <AppScreen>
        <PermissionState />
      </AppScreen>
    );
  }

  const profile = profileQuery.data;
  const isStripeConnected = Boolean(profile?.stripeAccountId);
  const payments = paymentsQuery.data?.items ?? [];
  const payableInvoices = payableInvoiceQueries
    .flatMap((query) => query.data?.items ?? [])
    .sort((left, right) => left.dueDate.localeCompare(right.dueDate))
    .slice(0, 6);
  const isLoadingPayableInvoices = payableInvoiceQueries.some((query) => query.isLoading);
  const payableInvoiceError = payableInvoiceQueries.find((query) => query.isError)?.error;

  const refreshAll = () => {
    void profileQuery.refetch();
    void paymentsQuery.refetch();
    payableInvoiceQueries.forEach((query) => void query.refetch());
  };

  return (
    <AppScreen contentStyle={styles.content}>
      <AppHeader
        title={t('payments.title')}
        subtitle={t('payments.subtitle')}
        action={
          <AppButton
            title={t('common.refresh')}
            iconName="refresh-outline"
            variant="ghost"
            fullWidth={false}
            onPress={refreshAll}
          />
        }
      />

      <StripeConnectCard
        isConnected={isStripeConnected}
        accountId={profile?.stripeAccountId}
        canManage={canManagePayments}
        isLoading={profileQuery.isLoading || connectMutation.isPending}
        errorMessage={connectMutation.isError ? connectMutation.error.message : null}
        onConnect={() => connectMutation.mutate()}
      />

      <AppCard style={styles.card}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionCopy}>
            <AppText variant="h3">{t('payments.paymentLinksTitle')}</AppText>
            <AppText variant="bodySmall" color={theme.colors.textSecondary}>
              {t('payments.paymentLinksSubtitle')}
            </AppText>
          </View>
          <Ionicons name="link-outline" size={22} color={theme.colors.primary} />
        </View>

        {!isStripeConnected ? (
          <InlineNotice
            tone="warning"
            title={t('payments.connectRequiredTitle')}
            message={t('payments.connectRequiredMessage')}
          />
        ) : null}

        {!canSendInvoices ? (
          <InlineNotice
            tone="neutral"
            title={t('payments.invoicePermissionTitle')}
            message={t('payments.invoicePermissionMessage')}
          />
        ) : null}

        {isLoadingPayableInvoices ? <LoadingState rows={2} /> : null}
        {payableInvoiceError ? <ErrorState message={payableInvoiceError.message} /> : null}

        {!isLoadingPayableInvoices && !payableInvoiceError && payableInvoices.length === 0 ? (
          <EmptyState
            iconName="receipt-outline"
            title={t('payments.noPayableInvoicesTitle')}
            message={t('payments.noPayableInvoicesMessage')}
          />
        ) : null}

        {payableInvoices.map((invoice) => (
          <PayableInvoiceCard
            key={invoice.id}
            invoice={invoice}
            disabled={!isStripeConnected || !canSendInvoices}
            isLoading={paymentLinkMutation.isPending}
            onOpen={() => paymentLinkMutation.mutate({ invoice, action: 'open' })}
            onShare={() => paymentLinkMutation.mutate({ invoice, action: 'share' })}
          />
        ))}

        {paymentLinkMutation.isError ? <ErrorState message={paymentLinkMutation.error.message} /> : null}
      </AppCard>

      <AppCard style={styles.card}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionCopy}>
            <AppText variant="h3">{t('payments.historyTitle')}</AppText>
            <AppText variant="bodySmall" color={theme.colors.textSecondary}>
              {t('payments.historySubtitle')}
            </AppText>
          </View>
          <AppText variant="caption" color={theme.colors.textMuted}>
            {t('payments.totalCount', { count: paymentsQuery.data?.totalCount ?? 0 })}
          </AppText>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {paymentStatuses.map((status) => (
            <FilterChip
              key={status}
              label={t(`payments.statusFilters.${status}`)}
              selected={statusFilter === status}
              onPress={() => setStatusFilter(status)}
            />
          ))}
        </ScrollView>

        {paymentsQuery.isLoading ? <LoadingState rows={4} /> : null}
        {paymentsQuery.isError ? (
          <ErrorState message={paymentsQuery.error.message} onRetry={() => paymentsQuery.refetch()} />
        ) : null}

        {!paymentsQuery.isLoading && !paymentsQuery.isError && payments.length === 0 ? (
          <EmptyState
            iconName="card-outline"
            title={t('payments.emptyTitle')}
            message={t('payments.emptyMessage')}
          />
        ) : null}

        {payments.map((payment) => (
          <PaymentCard key={payment.id} payment={payment} />
        ))}
      </AppCard>
    </AppScreen>
  );
}

function StripeConnectCard({
  isConnected,
  accountId,
  canManage,
  isLoading,
  errorMessage,
  onConnect,
}: {
  isConnected: boolean;
  accountId?: string | null;
  canManage: boolean;
  isLoading: boolean;
  errorMessage: string | null;
  onConnect: () => void;
}) {
  const { t } = useTranslation();

  return (
    <AppCard style={styles.connectCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.connectIcon}>
          <Ionicons name="shield-checkmark-outline" size={22} color={theme.colors.primary} />
        </View>
        <View style={styles.sectionCopy}>
          <AppText variant="h3">{t('payments.stripeConnect')}</AppText>
          <AppText variant="bodySmall" color={theme.colors.textSecondary}>
            {t('payments.stripeDescription')}
          </AppText>
        </View>
      </View>

      <View style={[styles.statusPanel, isConnected ? styles.statusPanelSuccess : styles.statusPanelWarning]}>
        <View style={[styles.statusDot, { backgroundColor: isConnected ? theme.colors.success : theme.colors.warning }]} />
        <View style={styles.sectionCopy}>
          <AppText variant="label">
            {isConnected ? t('payments.stripeConnected') : t('payments.stripeNotConnected')}
          </AppText>
          <AppText variant="caption" color={theme.colors.textSecondary}>
            {isConnected && accountId ? t('payments.stripeAccount', { accountId: maskStripeAccount(accountId) }) : t('payments.stripeSetupHint')}
          </AppText>
        </View>
      </View>

      {errorMessage ? <ErrorState message={errorMessage} /> : null}

      {canManage ? (
        <AppButton
          title={isConnected ? t('payments.stripeAlreadyConnected') : t('payments.connectStripe')}
          iconName={isConnected ? 'checkmark-circle-outline' : 'open-outline'}
          isLoading={isLoading}
          disabled={isConnected}
          onPress={onConnect}
        />
      ) : (
        <InlineNotice
          tone="neutral"
          title={t('payments.managePermissionRequired')}
          message={t('payments.managePermissionMessage')}
        />
      )}
    </AppCard>
  );
}

function PayableInvoiceCard({
  invoice,
  disabled,
  isLoading,
  onOpen,
  onShare,
}: {
  invoice: InvoiceListItemDto;
  disabled: boolean;
  isLoading: boolean;
  onOpen: () => void;
  onShare: () => void;
}) {
  const { t } = useTranslation();

  return (
    <View style={styles.invoiceRow}>
      <View style={styles.invoiceMeta}>
        <AppText variant="label" numberOfLines={1}>
          {invoice.invoiceNumber}
        </AppText>
        <AppText variant="bodySmall" color={theme.colors.textSecondary} numberOfLines={1}>
          {invoice.clientName} · {t('invoices.due', { date: formatDate(invoice.dueDate) })}
        </AppText>
      </View>
      <View style={styles.invoiceActions}>
        <MoneyText amount={invoice.total} currency={invoice.currency} variant="label" />
        <View style={styles.smallActionRow}>
          <AppButton
            title={t('payments.openPayLink')}
            iconName="open-outline"
            variant="secondary"
            fullWidth={false}
            disabled={disabled}
            isLoading={isLoading}
            style={styles.smallButton}
            onPress={onOpen}
          />
          <AppButton
            title={t('common.share')}
            iconName="share-outline"
            variant="ghost"
            fullWidth={false}
            disabled={disabled}
            isLoading={isLoading}
            style={styles.smallButton}
            onPress={onShare}
          />
        </View>
      </View>
    </View>
  );
}

function PaymentCard({ payment }: { payment: PaymentHistoryItemDto }) {
  const { t } = useTranslation();

  return (
    <AppCard style={styles.paymentCard}>
      <View style={styles.cardHeader}>
        <View style={styles.cardCopy}>
          <AppText variant="label" numberOfLines={1}>
            {payment.invoiceNumber}
          </AppText>
          <AppText variant="bodySmall" color={theme.colors.textSecondary} numberOfLines={1}>
            {payment.clientName}
          </AppText>
        </View>
        <View style={styles.amountColumn}>
          <MoneyText amount={payment.amount} currency={payment.currency} variant="label" numberOfLines={1} />
          <PaymentStatusPill status={payment.status} />
        </View>
      </View>
      <View style={styles.cardFooter}>
        <AppText variant="caption" color={theme.colors.textMuted}>
          {formatPaymentMethod(payment.method)}
        </AppText>
        <AppText variant="caption" color={theme.colors.textMuted}>
          {t('payments.paidAt', { date: formatDate(payment.paidAt) })}
        </AppText>
      </View>
      {payment.stripePaymentIntentId || payment.stripeChargeId ? (
        <AppText variant="caption" color={theme.colors.textMuted} numberOfLines={1}>
          {payment.stripePaymentIntentId ?? payment.stripeChargeId}
        </AppText>
      ) : null}
    </AppCard>
  );
}

function PaymentStatusPill({ status }: { status: string }) {
  const { t } = useTranslation();
  const palette = getPaymentStatusPalette(status);

  return (
    <View style={[styles.paymentStatusPill, { backgroundColor: palette.background }]}>
      <AppText variant="caption" color={palette.foreground}>
        {t(`payments.statusLabels.${status}`, { defaultValue: status })}
      </AppText>
    </View>
  );
}

function InlineNotice({
  tone,
  title,
  message,
}: {
  tone: 'warning' | 'neutral';
  title: string;
  message: string;
}) {
  const palette = tone === 'warning'
    ? { background: theme.colors.warningLight, foreground: theme.colors.warning }
    : { background: theme.colors.surfaceMuted, foreground: theme.colors.textSecondary };

  return (
    <View style={[styles.notice, { backgroundColor: palette.background }]}>
      <Ionicons name={tone === 'warning' ? 'alert-circle-outline' : 'information-circle-outline'} size={18} color={palette.foreground} />
      <View style={styles.sectionCopy}>
        <AppText variant="label">{title}</AppText>
        <AppText variant="caption" color={theme.colors.textSecondary}>
          {message}
        </AppText>
      </View>
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

function maskStripeAccount(accountId: string): string {
  return accountId.length <= 8 ? accountId : `${accountId.slice(0, 7)}…${accountId.slice(-4)}`;
}

function formatPaymentMethod(method: string): string {
  return method
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function getPaymentStatusPalette(status: string) {
  if (status === 'completed') {
    return { foreground: theme.colors.success, background: theme.colors.successLight };
  }

  if (status === 'failed') {
    return { foreground: theme.colors.error, background: theme.colors.errorLight };
  }

  if (status === 'refunded') {
    return { foreground: theme.colors.warning, background: theme.colors.warningLight };
  }

  return { foreground: theme.colors.textSecondary, background: theme.colors.surfaceMuted };
}

const styles = StyleSheet.create({
  content: {
    gap: theme.spacing.md,
  },
  card: {
    gap: theme.spacing.md,
  },
  connectCard: {
    gap: theme.spacing.md,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  sectionCopy: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  connectIcon: {
    alignItems: 'center',
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.large,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  statusPanel: {
    alignItems: 'center',
    borderRadius: theme.radius.medium,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
  },
  statusPanelSuccess: {
    backgroundColor: theme.colors.successLight,
  },
  statusPanelWarning: {
    backgroundColor: theme.colors.warningLight,
  },
  statusDot: {
    borderRadius: theme.radius.full,
    height: 10,
    width: 10,
  },
  notice: {
    alignItems: 'flex-start',
    borderRadius: theme.radius.medium,
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
  },
  chips: {
    gap: theme.spacing.xs,
  },
  invoiceRow: {
    borderColor: theme.colors.border,
    borderRadius: theme.radius.medium,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
  },
  invoiceMeta: {
    gap: theme.spacing.xxs,
  },
  invoiceActions: {
    gap: theme.spacing.xs,
  },
  smallActionRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  smallButton: {
    flex: 1,
    minHeight: 42,
    paddingHorizontal: theme.spacing.sm,
  },
  paymentCard: {
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
  },
  cardHeader: {
    alignItems: 'flex-start',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  cardCopy: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  amountColumn: {
    alignItems: 'flex-end',
    gap: theme.spacing.xxs,
  },
  paymentStatusPill: {
    borderRadius: theme.radius.full,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: theme.spacing.xxs,
  },
  cardFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
});
