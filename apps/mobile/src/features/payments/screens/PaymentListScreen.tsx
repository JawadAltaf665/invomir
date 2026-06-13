import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppCard } from '@/src/components/common/AppCard';
import { AppText } from '@/src/components/common/AppText';
import { MoneyText } from '@/src/components/common/MoneyText';
import { EmptyState } from '@/src/components/feedback/EmptyState';
import { ErrorState } from '@/src/components/feedback/ErrorState';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { PermissionState } from '@/src/components/feedback/PermissionState';
import { AppHeader } from '@/src/components/layout/AppHeader';
import { AppScreen } from '@/src/components/layout/AppScreen';
import { layout } from '@/src/constants/layout';
import { paymentsApi } from '@/src/features/payments/api/payments-api';
import { PaymentHistoryItemDto } from '@/src/features/payments/types';
import { useBottomTabScrollChrome } from '@/src/hooks/useBottomTabScrollChrome';
import { queryKeys } from '@/src/services/api/query-keys';
import { useAuthStore } from '@/src/store/auth-store';
import { theme } from '@/src/theme/theme';
import { permissions } from '@/src/types/permissions';
import { formatDate } from '@/src/utils/formatters';

const query = { status: 'all', page: 1, limit: 20 };

export function PaymentListScreen() {
  const { t } = useTranslation();
  const handleBottomTabScroll = useBottomTabScrollChrome();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canView = hasPermission(permissions.payment.view);
  const paymentsQuery = useQuery({
    queryKey: queryKeys.payments(query),
    queryFn: () => paymentsApi.listPayments(query),
    enabled: canView,
  });

  if (!canView) {
    return (
      <AppScreen>
        <PermissionState />
      </AppScreen>
    );
  }

  return (
    <AppScreen scroll={false}>
      <View style={styles.content}>
        <AppHeader title={t('payments.title')} subtitle={t('payments.subtitle')} />
        {paymentsQuery.isLoading ? <LoadingState rows={4} /> : null}
        {paymentsQuery.isError ? (
          <ErrorState message={paymentsQuery.error.message} onRetry={() => paymentsQuery.refetch()} />
        ) : null}
        {!paymentsQuery.isLoading && !paymentsQuery.isError ? (
          <FlashList
            data={paymentsQuery.data?.items ?? []}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            onScroll={handleBottomTabScroll}
            scrollEventThrottle={16}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <EmptyState
                iconName="card-outline"
                title={t('payments.emptyTitle')}
                message={t('payments.emptyMessage')}
              />
            }
            renderItem={({ item }) => <PaymentCard payment={item} />}
            refreshing={paymentsQuery.isRefetching}
            onRefresh={paymentsQuery.refetch}
          />
        ) : null}
      </View>
    </AppScreen>
  );
}

function PaymentCard({ payment }: { payment: PaymentHistoryItemDto }) {
  const { t } = useTranslation();

  return (
    <AppCard style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardCopy}>
          <AppText variant="label" numberOfLines={1}>
            {payment.invoiceNumber}
          </AppText>
          <AppText variant="bodySmall" color={theme.colors.textSecondary} numberOfLines={1}>
            {payment.clientName}
          </AppText>
        </View>
        <MoneyText amount={payment.amount} currency={payment.currency} variant="label" numberOfLines={1} />
      </View>
      <View style={styles.cardFooter}>
        <AppText variant="caption" color={theme.colors.textMuted}>
          {payment.method}
        </AppText>
        <AppText variant="caption" color={theme.colors.textMuted}>
          {t('payments.paidAt', { date: formatDate(payment.paidAt) })}
        </AppText>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: theme.spacing.md,
    padding: theme.spacing.md,
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
  cardFooter: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});
