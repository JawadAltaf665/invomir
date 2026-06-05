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
  untracked,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import { LucideFilePlus2, LucideRefreshCcw } from '@lucide/angular';
import { Observable, finalize, map } from 'rxjs';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { ApiResponseError, extractApiErrors } from '../../../../core/errors/api-response-error';
import { ApiResponse } from '../../../../core/models/api-response.model';
import { TranslationService } from '../../../../core/i18n/translation.service';
import { permissions } from '../../../../core/permissions/permissions';
import { WorkspaceCurrencyRefreshService } from '../../../../core/services/workspace-currency-refresh.service';
import { InvoiceFiltersComponent } from '../../components/invoice-filters/invoice-filters.component';
import { InvoiceTableComponent } from '../../components/invoice-table/invoice-table.component';
import { InvoiceApiService } from '../../services/invoice-api.service';
import { InvoiceListFilters, InvoiceTableActionEvent } from '../../models/invoice.models';
import { InvoiceListStore } from '../../store/invoice-list.store';

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [
    TranslatePipe,
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
  private readonly invoiceApi = inject(InvoiceApiService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly workspaceCurrencyRefresh = inject(WorkspaceCurrencyRefreshService);
  private readonly translation = inject(TranslationService);
  protected readonly isActionRunning = signal(false);
  protected readonly actionErrorMessages = signal<readonly string[]>([]);
  private observedCurrencyRefreshVersion = this.workspaceCurrencyRefresh.version();
  private readonly refreshOnWorkspaceCurrencyChange = effect(() => {
    const version = this.workspaceCurrencyRefresh.version();

    if (version === this.observedCurrencyRefreshVersion) {
      return;
    }

    this.observedCurrencyRefreshVersion = version;

    if (isPlatformBrowser(this.platformId)) {
      untracked(() => this.invoiceStore.loadInvoices({ page: this.invoiceStore.filters().page }));
    }
  });

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

  protected changeSort(sortBy: InvoiceListFilters['sortBy']): void {
    this.invoiceStore.toggleSort(sortBy);
  }

  protected handleInvoiceAction(event: InvoiceTableActionEvent): void {
    switch (event.action) {
      case 'send':
        this.executeAction(this.invoiceApi.sendInvoice(event.invoice.id));
        return;
      case 'resend':
        this.executeAction(this.invoiceApi.resendInvoice(event.invoice.id));
        return;
      case 'markPaid':
        if (
          window.confirm(
            this.translation.translate('invoices.confirmMarkPaid', {
              invoiceNumber: event.invoice.invoiceNumber,
            }),
          )
        ) {
          this.executeAction(this.invoiceApi.markPaid(event.invoice.id, { method: 'other' }));
        }
        return;
      case 'downloadPdf':
        this.downloadPdf(event.invoice.id, event.invoice.invoiceNumber);
        return;
      case 'cancel':
        if (
          window.confirm(
            this.translation.translate('invoices.confirmCancel', {
              invoiceNumber: event.invoice.invoiceNumber,
            }),
          )
        ) {
          this.executeAction(this.invoiceApi.cancelInvoice(event.invoice.id));
        }
        return;
    }
  }

  protected createInvoice(): void {
    void this.router.navigate(['/app/invoices/new']);
  }

  private executeAction<T>(request$: Observable<ApiResponse<T>>): void {
    if (this.isActionRunning()) {
      return;
    }

    this.isActionRunning.set(true);
    this.actionErrorMessages.set([]);

    request$
      .pipe(
        map((response) => this.unwrap(response, 'Invoice action failed.')),
        finalize(() => this.isActionRunning.set(false)),
      )
      .subscribe({
        next: () => this.invoiceStore.loadInvoices({ page: this.invoiceStore.filters().page }),
        error: (error) => this.actionErrorMessages.set(extractApiErrors(error)),
      });
  }

  private downloadPdf(id: string, invoiceNumber: string): void {
    if (this.isActionRunning()) {
      return;
    }

    this.isActionRunning.set(true);
    this.actionErrorMessages.set([]);

    this.invoiceApi
      .downloadPdf(id)
      .pipe(finalize(() => this.isActionRunning.set(false)))
      .subscribe({
        next: (blob) => this.savePdfBlob(blob, invoiceNumber),
        error: (error) => this.actionErrorMessages.set(extractApiErrors(error)),
      });
  }

  private savePdfBlob(blob: Blob, invoiceNumber: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${invoiceNumber}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private unwrap<T>(response: ApiResponse<T>, fallbackMessage: string): T {
    if (!response.success || response.data === null) {
      const message = response.message ?? response.errors[0] ?? fallbackMessage;
      throw new ApiResponseError(message, response.errors.length > 0 ? response.errors : [message]);
    }

    return response.data;
  }
}
