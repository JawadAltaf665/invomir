import { NgClass, isPlatformBrowser } from '@angular/common';
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
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  LucideArrowLeft,
  LucideEdit3,
  LucideFilePlus2,
  LucideRefreshCcw,
  LucideTrash2,
} from '@lucide/angular';
import { finalize, map } from 'rxjs';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { ApiResponseError, extractApiErrors } from '../../../../core/errors/api-response-error';
import { ApiResponse } from '../../../../core/models/api-response.model';
import { TranslationService } from '../../../../core/i18n/translation.service';
import { permissions } from '../../../../core/permissions/permissions';
import { WorkspaceCurrencyRefreshService } from '../../../../core/services/workspace-currency-refresh.service';
import { ClientInvoiceHistoryComponent } from '../../components/client-invoice-history/client-invoice-history.component';
import { ClientDetailDto, ClientInvoiceSummaryDto } from '../../models/client.models';
import { ClientApiService } from '../../services/client-api.service';
import {
  clientInvoiceStatusClass,
  formatClientCurrency,
  formatClientDate,
} from '../../utils/client-formatters';

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-client-details',
  standalone: true,
  imports: [
    TranslatePipe,
    NgClass,
    MatButtonModule,
    RouterLink,
    ClientInvoiceHistoryComponent,
    LucideArrowLeft,
    LucideEdit3,
    LucideFilePlus2,
    LucideRefreshCcw,
    LucideTrash2,
  ],
  templateUrl: './client-details.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientDetailsComponent implements OnInit {
  private readonly clientApi = inject(ClientApiService);
  private readonly authSession = inject(AuthSessionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly workspaceCurrencyRefresh = inject(WorkspaceCurrencyRefreshService);
  private readonly translation = inject(TranslationService);

  protected readonly client = signal<ClientDetailDto | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly isMutating = signal(false);
  protected readonly errorMessages = signal<readonly string[]>([]);
  protected readonly invoicePage = signal(1);
  protected readonly invoicePageSize = signal(20);
  private observedCurrencyRefreshVersion = this.workspaceCurrencyRefresh.version();
  private readonly refreshOnWorkspaceCurrencyChange = effect(() => {
    const version = this.workspaceCurrencyRefresh.version();

    if (version === this.observedCurrencyRefreshVersion) {
      return;
    }

    this.observedCurrencyRefreshVersion = version;

    if (isPlatformBrowser(this.platformId)) {
      untracked(() =>
        this.loadClient(
          this.client()?.id ?? this.route.snapshot.paramMap.get('id') ?? undefined,
          this.invoicePage(),
          this.invoicePageSize(),
        ),
      );
    }
  });

  protected readonly canUpdateClient = computed(() =>
    this.authSession.hasPermission(permissions.client.update),
  );
  protected readonly canCreateInvoice = computed(() =>
    this.authSession.hasPermission(permissions.invoice.create),
  );
  protected readonly canDeleteClient = computed(() =>
    this.authSession.hasPermission(permissions.client.delete),
  );

  protected readonly invoiceRows = computed(() => {
    const client = this.client();

    if (!client) {
      return [];
    }

    return client.invoices.items.map((invoice) => this.toInvoiceRow(invoice));
  });

  protected readonly invoicePageInfo = computed(() => {
    const invoices = this.client()?.invoices;

    return {
      page: invoices?.page ?? this.invoicePage(),
      pageSize: invoices?.pageSize ?? this.invoicePageSize(),
      totalCount: invoices?.totalCount ?? 0,
      totalPages: invoices?.totalPages ?? 0,
    };
  });

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.loadClient();
  }

  protected refresh(): void {
    this.loadClient();
  }

  protected changeInvoicePage(page: number): void {
    this.invoicePage.set(page);
    this.loadClient(undefined, page, this.invoicePageSize());
  }

  protected changeInvoicePageSize(limit: number): void {
    this.invoicePage.set(1);
    this.invoicePageSize.set(limit);
    this.loadClient(undefined, 1, limit);
  }

  protected deleteClient(): void {
    const client = this.client();

    if (!client || this.isMutating()) {
      return;
    }

    const confirmed = window.confirm(
      this.translation.translate('clients.confirmDelete', { name: client.name }),
    );

    if (!confirmed) {
      return;
    }

    this.isMutating.set(true);
    this.errorMessages.set([]);

    this.clientApi
      .deleteClient(client.id)
      .pipe(finalize(() => this.isMutating.set(false)))
      .subscribe({
        next: () => void this.router.navigate(['/app/clients']),
        error: (error) => this.errorMessages.set(extractApiErrors(error)),
      });
  }

  protected formatMetric(value: number, currency: string): string {
    return formatClientCurrency(value, currency, this.translation.language());
  }

  protected formatField(value: string | null | undefined): string {
    return value?.trim() || this.translation.translate('common.notSet');
  }

  protected clientStatusLabel(client: ClientDetailDto): string {
    return client.isActive
      ? this.translation.translate('common.active')
      : this.translation.translate('common.inactive');
  }

  private loadClient(
    clientId = this.route.snapshot.paramMap.get('id') ?? undefined,
    page = this.invoicePage(),
    limit = this.invoicePageSize(),
  ): void {
    if (!clientId || this.isLoading()) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessages.set([]);

    this.clientApi
      .getClient(clientId, page, limit)
      .pipe(
        map((response) => this.unwrap(response, 'Client request failed.')),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (client) => this.client.set(client),
        error: (error) => this.errorMessages.set(extractApiErrors(error)),
      });
  }

  private toInvoiceRow(invoice: ClientInvoiceSummaryDto) {
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      statusLabel: this.translation.translate(`invoiceStatus.${invoice.status.toLowerCase()}`),
      statusClass: clientInvoiceStatusClass(invoice.status),
      totalDisplay: formatClientCurrency(
        invoice.total,
        invoice.currency,
        this.translation.language(),
      ),
      dueDateDisplay: formatClientDate(
        invoice.dueDate,
        this.translation.language(),
        this.translation.translate('common.notSet'),
      ),
    };
  }

  private unwrap<T>(response: ApiResponse<T>, fallbackMessage: string): T {
    if (!response.success || response.data === null) {
      const message = response.message ?? response.errors[0] ?? fallbackMessage;
      throw new ApiResponseError(message, response.errors.length > 0 ? response.errors : [message]);
    }

    return response.data;
  }
}
