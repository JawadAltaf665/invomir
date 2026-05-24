import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, PLATFORM_ID, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { LucideRefreshCcw } from '@lucide/angular';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { AuditLogFiltersComponent } from '../../components/audit-log-filters/audit-log-filters.component';
import { AuditLogTableComponent } from '../../components/audit-log-table/audit-log-table.component';
import { AuditLogListFilters } from '../../models/audit-log.models';
import { AuditLogListStore } from '../../store/audit-log-list.store';

@Component({
  selector: 'app-audit-log-list',
  standalone: true,
  imports: [MatButtonModule, AuditLogFiltersComponent, AuditLogTableComponent, LucideRefreshCcw],
  templateUrl: './audit-log-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditLogListComponent implements OnInit {
  protected readonly auditLogStore = inject(AuditLogListStore);
  private readonly authSession = inject(AuthSessionService);
  private readonly platformId = inject(PLATFORM_ID);
  protected readonly isSystemAdmin = computed(() => this.authSession.role()?.toLowerCase() === 'system_admin');

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.auditLogStore.loadAuditLogs();
  }

  protected refresh(): void {
    this.auditLogStore.loadAuditLogs({ page: this.auditLogStore.filters().page });
  }

  protected applyFilters(filters: Partial<AuditLogListFilters>): void {
    this.auditLogStore.loadAuditLogs(filters);
  }

  protected resetFilters(): void {
    this.auditLogStore.resetFilters();
  }

  protected changePage(page: number): void {
    this.auditLogStore.loadAuditLogs({ page });
  }

  protected changePageSize(limit: number): void {
    this.auditLogStore.loadAuditLogs({ page: 1, limit });
  }
}
