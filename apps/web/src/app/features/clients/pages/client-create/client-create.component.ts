import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { LucideArrowLeft } from '@lucide/angular';
import { finalize, map } from 'rxjs';

import { ApiResponseError, extractApiErrors } from '../../../../core/errors/api-response-error';
import { ApiResponse } from '../../../../core/models/api-response.model';
import { ClientFormComponent } from '../../components/client-form/client-form.component';
import { ClientDto, ClientSaveRequest } from '../../models/client.models';
import { ClientApiService } from '../../services/client-api.service';

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-client-create',
  standalone: true,
  imports: [TranslatePipe, RouterLink, ClientFormComponent, LucideArrowLeft],
  templateUrl: './client-create.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientCreateComponent {
  private readonly clientApi = inject(ClientApiService);
  private readonly router = inject(Router);

  protected readonly isSubmitting = signal(false);
  protected readonly errorMessages = signal<readonly string[]>([]);

  protected saveClient(request: ClientSaveRequest): void {
    if (this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessages.set([]);

    this.clientApi
      .createClient(request)
      .pipe(
        map((response) => this.unwrap(response, 'Client could not be saved.')),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: (client) => void this.router.navigate(['/app/clients', client.id]),
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
