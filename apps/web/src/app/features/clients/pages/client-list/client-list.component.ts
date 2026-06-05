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
import { LucideRefreshCcw, LucideUserPlus } from '@lucide/angular';
import { finalize } from 'rxjs';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { extractApiErrors } from '../../../../core/errors/api-response-error';
import { TranslationService } from '../../../../core/i18n/translation.service';
import { permissions } from '../../../../core/permissions/permissions';
import { WorkspaceCurrencyRefreshService } from '../../../../core/services/workspace-currency-refresh.service';
import { ClientSearchComponent } from '../../components/client-search/client-search.component';
import { ClientTableComponent } from '../../components/client-table/client-table.component';
import { ClientListFilters, ClientListItemView } from '../../models/client.models';
import { ClientApiService } from '../../services/client-api.service';
import { ClientListStore } from '../../store/client-list.store';

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-client-list',
  standalone: true,
  imports: [
    TranslatePipe,
    MatButtonModule,
    ClientSearchComponent,
    ClientTableComponent,
    LucideRefreshCcw,
    LucideUserPlus,
  ],
  templateUrl: './client-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientListComponent implements OnInit {
  protected readonly clientStore = inject(ClientListStore);
  private readonly authSession = inject(AuthSessionService);
  private readonly clientApi = inject(ClientApiService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly workspaceCurrencyRefresh = inject(WorkspaceCurrencyRefreshService);
  private readonly translation = inject(TranslationService);

  protected readonly isDeleting = signal(false);
  protected readonly actionErrorMessages = signal<readonly string[]>([]);
  private observedCurrencyRefreshVersion = this.workspaceCurrencyRefresh.version();
  private readonly refreshOnWorkspaceCurrencyChange = effect(() => {
    const version = this.workspaceCurrencyRefresh.version();

    if (version === this.observedCurrencyRefreshVersion) {
      return;
    }

    this.observedCurrencyRefreshVersion = version;

    if (isPlatformBrowser(this.platformId)) {
      untracked(() => this.clientStore.loadClients({ page: this.clientStore.filters().page }));
    }
  });

  protected readonly canCreateClient = computed(() =>
    this.authSession.hasPermission(permissions.client.create),
  );
  protected readonly canCreateInvoice = computed(() =>
    this.authSession.hasPermission(permissions.invoice.create),
  );
  protected readonly canUpdateClient = computed(() =>
    this.authSession.hasPermission(permissions.client.update),
  );
  protected readonly canDeleteClient = computed(() =>
    this.authSession.hasPermission(permissions.client.delete),
  );

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.clientStore.loadClients();
  }

  protected refresh(): void {
    this.clientStore.loadClients({ page: this.clientStore.filters().page });
  }

  protected applyFilters(filters: Partial<ClientListFilters>): void {
    this.clientStore.loadClients(filters);
  }

  protected resetFilters(): void {
    this.clientStore.resetFilters();
  }

  protected changePage(page: number): void {
    this.clientStore.loadClients({ page });
  }

  protected changePageSize(limit: number): void {
    this.clientStore.loadClients({ page: 1, limit });
  }

  protected createClient(): void {
    void this.router.navigate(['/app/clients/new']);
  }

  protected deleteClient(client: ClientListItemView): void {
    if (this.isDeleting()) {
      return;
    }

    const confirmed = window.confirm(
      this.translation.translate('clients.confirmDelete', { name: client.name }),
    );

    if (!confirmed) {
      return;
    }

    this.isDeleting.set(true);
    this.actionErrorMessages.set([]);

    this.clientApi
      .deleteClient(client.id)
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: () => this.clientStore.loadClients({ page: this.clientStore.pageInfo().page }),
        error: (error) => this.actionErrorMessages.set(extractApiErrors(error)),
      });
  }
}
