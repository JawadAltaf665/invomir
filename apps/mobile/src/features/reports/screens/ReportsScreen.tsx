import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from '@tanstack/react-query';
import { format, subMonths } from 'date-fns';
import * as Sharing from 'expo-sharing';
import { useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
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
import { reportsApi } from '@/src/features/reports/api/reports-api';
import type {
  MonthlyReportMonthDto,
  ReportExportFormat,
  ReportInvoiceStatus,
} from '@/src/features/reports/types';
import { queryKeys } from '@/src/services/api/query-keys';
import { useAuthStore } from '@/src/store/auth-store';
import { theme } from '@/src/theme/theme';
import { permissions } from '@/src/types/permissions';
import { formatDate } from '@/src/utils/formatters';

const monthOptions = [6, 12, 24] as const;
const reportStatuses: readonly ReportInvoiceStatus[] = ['draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled'];

export function ReportsScreen() {
  const { t } = useTranslation();
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canView = hasPermission(permissions.report.view);
  const canExport = hasPermission(permissions.report.export);
  const [months, setMonths] = useState<(typeof monthOptions)[number]>(6);
  const [status, setStatus] = useState<ReportInvoiceStatus | null>(null);
  const [fromDate, setFromDate] = useState(() => getQuickRangeFromDate(6));
  const [toDate, setToDate] = useState(getTodayIsoDate);
  const queryMonthCount = useMemo(() => getReportMonthsToFetch(fromDate, months), [fromDate, months]);
  const selectedQuickOption = useMemo(
    () => monthOptions.find((option) => isRollingRange(option, fromDate, toDate)) ?? null,
    [fromDate, toDate],
  );
  const query = useMemo(() => ({ months: queryMonthCount, year: null, month: null }), [queryMonthCount]);
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
  const report = reportsQuery.data;
  const monthsData = useMemo(
    () => filterReportMonthsByRange(report?.months ?? [], fromDate, toDate),
    [report?.months, fromDate, toDate],
  );

  if (!canView) {
    return (
      <AppScreen>
        <PermissionState />
      </AppScreen>
    );
  }

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
  const hasRows = !reportsQuery.isLoading && !reportsQuery.isError && monthsData.length > 0;
  const rangeLabel = selectedQuickOption
    ? t('reports.lastMonths', { count: selectedQuickOption })
    : `${formatDate(fromDate, fromDate)} - ${formatDate(toDate, toDate)}`;

  const exportReport = (formatType: ReportExportFormat) => {
    exportMutation.mutate({
      format: formatType,
      from: fromDate,
      to: toDate,
      status,
    });
  };
  const handleQuickRange = (option: (typeof monthOptions)[number]) => {
    setMonths(option);
    setFromDate(getQuickRangeFromDate(option));
    setToDate(getTodayIsoDate());
  };
  const handleFromDate = (nextDate: string) => {
    setFromDate(nextDate);

    if (compareIsoDates(nextDate, toDate) > 0) {
      setToDate(nextDate);
    }
  };
  const handleToDate = (nextDate: string) => {
    setToDate(nextDate);

    if (compareIsoDates(nextDate, fromDate) < 0) {
      setFromDate(nextDate);
    }
  };

  return (
    <AppScreen padded={false} contentStyle={styles.content}>
      <AppHeader title={t('reports.title')} subtitle={t('reports.subtitle')} />

      <AppCard style={styles.filterCard}>
        <View style={styles.sectionHeader}>
          <AppText variant="h3">{t('reports.quickFilters')}</AppText>
          <AppText variant="caption" color={theme.colors.textMuted}>
            {rangeLabel}
          </AppText>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {monthOptions.map((option) => (
            <FilterChip
              key={option}
              label={t('reports.monthOption', { count: option })}
              selected={selectedQuickOption === option}
              onPress={() => handleQuickRange(option)}
            />
          ))}
        </ScrollView>
        <View style={styles.dateGrid}>
          <DatePickerField
            label={t('reports.from')}
            value={fromDate}
            placeholder={t('invoices.datePlaceholder')}
            sheetTitle={t('reports.pickFromDate')}
            onSelect={handleFromDate}
          />
          <DatePickerField
            label={t('reports.to')}
            value={toDate}
            placeholder={t('invoices.datePlaceholder')}
            sheetTitle={t('reports.pickToDate')}
            onSelect={handleToDate}
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

      {hasRows ? (
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

          <View style={styles.monthRows}>
            {monthsData.map((item) => (
              <AppCard key={item.month} style={styles.reportRow}>
                <View style={styles.reportCopy}>
                  <AppText variant="h3">{formatReportMonthPeriod(item.month, fromDate, toDate)}</AppText>
                  <AppText variant="bodySmall" color={theme.colors.textMuted}>
                    {item.invoiceCount} {t('reports.invoiceCount')}
                  </AppText>
                </View>
                <View style={styles.reportAmounts}>
                  <MoneyText amount={item.paid} currency={report?.currency ?? 'USD'} />
                  <MoneyText amount={item.outstanding} currency={report?.currency ?? 'USD'} color={theme.colors.textSecondary} />
                </View>
              </AppCard>
            ))}
          </View>
        </>
      ) : null}
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

function formatReportMonthPeriod(month: string, fromDate: string, toDate: string): string {
  const reportMonth = parseIsoDate(`${month}-01`);
  const from = parseIsoDate(fromDate);
  const to = parseIsoDate(toDate);

  if (!reportMonth || !from || !to) {
    return formatDate(`${month}-01`, month);
  }

  const monthStart = startOfLocalMonth(reportMonth);
  const periodStart = clampDateToMonth(monthStart.getFullYear(), monthStart.getMonth(), from.getDate());
  const nextPeriodStart = clampDateToMonth(monthStart.getFullYear(), monthStart.getMonth() + 1, from.getDate());
  const periodEnd = addDays(nextPeriodStart, -1);
  const clippedStart = periodStart < from ? from : periodStart;
  const clippedEnd = periodEnd > to ? to : periodEnd;

  if (clippedStart > clippedEnd) {
    return formatDisplayDate(clippedEnd);
  }

  if (isSameCalendarDay(clippedStart, clippedEnd)) {
    return formatDisplayDate(clippedStart);
  }

  return `${formatDisplayDate(clippedStart)} - ${formatDisplayDate(clippedEnd)}`;
}

function filterReportMonthsByRange(
  monthsData: readonly MonthlyReportMonthDto[],
  fromDate: string,
  toDate: string,
): readonly MonthlyReportMonthDto[] {
  const from = parseIsoDate(fromDate);
  const to = parseIsoDate(toDate);

  if (!from || !to) {
    return monthsData;
  }

  const rangeStart = startOfLocalMonth(from);
  const rangeEnd = startOfLocalMonth(to);

  return monthsData.filter((month) => {
    const reportMonth = parseIsoDate(`${month.month}-01`);

    if (!reportMonth) {
      return true;
    }

    const monthStart = startOfLocalMonth(reportMonth);
    return monthStart >= rangeStart && monthStart <= rangeEnd;
  });
}

function getReportMonthsToFetch(fromDate: string, fallbackMonths: number): number {
  const from = parseIsoDate(fromDate);

  if (!from) {
    return fallbackMonths;
  }

  const currentMonth = startOfLocalMonth(new Date());
  const fromMonth = startOfLocalMonth(from);
  const diff = monthsBetween(fromMonth, currentMonth) + 1;

  return Math.min(24, Math.max(1, diff));
}

function isRollingRange(monthCount: number, fromDate: string, toDate: string): boolean {
  const expectedFrom = getQuickRangeFromDate(monthCount);
  const expectedTo = getTodayIsoDate();

  return fromDate === expectedFrom && toDate === expectedTo;
}

function getQuickRangeFromDate(monthCount: number): string {
  return format(subMonths(new Date(), monthCount - 1), 'yyyy-MM-dd');
}

function getTodayIsoDate(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

function compareIsoDates(left: string, right: string): number {
  const leftDate = parseIsoDate(left);
  const rightDate = parseIsoDate(right);

  if (!leftDate || !rightDate) {
    return 0;
  }

  return leftDate.getTime() - rightDate.getTime();
}

function parseIsoDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function startOfLocalMonth(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

function clampDateToMonth(year: number, month: number, day: number): Date {
  const lastDay = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(day, lastDay));
}

function addDays(value: Date, days: number): Date {
  const next = new Date(value);
  next.setDate(value.getDate() + days);
  return next;
}

function isSameCalendarDay(left: Date, right: Date): boolean {
  return left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate();
}

function formatDisplayDate(value: Date): string {
  return [
    String(value.getDate()).padStart(2, '0'),
    String(value.getMonth() + 1).padStart(2, '0'),
    value.getFullYear(),
  ].join('-');
}

function monthsBetween(from: Date, to: Date): number {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
}

const styles = StyleSheet.create({
  content: {
    gap: theme.spacing.md,
    padding: theme.spacing.md,
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
  monthRows: {
    gap: theme.spacing.sm,
  },
  reportRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reportCopy: {
    flex: 1,
    paddingRight: theme.spacing.sm,
  },
  reportAmounts: {
    alignItems: 'flex-end',
    gap: theme.spacing.xxs,
  },
});
