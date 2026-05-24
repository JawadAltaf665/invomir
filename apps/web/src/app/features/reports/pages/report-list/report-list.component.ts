import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  PLATFORM_ID,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { LucideRefreshCcw } from '@lucide/angular';
import { finalize } from 'rxjs';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { extractApiErrors } from '../../../../core/errors/api-response-error';
import { permissions } from '../../../../core/permissions/permissions';
import { WorkspaceCurrencyRefreshService } from '../../../../core/services/workspace-currency-refresh.service';
import { ReportBreakdownTableComponent } from '../../components/report-breakdown-table/report-breakdown-table.component';
import { ReportExportPanelComponent } from '../../components/report-export-panel/report-export-panel.component';
import { ReportFiltersComponent } from '../../components/report-filters/report-filters.component';
import { ReportMonthlyChartComponent } from '../../components/report-monthly-chart/report-monthly-chart.component';
import { ReportSummaryCardComponent } from '../../components/report-summary-card/report-summary-card.component';
import { ReportExportQuery, ReportFilters } from '../../models/report.models';
import { ReportApiService } from '../../services/report-api.service';
import { ReportStore } from '../../store/report.store';
import { buildReportFileName } from '../../utils/report-formatters';

@Component({
  selector: 'app-report-list',
  standalone: true,
  imports: [
    MatButtonModule,
    ReportBreakdownTableComponent,
    ReportExportPanelComponent,
    ReportFiltersComponent,
    ReportMonthlyChartComponent,
    ReportSummaryCardComponent,
    LucideRefreshCcw,
  ],
  templateUrl: './report-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportListComponent implements OnInit {
  protected readonly reportStore = inject(ReportStore);
  private readonly authSession = inject(AuthSessionService);
  private readonly reportApi = inject(ReportApiService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly workspaceCurrencyRefresh = inject(WorkspaceCurrencyRefreshService);
  private observedCurrencyRefreshVersion = this.workspaceCurrencyRefresh.version();
  private readonly refreshOnWorkspaceCurrencyChange = effect(() => {
    const version = this.workspaceCurrencyRefresh.version();

    if (version === this.observedCurrencyRefreshVersion) {
      return;
    }

    this.observedCurrencyRefreshVersion = version;

    if (isPlatformBrowser(this.platformId)) {
      this.reportStore.loadReports();
    }
  });

  protected readonly isExporting = signal(false);
  protected readonly exportErrorMessages = signal<readonly string[]>([]);
  protected readonly skeletonCards = [1, 2, 3, 4];

  protected readonly canExportReports = computed(() =>
    this.authSession.hasPermission(permissions.report.export),
  );

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.reportStore.loadReports();
  }

  protected refresh(): void {
    this.reportStore.loadReports();
  }

  protected applyFilters(filters: Partial<ReportFilters>): void {
    this.reportStore.loadReports(filters);
  }

  protected resetFilters(): void {
    this.reportStore.resetFilters();
  }

  protected exportReport(query: ReportExportQuery): void {
    if (!this.canExportReports() || this.isExporting() || !isPlatformBrowser(this.platformId)) {
      return;
    }

    this.isExporting.set(true);
    this.exportErrorMessages.set([]);

    this.reportApi
      .exportReport(query)
      .pipe(finalize(() => this.isExporting.set(false)))
      .subscribe({
        next: (response) => {
          const blob = response.body;

          if (!blob) {
            this.exportErrorMessages.set(['Report export returned an empty file.']);
            return;
          }

          this.downloadBlob(
            blob,
            this.resolveFileName(response.headers.get('content-disposition'), query),
          );
        },
        error: (error) => this.exportErrorMessages.set(extractApiErrors(error)),
      });
  }

  private resolveFileName(contentDisposition: string | null, query: ReportExportQuery): string {
    const match = contentDisposition?.match(/filename="?([^"]+)"?/i);
    return match?.[1] ?? buildReportFileName(query.format, query.from, query.to);
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
