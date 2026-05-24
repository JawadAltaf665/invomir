import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';

import { DashboardRecentInvoiceItem, DashboardTone } from '../../models/dashboard.models';

interface DashboardRecentInvoiceView extends DashboardRecentInvoiceItem {
  statusClass: string;
  dueDateClass: string;
}

@Component({
  selector: 'app-recent-invoices',
  standalone: true,
  host: {
    class: 'block h-full',
  },
  templateUrl: './recent-invoices.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RecentInvoicesComponent {
  readonly invoices = input.required<readonly DashboardRecentInvoiceItem[]>();
  private readonly router = inject(Router);

  protected readonly displayInvoices = computed<readonly DashboardRecentInvoiceView[]>(() =>
    this.invoices().map((invoice) => ({
      ...invoice,
      statusClass: this.toStatusClass(invoice.statusTone),
      dueDateClass: this.toDueDateClass(invoice.dueDateTone),
    })),
  );

  protected goToInvoices(): void {
    void this.router.navigateByUrl('/app/invoices');
  }

  private toStatusClass(tone: DashboardTone): string {
    const classByTone: Record<DashboardTone, string> = {
      neutral: 'rounded-xl bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-600',
      primary: 'rounded-xl bg-primary/10 px-2 py-1 text-xs font-medium text-primary',
      success: 'rounded-xl bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700',
      warning: 'rounded-xl bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700',
      danger: 'rounded-xl bg-red-50 px-2 py-1 text-xs font-medium text-red-700',
    };

    return classByTone[tone];
  }

  private toDueDateClass(tone: DashboardTone): string {
    const classByTone: Record<DashboardTone, string> = {
      neutral: 'px-4 py-4 text-neutral-600',
      primary: 'px-4 py-4 text-primary',
      success: 'px-4 py-4 text-emerald-700',
      warning: 'px-4 py-4 font-medium text-amber-700',
      danger: 'px-4 py-4 font-medium text-red-700',
    };

    return classByTone[tone];
  }
}
