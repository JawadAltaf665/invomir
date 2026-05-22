import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { LucideFilePlus2, LucideRefreshCcw } from '@lucide/angular';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { permissions } from '../../../../core/permissions/permissions';
import { InvoiceFiltersComponent } from '../../components/invoice-filters/invoice-filters.component';
import { InvoiceTableComponent } from '../../components/invoice-table/invoice-table.component';
import { InvoiceListFilters } from '../../models/invoice.models';
import { InvoiceListStore } from '../../store/invoice-list.store';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [
    MatButtonModule,
    InvoiceFiltersComponent,
    InvoiceTableComponent,
    LucideFilePlus2,
    LucideRefreshCcw,
  ],
  templateUrl: './invoice-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceListComponent implements OnInit {
  protected readonly invoiceStore = inject(InvoiceListStore);
  private readonly authSession = inject(AuthSessionService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);

  protected readonly canCreateInvoice = computed(() =>
    this.authSession.hasPermission(permissions.invoice.create),
  );
  protected readonly canFilterByClient = computed(() =>
    this.authSession.hasPermission(permissions.client.view),
  );

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.invoiceStore.loadInvoices();

    if (this.canFilterByClient()) {
      this.invoiceStore.loadClients();
    }
  }

  protected refresh(): void {
    this.invoiceStore.loadInvoices({ page: this.invoiceStore.filters().page });
  }

  protected applyFilters(filters: Partial<InvoiceListFilters>): void {
    if (
      filters.searchTerm !== undefined &&
      filters.status === undefined &&
      filters.clientId === undefined &&
      filters.from === undefined &&
      filters.to === undefined
    ) {
      this.invoiceStore.setSearchTerm(filters.searchTerm);
      return;
    }

    this.invoiceStore.loadInvoices(filters);
  }

  protected resetFilters(): void {
    this.invoiceStore.resetFilters();
  }

  protected changePage(page: number): void {
    this.invoiceStore.loadInvoices({ page });
  }

  protected changePageSize(limit: number): void {
    this.invoiceStore.loadInvoices({ page: 1, limit });
  }

  protected createInvoice(): void {
    void this.router.navigate(['/app/invoices/new']);
  }
}
