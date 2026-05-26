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
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  LucideArrowLeft,
  LucideBan,
  LucideBanknote,
  LucideChevronDown,
  LucideCopy,
  LucideDownload,
  LucideEdit3,
  LucideEye,
  LucideRefreshCcw,
  LucideSend,
  LucideTrash2,
} from '@lucide/angular';
import { Observable, finalize, map } from 'rxjs';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { ApiResponseError, extractApiErrors } from '../../../../core/errors/api-response-error';
import { ApiResponse } from '../../../../core/models/api-response.model';
import { permissions } from '../../../../core/permissions/permissions';
import { WorkspaceCurrencyRefreshService } from '../../../../core/services/workspace-currency-refresh.service';
import { InvoiceStatusBadgeComponent } from '../../components/invoice-status-badge/invoice-status-badge.component';
import { InvoiceTotalsSummaryComponent } from '../../components/invoice-totals-summary/invoice-totals-summary.component';
import { InvoiceDetailDto } from '../../models/invoice.models';
import { InvoiceApiService } from '../../services/invoice-api.service';
import {
  formatInvoiceCurrency,
  formatInvoiceDate,
  formatInvoiceDateTime,
} from '../../utils/invoice-formatters';

@Component({
  selector: 'app-invoice-detail',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDividerModule,
    MatMenuModule,
    MatSlideToggleModule,
    RouterLink,
    InvoiceStatusBadgeComponent,
    InvoiceTotalsSummaryComponent,
    LucideArrowLeft,
    LucideBan,
    LucideBanknote,
    LucideChevronDown,
    LucideCopy,
    LucideDownload,
    LucideEdit3,
    LucideEye,
    LucideRefreshCcw,
    LucideSend,
    LucideTrash2,
  ],
  templateUrl: './invoice-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceDetailComponent implements OnInit {
  private readonly invoiceApi = inject(InvoiceApiService);
  private readonly authSession = inject(AuthSessionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly workspaceCurrencyRefresh = inject(WorkspaceCurrencyRefreshService);

  protected readonly invoice = signal<InvoiceDetailDto | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly isMutating = signal(false);
  protected readonly errorMessages = signal<readonly string[]>([]);
  protected readonly permissions = permissions;

  protected readonly canEdit = computed(() => {
    const invoice = this.invoice();
    return (
      !!invoice && invoice.status === 'draft' && this.hasPermission(permissions.invoice.update)
    );
  });

  protected readonly canSend = computed(() => {
    const invoice = this.invoice();
    return !!invoice && invoice.status === 'draft' && this.hasPermission(permissions.invoice.send);
  });

  protected readonly canResend = computed(() => {
    const invoice = this.invoice();
    return (
      !!invoice &&
      ['sent', 'viewed', 'overdue'].includes(invoice.status) &&
      this.hasPermission(permissions.invoice.send)
    );
  });

  protected readonly canCancel = computed(() => {
    const invoice = this.invoice();
    return (
      !!invoice &&
      ['sent', 'viewed', 'overdue'].includes(invoice.status) &&
      this.hasPermission(permissions.invoice.cancel)
    );
  });

  protected readonly canMarkPaid = computed(() => {
    const invoice = this.invoice();
    return (
      !!invoice &&
      !['paid', 'cancelled'].includes(invoice.status) &&
      this.hasPermission(permissions.invoice.markPaid)
    );
  });

  protected readonly canUseReminders = computed(() => {
    const invoice = this.invoice();
    return (
      !!invoice &&
      !['paid', 'cancelled'].includes(invoice.status) &&
      this.hasPermission(permissions.invoice.manageReminders)
    );
  });

  protected readonly canDuplicate = computed(() =>
    this.authSession.hasPermission(permissions.invoice.duplicate),
  );

  protected readonly canDelete = computed(() => {
    const invoice = this.invoice();
    return !!invoice && invoice.status !== 'paid' && this.hasPermission(permissions.invoice.delete);
  });

  protected readonly hasNonDestructiveActions = computed(
    () =>
      this.canEdit() ||
      this.canSend() ||
      this.canResend() ||
      this.canMarkPaid() ||
      this.canDuplicate() ||
      this.canCancel(),
  );

  protected readonly hasMoreActions = computed(
    () => this.hasNonDestructiveActions() || this.canDelete(),
  );
  private observedCurrencyRefreshVersion = this.workspaceCurrencyRefresh.version();
  private readonly refreshOnWorkspaceCurrencyChange = effect(() => {
    const version = this.workspaceCurrencyRefresh.version();

    if (version === this.observedCurrencyRefreshVersion) {
      return;
    }

    this.observedCurrencyRefreshVersion = version;

    if (isPlatformBrowser(this.platformId)) {
      this.loadInvoice(this.invoice()?.id ?? this.route.snapshot.paramMap.get('id'));
    }
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.loadInvoice();
  }

  protected refresh(): void {
    this.loadInvoice();
  }

  protected sendInvoice(): void {
    const invoice = this.invoice();

    if (!invoice || !this.canSend()) {
      return;
    }

    this.executeAction(this.invoiceApi.sendInvoice(invoice.id), () => this.loadInvoice(invoice.id));
  }

  protected resendInvoice(): void {
    const invoice = this.invoice();

    if (!invoice || !this.canResend()) {
      return;
    }

    this.executeAction(this.invoiceApi.resendInvoice(invoice.id), () =>
      this.loadInvoice(invoice.id),
    );
  }

  protected markPaid(): void {
    const invoice = this.invoice();

    if (!invoice || !this.canMarkPaid()) {
      return;
    }

    const confirmed = window.confirm(`Mark ${invoice.invoiceNumber} as paid?`);
    if (!confirmed) {
      return;
    }

    this.executeAction(this.invoiceApi.markPaid(invoice.id, { method: 'other' }), () =>
      this.loadInvoice(invoice.id),
    );
  }

  protected cancelInvoice(): void {
    const invoice = this.invoice();

    if (!invoice || !this.canCancel()) {
      return;
    }

    const confirmed = window.confirm(`Cancel ${invoice.invoiceNumber}?`);
    if (!confirmed) {
      return;
    }

    this.executeAction(this.invoiceApi.cancelInvoice(invoice.id), () =>
      this.loadInvoice(invoice.id),
    );
  }

  protected duplicateInvoice(): void {
    const invoice = this.invoice();

    if (!invoice || !this.canDuplicate()) {
      return;
    }

    this.executeAction(this.invoiceApi.duplicateInvoice(invoice.id), (duplicate) => {
      void this.router.navigate(['/app/invoices', duplicate.id]);
    });
  }

  protected deleteInvoice(): void {
    const invoice = this.invoice();

    if (!invoice || !this.canDelete()) {
      return;
    }

    const confirmed = window.confirm(`Delete or cancel ${invoice.invoiceNumber}?`);
    if (!confirmed) {
      return;
    }

    this.executeAction(this.invoiceApi.deleteInvoice(invoice.id), () => {
      void this.router.navigate(['/app/invoices']);
    });
  }

  protected updateReminders(enabled: boolean): void {
    const invoice = this.invoice();

    if (!invoice || !this.canUseReminders()) {
      return;
    }

    this.executeAction(this.invoiceApi.updateReminders(invoice.id, { enabled }), () =>
      this.loadInvoice(invoice.id),
    );
  }

  protected previewPdf(): void {
    this.handlePdf(true);
  }

  protected downloadPdf(): void {
    this.handlePdf(false);
  }

  protected formatCurrency(value: number, currency: string): string {
    return formatInvoiceCurrency(value, currency);
  }

  protected formatDate(value: string | null | undefined): string {
    return formatInvoiceDate(value);
  }

  protected formatDateTime(value: string | null | undefined): string {
    return formatInvoiceDateTime(value);
  }

  protected hasPermission(permission: string): boolean {
    return this.authSession.hasPermission(permission);
  }

  private loadInvoice(invoiceId = this.route.snapshot.paramMap.get('id')): void {
    if (!invoiceId || this.isLoading()) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessages.set([]);

    this.invoiceApi
      .getInvoice(invoiceId, { useWorkspaceCurrency: true })
      .pipe(
        map((response) => this.unwrap(response, 'Invoice request failed.')),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (invoice) => this.invoice.set(invoice),
        error: (error) => this.errorMessages.set(extractApiErrors(error)),
      });
  }

  private executeAction<T>(
    request$: Observable<ApiResponse<T>>,
    onSuccess: (response: T) => void = () => undefined,
  ): void {
    if (this.isMutating()) {
      return;
    }

    this.isMutating.set(true);
    this.errorMessages.set([]);

    request$
      .pipe(
        map((response) => this.unwrap(response, 'Invoice action failed.')),
        finalize(() => this.isMutating.set(false)),
      )
      .subscribe({
        next: (result) => onSuccess(result),
        error: (error) => this.errorMessages.set(extractApiErrors(error)),
      });
  }

  private handlePdf(preview: boolean): void {
    const invoice = this.invoice();

    if (!invoice || this.isMutating()) {
      return;
    }

    this.isMutating.set(true);
    this.errorMessages.set([]);

    this.invoiceApi
      .downloadPdf(invoice.id, preview)
      .pipe(finalize(() => this.isMutating.set(false)))
      .subscribe({
        next: (blob) => this.openPdfBlob(blob, invoice.invoiceNumber, preview),
        error: (error) => this.errorMessages.set(extractApiErrors(error)),
      });
  }

  private openPdfBlob(blob: Blob, invoiceNumber: string, preview: boolean): void {
    const url = URL.createObjectURL(blob);

    if (preview) {
      window.open(url, '_blank', 'noopener');
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
      return;
    }

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
