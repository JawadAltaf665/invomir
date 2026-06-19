import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppButton } from '@/src/components/common/AppButton';
import { AppCard } from '@/src/components/common/AppCard';
import { AppText } from '@/src/components/common/AppText';
import { MoneyText } from '@/src/components/common/MoneyText';
import { StatusBadge } from '@/src/components/common/StatusBadge';
import { ErrorState } from '@/src/components/feedback/ErrorState';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { AppHeader } from '@/src/components/layout/AppHeader';
import { AppScreen } from '@/src/components/layout/AppScreen';
import { clientsApi } from '@/src/features/clients/api/clients-api';
import { queryKeys } from '@/src/services/api/query-keys';
import { useAuthStore } from '@/src/store/auth-store';
import { theme } from '@/src/theme/theme';
import { permissions } from '@/src/types/permissions';
import { formatDate } from '@/src/utils/formatters';

export function ClientDetailScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ id: string }>();
  const id = params.id;
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canCreateInvoice = hasPermission(permissions.invoice.create);
  const canUpdateClient = hasPermission(permissions.client.update);
  const clientQuery = useQuery({
    queryKey: queryKeys.client(id),
    queryFn: () => clientsApi.getClient(id),
    enabled: Boolean(id),
  });

  if (clientQuery.isLoading) {
    return (
      <AppScreen>
        <AppHeader title={t('clients.detailTitle')} />
        <LoadingState rows={3} />
      </AppScreen>
    );
  }

  if (clientQuery.isError) {
    return (
      <AppScreen>
        <AppHeader title={t('clients.detailTitle')} />
        <ErrorState message={clientQuery.error.message} onRetry={() => clientQuery.refetch()} />
      </AppScreen>
    );
  }

  const client = clientQuery.data;

  if (!client) {
    return (
      <AppScreen>
        <ErrorState message={t('clients.emptyMessage')} />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <AppHeader
        title={client.name}
        subtitle={client.company ?? client.email}
        action={
          <View style={styles.headerActions}>
            {canUpdateClient ? (
              <AppButton
                title={t('common.edit')}
                iconName="create-outline"
                variant="secondary"
                fullWidth={false}
                onPress={() => router.push(`/clients/edit?id=${client.id}`)}
              />
            ) : null}
            {canCreateInvoice ? (
              <AppButton
                title={t('invoices.create')}
                iconName="document-text-outline"
                fullWidth={false}
                onPress={() => router.push(`/invoices/new?clientId=${client.id}`)}
              />
            ) : null}
          </View>
        }
      />
      <AppCard style={styles.summary}>
        <AppText variant="caption" color={theme.colors.textMuted}>
          {t('clients.totalRevenue')}
        </AppText>
        <MoneyText amount={client.totalRevenue} currency={client.currency} variant="display" />
      </AppCard>
      <AppCard style={styles.card}>
        <AppText variant="h3">{t('clients.contact')}</AppText>
        <AppText>{client.email}</AppText>
        {client.phone ? <AppText color={theme.colors.textSecondary}>{client.phone}</AppText> : null}
        {client.address ? <AppText color={theme.colors.textSecondary}>{client.address}</AppText> : null}
        {client.taxId ? <AppText color={theme.colors.textSecondary}>{client.taxId}</AppText> : null}
        {client.notes ? <AppText color={theme.colors.textSecondary}>{client.notes}</AppText> : null}
      </AppCard>
      <View style={styles.section}>
        <AppText variant="h2">{t('clients.invoiceHistory')}</AppText>
        {client.invoices.items.map((invoice) => (
          <AppCard key={invoice.id} style={styles.invoiceRow}>
            <View style={styles.invoiceCopy}>
              <AppText variant="h3">{invoice.invoiceNumber}</AppText>
              <AppText variant="bodySmall" color={theme.colors.textMuted}>
                {formatDate(invoice.dueDate)}
              </AppText>
            </View>
            <View style={styles.invoiceMeta}>
              <StatusBadge status={invoice.status} />
              <MoneyText amount={invoice.total} currency={invoice.currency} />
            </View>
          </AppCard>
        ))}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  summary: {
    gap: theme.spacing.xs,
  },
  card: {
    gap: theme.spacing.sm,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  section: {
    gap: theme.spacing.md,
  },
  invoiceRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  invoiceCopy: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  invoiceMeta: {
    alignItems: 'flex-end',
    gap: theme.spacing.xs,
  },
});
