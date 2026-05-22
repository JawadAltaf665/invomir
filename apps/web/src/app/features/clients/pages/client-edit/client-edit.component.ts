import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideArrowLeft } from '@lucide/angular';
import { finalize, map } from 'rxjs';

import { ApiResponseError, extractApiErrors } from '../../../../core/errors/api-response-error';
import { ApiResponse } from '../../../../core/models/api-response.model';
import { ClientFormComponent } from '../../components/client-form/client-form.component';
import { ClientDetailDto, ClientDto, ClientSaveRequest } from '../../models/client.models';
import { ClientApiService } from '../../services/client-api.service';

@Component({
  selector: 'app-client-edit',
  standalone: true,
  imports: [RouterLink, ClientFormComponent, LucideArrowLeft],
  templateUrl: './client-edit.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientEditComponent implements OnInit {
  private readonly clientApi = inject(ClientApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly client = signal<ClientDto | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessages = signal<readonly string[]>([]);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.loadClient();
  }

  protected saveClient(request: ClientSaveRequest): void {
    const clientId = this.route.snapshot.paramMap.get('id');

    if (!clientId || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessages.set([]);

    this.clientApi
      .updateClient(clientId, request)
      .pipe(
        map((response) => this.unwrap(response, 'Client could not be saved.')),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: (client) => void this.router.navigate(['/app/clients', client.id]),
        error: (error) => this.errorMessages.set(extractApiErrors(error)),
      });
  }

  private loadClient(): void {
    const clientId = this.route.snapshot.paramMap.get('id');

    if (!clientId || this.isLoading()) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessages.set([]);

    this.clientApi
      .getClient(clientId, 1, 5)
      .pipe(
        map((response) => this.unwrap(response, 'Client could not be loaded.')),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (client) => this.client.set(client),
        error: (error) => this.errorMessages.set(extractApiErrors(error)),
      });
  }

  private unwrap<T>(response: ApiResponse<T>, fallbackMessage: string): T {
    if (!response.success || response.data === null) {
      const message = response.message ?? response.errors[0] ?? fallbackMessage;
      throw new ApiResponseError(message, response.errors.length > 0 ? response.errors : [message]);
    }

    return response.data;
  }
}
