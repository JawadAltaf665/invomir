import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { format, startOfMonth, subMonths } from 'date-fns';
import * as Sharing from 'expo-sharing';
import { useMemo, useState } from 'react';
import { FlatList, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AppButton } from '@/src/components/common/AppButton';
import { AppCard } from '@/src/components/common/AppCard';
import { AppText } from '@/src/components/common/AppText';
import { MoneyText } from '@/src/components/common/MoneyText';
import { EmptyState } from '@/src/components/feedback/EmptyState';
import { ErrorState } from '@/src/components/feedback/ErrorState';
import { LoadingState } from '@/src/components/feedback/LoadingState';
import { PermissionState } from '@/src/components/feedback/PermissionState';
import { DatePickerField } from '@/src/components/forms/DatePickerField';
import { FilterChip } from '@/src/components/forms/FilterChip';
import { AppHeader } from '@/src/components/layout/AppHeader';
import { AppScreen } from '@/src/components/layout/AppScreen';
import { layout } from '@/src/constants/layout';
import { reportsApi } from '@/src/features/reports/api/reports-api';
import { ReportExportFormat, ReportInvoiceStatus } from '@/src/features/reports/types';
import { useBottomTabScrollChrome } from '@/src/hooks/useBottomTabScrollChrome';
import { queryKeys } from '@/src/services/api/query-keys';
import { useAuthStore } from '@/src/store/auth-store';
import { theme } from '@/src/theme/theme';
import { permissions } from '@/src/types/permissions';
import { formatDate } from '@/src/utils/formatters';

const monthOptions = [6, 12, 24] as const;
const reportStatuses: readonly ReportInvoiceStatus[] = ['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'];

export function ReportsScreen() {
  const { t } = useTranslation();
  const handleBottomTabScroll = useBottomTabScrollChrome();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canView = hasPermission(permissions.report.view);
  const canExport = hasPermission(permissions.report.export);
  const [months, setMonths] = useState<(typeof monthOptions)[number]>(6);
  const [status, setStatus] = useState<ReportInvoiceStatus | null>(null);
  const [fromDate, setFromDate] = useState(() => format(startOfMonth(subMonths(new Date(), 5)), 'yyyy-MM-dd'));
  const [toDate, setToDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const query = useMemo(() => ({ months, year: null, month: null }), [months]);
  const reportsQuery = useQuery({
    queryKey: queryKeys.reports(query),
    queryFn: () => reportsApi.getMonthlyReports(query),
    enabled: canView,
  });
  const exportMutation = useMutation({
    mutationFn: reportsApi.exportReport,
    async onSuccess(result) {
      if (Platform.OS === 'web' || !result.uri) {
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

  if (!canView) {
    return (
      <AppScreen>
        <PermissionState />
      </AppScreen>
    );
  }

  const report = reportsQuery.data;
  const monthsData = report?.months ?? [];
  const totals = monthsData.reduce(
    (accumulator, month) => ({
      paid: accumulator.paid + month.paid,
      outstanding: accumulator.outstanding + month.outstanding,
      overdue: accumulator.overdue + month.overdue,
      invoiceCount: accumulator.invoiceCount + month.invoiceCount,
    }),
    { paid: 0, outstanding: 0, overdue: 0, invoiceCount: 0 },
  );
  const maxValue = Math.max(1, ...monthsData.flatMap((month) => [month.paid, month.outstanding, month.overdue]));

  const exportReport = (formatType: ReportExportFormat) => {
    exportMutation.mutate({
      format: formatType,
      from: fromDate,
      to: toDate,
      status,
    });
  };

  return (
    <AppScreen scroll={false} padded={false} contentStyle={styles.screenContent}>
      <FlatList
        data={!reportsQuery.isLoading && !reportsQuery.isError && monthsData.length > 0 ? monthsData : []}
        keyExtractor={(item) => item.month}
        keyboardShouldPersistTaps="handled"
        style={styles.list}
        contentContainerStyle={styles.listContent}
        onScroll={handleBottomTabScroll}
        scrollEventThrottle={16}
        ListHeaderComponent={
          <View style={styles.headerContent}>
            <AppHeader title={t('reports.title')} subtitle={t('reports.subtitle')} />

            <AppCard style={styles.filterCard}>
              <View style={styles.sectionHeader}>
                <AppText variant="h3">{t('reports.quickFilters')}</AppText>
                <AppText variant="caption" color={theme.colors.textMuted}>
                  {t('reports.lastMonths', { count: months })}
                </AppText>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                {monthOptions.map((option) => (
                  <FilterChip
                    key={option}
                    label={t('reports.monthOption', { count: option })}
                    selected={months === option}
                    onPress={() => {
                      setMonths(option);
                      setFromDate(format(startOfMonth(subMonths(new Date(), option - 1)), 'yyyy-MM-dd'));
                      setToDate(format(new Date(), 'yyyy-MM-dd'));
                    }}
                  />
                ))}
              </ScrollView>
              <View style={styles.dateGrid}>
                <DatePickerField
                  label={t('reports.from')}
                  value={fromDate}
                  placeholder={t('invoices.datePlaceholder')}
                  sheetTitle={t('reports.pickFromDate')}
                  onSelect={setFromDate}
                />
                <DatePickerField
                  label={t('reports.to')}
                  value={toDate}
                  placeholder={t('invoices.datePlaceholder')}
                  sheetTitle={t('reports.pickToDate')}
                  onSelect={setToDate}
                />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
                <FilterChip label={t('invoices.allStatuses')} selected={status === null} onPress={() => setStatus(null)} />
                {reportStatuses.map((invoiceStatus) => (
                  <FilterChip
                    key={invoiceStatus}
                    label={t(`invoices.statuses.${invoiceStatus}`)}
                    selected={status === invoiceStatus}
                    onPress={() => setStatus(invoiceStatus)}
                  />
                ))}
              </ScrollView>
            </AppCard>

            {reportsQuery.isLoading ? <LoadingState rows={4} /> : null}
            {reportsQuery.isError ? (
              <ErrorState message={reportsQuery.error.message} onRetry={() => reportsQuery.refetch()} />
            ) : null}

            {!reportsQuery.isLoading && !reportsQuery.isError && monthsData.length === 0 ? (
              <EmptyState title={t('reports.emptyTitle')} message={t('reports.emptyMessage')} />
            ) : null}

            {!reportsQuery.isLoading && !reportsQuery.isError && monthsData.length > 0 ? (
              <>
                <View style={styles.summaryGrid}>
                  <SummaryCard label={t('reports.paid')} value={totals.paid} currency={report?.currency ?? 'USD'} tone="success" />
                  <SummaryCard
                    label={t('reports.outstanding')}
                    value={totals.outstanding}
                    currency={report?.currency ?? 'USD'}
                    tone="primary"
                  />
                  <SummaryCard label={t('reports.overdue')} value={totals.overdue} currency={report?.currency ?? 'USD'} tone="danger" />
                  <AppCard style={styles.summaryCard}>
                    <View style={[styles.toneDot, { backgroundColor: theme.colors.info }]} />
                    <AppText variant="caption" color={theme.colors.textMuted}>
                      {t('reports.invoiceCount')}
                    </AppText>
                    <AppText variant="h2">{totals.invoiceCount}</AppText>
                  </AppCard>
                </View>

                <AppCard style={styles.chartCard}>
                  <View style={styles.sectionHeader}>
                    <AppText variant="h3">{t('reports.revenueAnalytics')}</AppText>
                    <View style={styles.legend}>
                      <LegendDot color={theme.colors.success} label={t('reports.paid')} />
                      <LegendDot color={theme.colors.primary} label={t('reports.outstanding')} />
                      <LegendDot color={theme.colors.error} label={t('reports.overdue')} />
                    </View>
                  </View>
                  <View style={styles.chart}>
                    {monthsData.map((month) => (
                      <View key={month.month} style={styles.monthColumn}>
                        <View style={styles.bars}>
                          <View style={[styles.paidBar, { height: Math.max(8, (month.paid / maxValue) * 120) }]} />
                          <View
                            style={[
                              styles.outstandingBar,
                              { height: Math.max(8, (month.outstanding / maxValue) * 120) },
                            ]}
                          />
                          <View style={[styles.overdueBar, { height: Math.max(8, (month.overdue / maxValue) * 120) }]} />
                        </View>
                        <AppText variant="caption" color={theme.colors.textMuted}>
                          {month.month.slice(5)}
                        </AppText>
                      </View>
                    ))}
                  </View>
                </AppCard>

                {canExport ? (
                  <AppCard style={styles.exportCard}>
                    <View style={styles.sectionHeader}>
                      <View>
                        <AppText variant="h3">{t('reports.exportTitle')}</AppText>
                        <AppText variant="caption" color={theme.colors.textMuted}>
                          {t('reports.exportSubtitle')}
                        </AppText>
                      </View>
                      <Ionicons name="download-outline" size={22} color={theme.colors.primary} />
                    </View>
                    {exportMutation.isError ? <ErrorState message={exportMutation.error.message} /> : null}
                    <View style={styles.actionRow}>
                      <AppButton
                        title={t('reports.exportPdf')}
                        iconName="document-text-outline"
                        fullWidth={false}
                        isLoading={exportMutation.isPending}
                        onPress={() => exportReport('pdf')}
                      />
                      <AppButton
                        title={t('reports.exportCsv')}
                        iconName="grid-outline"
                        variant="secondary"
                        fullWidth={false}
                        isLoading={exportMutation.isPending}
                        onPress={() => exportReport('csv')}
                      />
                    </View>
                  </AppCard>
                ) : null}
              </>
            ) : null}
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => (
          <AppCard style={styles.reportRow}>
            <View>
              <AppText variant="h3">{formatReportMonth(item.month)}</AppText>
              <AppText variant="bodySmall" color={theme.colors.textMuted}>
                {item.invoiceCount} {t('reports.invoiceCount')}
              </AppText>
            </View>
            <View style={styles.reportAmounts}>
              <MoneyText amount={item.paid} currency={report?.currency ?? 'USD'} />
              <MoneyText amount={item.outstanding} currency={report?.currency ?? 'USD'} color={theme.colors.textSecondary} />
            </View>
          </AppCard>
        )}
        refreshing={reportsQuery.isRefetching}
        onRefresh={reportsQuery.refetch}
      />
    </AppScreen>
  );
}

function SummaryCard({
  label,
  value,
  currency,
  tone,
}: {
  label: string;
  value: number;
  currency: string;
  tone: 'success' | 'primary' | 'danger';
}) {
  const colorByTone = {
    success: theme.colors.success,
    primary: theme.colors.primary,
    danger: theme.colors.error,
  };

  return (
    <AppCard style={styles.summaryCard}>
      <View style={[styles.toneDot, { backgroundColor: colorByTone[tone] }]} />
      <AppText variant="caption" color={theme.colors.textMuted}>
        {label}
      </AppText>
      <MoneyText amount={value} currency={currency} variant="h2" />
    </AppCard>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <AppText variant="caption" color={theme.colors.textMuted}>
        {label}
      </AppText>
    </View>
  );
}

function formatReportMonth(month: string): string {
  return formatDate(`${month}-01`, month);
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
    minHeight: 0,
  },
  headerContent: {
    gap: theme.spacing.md,
  },
  list: {
    flex: 1,
    minHeight: 0,
  },
  listContent: {
    gap: theme.spacing.md,
    padding: theme.spacing.md,
    paddingBottom: layout.bottomTabOverlayHeight,
  },
  filterCard: {
    gap: theme.spacing.md,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    justifyContent: 'space-between',
  },
  chips: {
    gap: theme.spacing.xs,
  },
  dateGrid: {
    gap: theme.spacing.sm,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  summaryCard: {
    flexBasis: '48%',
    flexGrow: 1,
    gap: theme.spacing.xs,
    minWidth: 145,
  },
  toneDot: {
    borderRadius: theme.radius.full,
    height: 8,
    width: 8,
  },
  chartCard: {
    gap: theme.spacing.md,
  },
  chart: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: theme.spacing.sm,
    height: 160,
    justifyContent: 'space-between',
  },
  monthColumn: {
    alignItems: 'center',
    flex: 1,
    gap: theme.spacing.xs,
  },
  bars: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 3,
    height: 130,
  },
  paidBar: {
    backgroundColor: theme.colors.success,
    borderRadius: theme.radius.full,
    width: 6,
  },
  outstandingBar: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.full,
    width: 6,
  },
  overdueBar: {
    backgroundColor: theme.colors.error,
    borderRadius: theme.radius.full,
    width: 6,
  },
  legend: {
    alignItems: 'flex-end',
    gap: theme.spacing.xxs,
  },
  legendItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: theme.spacing.xxs,
  },
  legendDot: {
    borderRadius: theme.radius.full,
    height: 6,
    width: 6,
  },
  exportCard: {
    gap: theme.spacing.md,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  reportRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reportAmounts: {
    alignItems: 'flex-end',
    gap: theme.spacing.xxs,
  },
  separator: {
    height: theme.spacing.sm,
  },
});
