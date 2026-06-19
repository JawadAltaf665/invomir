import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppButton } from '@/src/components/common/AppButton';
import { AppText } from '@/src/components/common/AppText';
import { EmptyState } from '@/src/components/feedback/EmptyState';
import { ErrorState } from '@/src/components/feedback/ErrorState';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { PermissionState } from '@/src/components/feedback/PermissionState';
import { FilterChip } from '@/src/components/forms/FilterChip';
import { SearchInput } from '@/src/components/forms/SearchInput';
import { InvoiceCard } from '@/src/components/invoice/InvoiceCard';
import { AppHeader } from '@/src/components/layout/AppHeader';
import { AppScreen } from '@/src/components/layout/AppScreen';
import { layout } from '@/src/constants/layout';
import { invoicesApi } from '@/src/features/invoices/api/invoices-api';
import { InvoiceStatus, invoiceStatuses } from '@/src/features/invoices/types';
import { useBottomTabScrollChrome } from '@/src/hooks/useBottomTabScrollChrome';
import { useConfirmationDialog } from '@/src/hooks/useConfirmationDialog';
import { queryKeys } from '@/src/services/api/query-keys';
import { useAuthStore } from '@/src/store/auth-store';
import { theme } from '@/src/theme/theme';
import { permissions } from '@/src/types/permissions';

type StatusFilter = InvoiceStatus | 'all';
const pageSizeIncrement = 10;

export function InvoiceListScreen() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ status?: string }>();
  const handleBottomTabScroll = useBottomTabScrollChrome();
  const { confirm, ConfirmationDialog } = useConfirmationDialog();
  const initialStatus = invoiceStatuses.includes(params.status as InvoiceStatus)
    ? (params.status as InvoiceStatus)
    : 'all';
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState<StatusFilter>(initialStatus);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);
  const [selectionNotice, setSelectionNotice] = useState<string | null>(null);
  const [visibleLimit, setVisibleLimit] = useState(pageSizeIncrement);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canView = hasPermission(permissions.invoice.view);
  const canSend = hasPermission(permissions.invoice.send);
  const canCancel = hasPermission(permissions.invoice.cancel);
  const query = useMemo(
    () => ({
      page: 1,
      limit: visibleLimit,
      searchTerm,
      status: status === 'all' ? null : status,
      sortBy: 'created' as const,
      sortDirection: 'desc' as const,
    }),
    [searchTerm, status, visibleLimit],
  );
  const invoicesQuery = useQuery({
    queryKey: queryKeys.invoices(query),
    queryFn: () => invoicesApi.listInvoices(query),
    enabled: canView,
  });
  const bulkMutation = useMutation({
    mutationFn: async (action: 'send' | 'resend' | 'cancel') => {
      const targetIds =
        action === 'send'
          ? sendableSelectedIds
          : action === 'resend'
            ? resendableSelectedIds
            : cancelableSelectedIds;

      await Promise.all(
        targetIds.map((id) => {
          if (action === 'send') {
            return invoicesApi.sendInvoice(id);
          }

          if (action === 'resend') {
            return invoicesApi.resendInvoice(id);
          }

          return invoicesApi.cancelInvoice(id);
        }),
      );
    },
    async onSuccess() {
      setSelectedIds([]);
      setIsSelecting(false);
      setSelectionNotice(null);
      await queryClient.invalidateQueries({ queryKey: ['invoices'] });
      await queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    },
  });

  if (!canView) {
    return (
      <AppScreen>
        <PermissionState />
      </AppScreen>
    );
  }

  const invoices = invoicesQuery.data?.items ?? [];
  const totalInvoices = invoicesQuery.data?.totalCount ?? invoices.length;
  const canViewMore = invoices.length < totalInvoices;
  const selectedCount = selectedIds.length;
  const selectedInvoices = invoices.filter((invoice) => selectedIds.includes(invoice.id));
  const sendableSelectedIds = selectedInvoices.filter((invoice) => canSendInvoice(invoice.status)).map((invoice) => invoice.id);
  const resendableSelectedIds = selectedInvoices.filter((invoice) => canResendInvoice(invoice.status)).map((invoice) => invoice.id);
  const cancelableSelectedIds = selectedInvoices.filter((invoice) => canCancelInvoice(invoice.status)).map((invoice) => invoice.id);
  const showSendAction = canSend && sendableSelectedIds.length > 0;
  const showResendAction = canSend && resendableSelectedIds.length > 0;
  const showCancelAction = canCancel && cancelableSelectedIds.length > 0;
  const hasBulkAction = showSendAction || showResendAction || showCancelAction;
  const bulkMessage = selectionNotice ?? (!hasBulkAction ? t('invoices.selectionHint') : null);
  const toggleSelection = (id: string) => {
    setSelectionNotice(null);
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };
  const applyStatusFilter = (nextStatus: StatusFilter) => {
    setStatus(nextStatus);
    setVisibleLimit(pageSizeIncrement);
    setSelectedIds([]);
    setSelectionNotice(null);
  };
  const confirmBulkAction = (action: 'send' | 'resend' | 'cancel') => {
    const targetCount =
      action === 'send'
        ? sendableSelectedIds.length
        : action === 'resend'
          ? resendableSelectedIds.length
          : cancelableSelectedIds.length;

    if (targetCount === 0 || bulkMutation.isPending) {
      return;
    }

    confirm({
      message:
        action === 'send'
          ? t('invoices.confirmBulkSend', { count: targetCount })
          : action === 'resend'
            ? t('invoices.confirmBulkResend', { count: targetCount })
            : t('invoices.confirmBulkCancel', { count: targetCount }),
      tone: action === 'cancel' ? 'danger' : 'primary',
      onConfirm: async () => {
        await bulkMutation.mutateAsync(action);
      },
    });
  };

  return (
    <AppScreen scroll={false} padded={false} contentStyle={styles.screenContent}>
      <FlatList
        data={!invoicesQuery.isLoading && !invoicesQuery.isError ? invoices : []}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        onScroll={handleBottomTabScroll}
        scrollEventThrottle={16}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerContent}>
        <AppHeader
          title={t('invoices.title')}
          action={
            <View style={styles.headerActions}>
              <AppButton
                title={isSelecting ? t('invoices.clearSelection') : t('invoices.select')}
                iconName={isSelecting ? 'close-outline' : 'checkbox-outline'}
                variant="ghost"
                fullWidth={false}
                onPress={() => {
                  setIsSelecting((current) => !current);
                  setSelectedIds([]);
                  setSelectionNotice(null);
                }}
              />
              <AppButton
                title={t('common.add')}
                iconName="add-outline"
                fullWidth={false}
                onPress={() => router.push('/invoices/new')}
              />
            </View>
          }
        />
        <SearchInput
          label={t('common.search')}
          placeholder={t('invoices.searchPlaceholder')}
          value={searchTerm}
          onChangeText={(value) => {
            setSearchTerm(value);
            setVisibleLimit(pageSizeIncrement);
            setSelectedIds([]);
            setSelectionNotice(null);
          }}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroller}
          contentContainerStyle={styles.chips}
        >
          <FilterChip
            label={t('invoices.allStatuses')}
            selected={status === 'all'}
            onPress={() => applyStatusFilter('all')}
          />
          {invoiceStatuses.map((invoiceStatus) => (
            <FilterChip
              key={invoiceStatus}
              label={t(`invoices.statuses.${invoiceStatus}`)}
              selected={status === invoiceStatus}
              onPress={() => applyStatusFilter(invoiceStatus)}
            />
          ))}
        </ScrollView>
        {invoicesQuery.isLoading ? <LoadingState rows={4} /> : null}
        {invoicesQuery.isError ? (
          <ErrorState message={invoicesQuery.error.message} onRetry={() => invoicesQuery.refetch()} />
        ) : null}
        {bulkMutation.isError ? <ErrorState message={bulkMutation.error.message} /> : null}
        {isSelecting ? (
          <View style={styles.bulkBar}>
            <AppText variant="label">{t('invoices.selectedCount', { count: selectedCount })}</AppText>
            {bulkMessage ? (
              <AppText variant="bodySmall" color={theme.colors.textSecondary} style={styles.bulkHint}>
                {bulkMessage}
              </AppText>
            ) : null}
            <View style={styles.bulkActions}>
              {showSendAction ? (
                <AppButton
                  title={t('common.send')}
                  iconName="send-outline"
                  fullWidth={false}
                  disabled={bulkMutation.isPending}
                  isLoading={bulkMutation.isPending}
                  onPress={() => confirmBulkAction('send')}
                />
              ) : null}
              {showResendAction ? (
                <AppButton
                  title={t('common.resend')}
                  iconName="mail-unread-outline"
                  variant="secondary"
                  fullWidth={false}
                  disabled={bulkMutation.isPending}
                  isLoading={bulkMutation.isPending}
                  onPress={() => confirmBulkAction('resend')}
                />
              ) : null}
              {showCancelAction ? (
                <AppButton
                  title={t('common.cancel')}
                  iconName="ban-outline"
                  variant="danger"
                  fullWidth={false}
                  disabled={bulkMutation.isPending}
                  isLoading={bulkMutation.isPending}
                  onPress={() => confirmBulkAction('cancel')}
                />
              ) : null}
            </View>
          </View>
        ) : null}
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListFooterComponent={
          canViewMore ? (
            <View style={styles.footer}>
              <AppButton
                title={t('common.viewTenMore')}
                iconName="chevron-down-outline"
                variant="secondary"
                isLoading={invoicesQuery.isFetching && !invoicesQuery.isRefetching}
                onPress={() => setVisibleLimit((current) => current + pageSizeIncrement)}
              />
            </View>
          ) : null
        }
        ListEmptyComponent={
          !invoicesQuery.isLoading && !invoicesQuery.isError ? (
            <EmptyState
              title={t('invoices.emptyTitle')}
              message={t('invoices.emptyMessage')}
              actionLabel={t('invoices.create')}
              onAction={() => router.push('/invoices/new')}
            />
          ) : null
        }
        renderItem={({ item }) => (
          <InvoiceCard
            invoice={item}
            selectable={isSelecting}
            selected={selectedIds.includes(item.id)}
            selectionDisabled={isSelecting && !canSelectInvoice(item.status)}
            onPress={() => {
              if (isSelecting) {
                if (!canSelectInvoice(item.status)) {
                  setSelectionNotice(t('invoices.finalStatusSelectionDisabled'));
                  return;
                }

                toggleSelection(item.id);
                return;
              }

              router.push({
                pathname: '/invoices/[id]',
                params: { id: item.id },
              });
            }}
          />
        )}
        refreshing={invoicesQuery.isRefetching}
        onRefresh={invoicesQuery.refetch}
      />
      {ConfirmationDialog}
    </AppScreen>
  );
}

function canSendInvoice(status: InvoiceStatus): boolean {
  return status === 'draft';
}

function canResendInvoice(status: InvoiceStatus): boolean {
  return status === 'sent' || status === 'viewed' || status === 'overdue';
}

function canCancelInvoice(status: InvoiceStatus): boolean {
  return canResendInvoice(status);
}

function canSelectInvoice(status: InvoiceStatus): boolean {
  return status !== 'paid' && status !== 'cancelled';
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
    minHeight: 0,
  },
  headerContent: {
    gap: theme.spacing.md,
  },
  chips: {
    gap: theme.spacing.xs,
    paddingBottom: theme.spacing.xs,
  },
  chipScroller: {
    flexGrow: 0,
    flexShrink: 0,
    maxHeight: 48,
  },
  headerActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  bulkBar: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.large,
    borderWidth: 1,
    gap: theme.spacing.sm,
    padding: theme.spacing.sm,
  },
  bulkActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  bulkHint: {
    lineHeight: 18,
  },
  listContent: {
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    paddingBottom: layout.bottomTabOverlayHeight,
  },
  list: {
    flex: 1,
    minHeight: 0,
  },
  separator: {
    height: theme.spacing.sm,
  },
  footer: {
    paddingTop: theme.spacing.xs,
  },
});
