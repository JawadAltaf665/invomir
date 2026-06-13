import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as Sharing from 'expo-sharing';
import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Platform, StyleSheet, View } from 'react-native';
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
import { invoicesApi } from '@/src/features/invoices/api/invoices-api';
import { InvoiceStatus } from '@/src/features/invoices/types';
import { queryKeys } from '@/src/services/api/query-keys';
import { useAuthStore } from '@/src/store/auth-store';
import { theme } from '@/src/theme/theme';
import { permissions } from '@/src/types/permissions';
import { formatDate } from '@/src/utils/formatters';

export function InvoiceDetailScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ id: string }>();
  const id = params.id;
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canUpdate = hasPermission(permissions.invoice.update);
  const canSend = hasPermission(permissions.invoice.send);
  const canMarkPaid = hasPermission(permissions.invoice.markPaid);
  const canCancel = hasPermission(permissions.invoice.cancel);
  const canDelete = hasPermission(permissions.invoice.delete);
  const canDuplicate = hasPermission(permissions.invoice.duplicate);
  const invoiceQuery = useQuery({
    queryKey: queryKeys.invoice(id),
    queryFn: () => invoicesApi.getInvoice(id),
    enabled: Boolean(id),
  });
  const refreshInvoice = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.invoice(id) });
    await queryClient.invalidateQueries({ queryKey: ['invoices'] });
    await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
  };
  const actionMutation = useMutation({
    mutationFn: async (action: 'send' | 'resend' | 'markPaid' | 'cancel' | 'delete' | 'duplicate') => {
      if (action === 'send') {
        return invoicesApi.sendInvoice(id);
      }

      if (action === 'resend') {
        return invoicesApi.resendInvoice(id);
      }

      if (action === 'markPaid') {
        return invoicesApi.markPaid(id);
      }

      if (action === 'cancel') {
        return invoicesApi.cancelInvoice(id);
      }

      if (action === 'delete') {
        return invoicesApi.deleteInvoice(id);
      }

      return invoicesApi.duplicateInvoice(id);
    },
    async onSuccess(result, action) {
      await refreshInvoice();

      if (action === 'duplicate' && 'id' in result) {
        router.push(`/invoices/${result.id}`);
      }

      if (action === 'delete') {
        router.replace('/invoices');
      }
    },
  });
  const pdfMutation = useMutation({
    mutationFn: ({ preview }: { preview: boolean; share: boolean }) => invoicesApi.downloadPdf(id, preview),
    async onSuccess(result, variables) {
      if (Platform.OS === 'web' || !variables.share || !result.uri) {
        return;
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(result.uri, {
          dialogTitle: result.fileName,
          mimeType: result.contentType,
        });
      }
    },
  });

  if (invoiceQuery.isLoading) {
    return (
      <AppScreen>
        <AppHeader title={t('invoices.detailTitle')} />
        <LoadingState rows={3} />
      </AppScreen>
    );
  }

  if (invoiceQuery.isError) {
    return (
      <AppScreen>
        <AppHeader title={t('invoices.detailTitle')} />
        <ErrorState message={invoiceQuery.error.message} onRetry={() => invoiceQuery.refetch()} />
      </AppScreen>
    );
  }

  const invoice = invoiceQuery.data;

  if (!invoice) {
    return (
      <AppScreen>
        <ErrorState message={t('invoices.emptyMessage')} />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <AppHeader title={invoice.invoiceNumber} subtitle={invoice.client.name} action={<StatusBadge status={invoice.status} />} />
      {actionMutation.isError ? <ErrorState message={actionMutation.error.message} /> : null}
      {pdfMutation.isError ? <ErrorState message={pdfMutation.error.message} /> : null}
      <AppCard style={styles.summary}>
        <MoneyText amount={invoice.total} currency={invoice.currency} variant="display" />
        <View style={styles.dates}>
          <AppText variant="bodySmall" color={theme.colors.textSecondary}>
            {t('invoices.issueDate')}: {formatDate(invoice.issueDate)}
          </AppText>
          <AppText variant="bodySmall" color={theme.colors.textSecondary}>
            {t('invoices.dueDate')}: {formatDate(invoice.dueDate)}
          </AppText>
        </View>
      </AppCard>
      <AppCard style={styles.card}>
        <AppText variant="h3">{t('clients.quickActions')}</AppText>
        <View style={styles.actionGrid}>
          {canUpdate && canEditInvoice(invoice.status) ? (
            <AppButton
              title={t('common.edit')}
              iconName="create-outline"
              variant="secondary"
              fullWidth={false}
              style={styles.actionButton}
              onPress={() => router.push(`/invoices/edit?id=${invoice.id}`)}
            />
          ) : null}
          {canSend && canSendInvoice(invoice.status) ? (
            <AppButton
              title={t('invoices.sendInvoice')}
              iconName="send-outline"
              fullWidth={false}
              style={styles.actionButton}
              isLoading={actionMutation.isPending}
              onPress={() => actionMutation.mutate('send')}
            />
          ) : null}
          {canSend && canResendInvoice(invoice.status) ? (
            <AppButton
              title={t('invoices.resendInvoice')}
              iconName="mail-unread-outline"
              fullWidth={false}
              style={styles.actionButton}
              isLoading={actionMutation.isPending}
              onPress={() => actionMutation.mutate('resend')}
            />
          ) : null}
          {canMarkPaid && canMarkPaidInvoice(invoice.status) ? (
            <AppButton
              title={t('invoices.markPaid')}
              iconName="checkmark-circle-outline"
              variant="success"
              fullWidth={false}
              style={styles.actionButton}
              isLoading={actionMutation.isPending}
              onPress={() => actionMutation.mutate('markPaid')}
            />
          ) : null}
          <AppButton
            title={t('invoices.downloadPdf')}
            iconName="download-outline"
            variant="secondary"
            fullWidth={false}
            style={styles.actionButton}
            isLoading={pdfMutation.isPending}
            onPress={() => pdfMutation.mutate({ preview: false, share: false })}
          />
          <AppButton
            title={t('invoices.sharePdf')}
            iconName="share-outline"
            variant="secondary"
            fullWidth={false}
            style={styles.actionButton}
            isLoading={pdfMutation.isPending}
            onPress={() => pdfMutation.mutate({ preview: true, share: true })}
          />
          {canDuplicate ? (
            <AppButton
              title={t('common.duplicate')}
              iconName="copy-outline"
              variant="ghost"
              fullWidth={false}
              style={styles.actionButton}
              isLoading={actionMutation.isPending}
              onPress={() => actionMutation.mutate('duplicate')}
            />
          ) : null}
          {canCancel && canCancelInvoice(invoice.status) ? (
            <AppButton
              title={t('invoices.cancelInvoice')}
              iconName="ban-outline"
              variant="danger"
              fullWidth={false}
              style={styles.actionButton}
              isLoading={actionMutation.isPending}
              onPress={() => confirmAction(t('invoices.cancelInvoice'), () => actionMutation.mutate('cancel'))}
            />
          ) : null}
          {canDelete && canDeleteInvoice(invoice.status) ? (
            <AppButton
              title={t('common.delete')}
              iconName="trash-outline"
              variant="danger"
              fullWidth={false}
              style={styles.actionButton}
              isLoading={actionMutation.isPending}
              onPress={() => confirmAction(t('invoices.deleteInvoice'), () => actionMutation.mutate('delete'))}
            />
          ) : null}
        </View>
      </AppCard>
      <AppCard style={styles.card}>
        <AppText variant="h3">{t('clients.contact')}</AppText>
        <AppText variant="body">{invoice.client.email}</AppText>
        {invoice.client.company ? (
          <AppText variant="bodySmall" color={theme.colors.textSecondary}>
            {invoice.client.company}
          </AppText>
        ) : null}
      </AppCard>
      <AppCard style={styles.card}>
        <AppText variant="h3">{t('invoices.lineItems')}</AppText>
        {invoice.items.map((item) => (
          <View key={item.id} style={styles.lineItem}>
            <View style={styles.lineItemCopy}>
              <AppText variant="body">{item.description}</AppText>
              <AppText variant="bodySmall" color={theme.colors.textMuted}>
                {item.quantity} x {item.unitPrice}
              </AppText>
            </View>
            <MoneyText amount={item.amount} currency={invoice.currency} />
          </View>
        ))}
      </AppCard>
      <AppCard style={styles.card}>
        <View style={styles.totalRow}>
          <AppText>{t('invoices.subtotal')}</AppText>
          <MoneyText amount={invoice.subtotal} currency={invoice.currency} />
        </View>
        <View style={styles.totalRow}>
          <AppText>{t('invoices.tax')}</AppText>
          <MoneyText amount={invoice.taxAmount} currency={invoice.currency} />
        </View>
        <View style={styles.totalRow}>
          <AppText>{t('invoices.discount')}</AppText>
          <MoneyText amount={invoice.discountAmount} currency={invoice.currency} />
        </View>
        <View style={styles.totalRow}>
          <AppText variant="h3">{t('invoices.total')}</AppText>
          <MoneyText amount={invoice.total} currency={invoice.currency} variant="h3" />
        </View>
      </AppCard>
      {invoice.notes ? (
        <AppCard style={styles.card}>
          <AppText variant="h3">{t('invoices.notes')}</AppText>
          <AppText color={theme.colors.textSecondary}>{invoice.notes}</AppText>
        </AppCard>
      ) : null}
    </AppScreen>
  );
}

function confirmAction(title: string, onConfirm: () => void) {
  Alert.alert(title, undefined, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Continue', style: 'destructive', onPress: onConfirm },
  ]);
}

function canEditInvoice(status: InvoiceStatus): boolean {
  return status === 'draft';
}

function canSendInvoice(status: InvoiceStatus): boolean {
  return status === 'draft';
}

function canResendInvoice(status: InvoiceStatus): boolean {
  return status === 'sent' || status === 'viewed' || status === 'overdue';
}

function canMarkPaidInvoice(status: InvoiceStatus): boolean {
  return status !== 'paid' && status !== 'cancelled';
}

function canCancelInvoice(status: InvoiceStatus): boolean {
  return canResendInvoice(status);
}

function canDeleteInvoice(status: InvoiceStatus): boolean {
  return status !== 'paid';
}

const styles = StyleSheet.create({
  summary: {
    gap: theme.spacing.sm,
  },
  dates: {
    gap: theme.spacing.xxs,
  },
  card: {
    gap: theme.spacing.md,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flexBasis: '47%',
    flexGrow: 1,
  },
  lineItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.md,
    justifyContent: 'space-between',
  },
  lineItemCopy: {
    flex: 1,
    gap: theme.spacing.xxs,
  },
  totalRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
