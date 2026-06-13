import { apiRequest } from '@/src/services/api/api-client';
import {
  MonthlyReportsDto,
  MonthlyReportsQuery,
  ReportExportQuery,
  ReportExportResult,
} from '@/src/features/reports/types';

export const reportsApi = {
  getMonthlyReports(query: MonthlyReportsQuery): Promise<MonthlyReportsDto> {
    return apiRequest<MonthlyReportsDto>({
      method: 'GET',
      url: '/api/reports/monthly',
      params: {
        months: Math.min(24, Math.max(1, query.months)),
        year: query.year ?? undefined,
        month: query.month ?? undefined,
      },
    });
  },

  async exportReport(query: ReportExportQuery): Promise<ReportExportResult> {
    const { exportReportFile } = await import('@/src/features/reports/api/reports-export');
    return exportReportFile(query);
  },
};
