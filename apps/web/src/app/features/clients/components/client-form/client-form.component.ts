import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { LucideSave, LucideUserPlus } from '@lucide/angular';

import { InternationalPhoneInputComponent } from '../../../../shared/components/international-phone-input/international-phone-input.component';
import { ClientDto, ClientSaveRequest } from '../../models/client.models';

type ClientFormMode = 'create' | 'edit';

type ClientFormGroup = FormGroup<{
  name: FormControl<string>;
  email: FormControl<string>;
  phone: FormControl<string>;
  company: FormControl<string>;
  taxId: FormControl<string>;
  address: FormControl<string>;
  notes: FormControl<string>;
}>;

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [
    TranslatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    RouterLink,
    InternationalPhoneInputComponent,
    LucideSave,
    LucideUserPlus,
  ],
  templateUrl: './client-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClientFormComponent {
  readonly mode = input<ClientFormMode>('create');
  readonly client = input<ClientDto | null>(null);
  readonly isLoading = input(false);
  readonly isSubmitting = input(false);
  readonly errorMessages = input<readonly string[]>([]);

  readonly saveRequested = output<ClientSaveRequest>();

  protected readonly form: ClientFormGroup = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(200)],
    }),
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email, Validators.maxLength(255)],
    }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(16)] }),
    company: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(200)] }),
    taxId: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(100)] }),
    address: new FormControl('', { nonNullable: true }),
    notes: new FormControl('', { nonNullable: true }),
  });

  private patchedClientId: string | null = null;

  constructor() {
    effect(() => {
      const mode = this.mode();
      const client = this.client();

      if (mode === 'edit' && client && client.id !== this.patchedClientId) {
        this.patchForm(client);
        this.patchedClientId = client.id;
        return;
      }

      if (mode === 'create' && this.patchedClientId !== 'create') {
        this.form.reset(this.emptyFormValue());
        this.patchedClientId = 'create';
      }
    });
  }

  protected submit(): void {
    if (this.form.invalid || this.isSubmitting() || this.isLoading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.saveRequested.emit(this.toSaveRequest());
  }

  private patchForm(client: ClientDto): void {
    this.form.patchValue({
      name: client.name,
      email: client.email,
      phone: client.phone ?? '',
      company: client.company ?? '',
      taxId: client.taxId ?? '',
      address: client.address ?? '',
      notes: client.notes ?? '',
    });
  }

  private emptyFormValue(): ClientFormGroup['value'] {
    return {
      name: '',
      email: '',
      phone: '',
      company: '',
      taxId: '',
      address: '',
      notes: '',
    };
  }

  private toSaveRequest(): ClientSaveRequest {
    const value = this.form.getRawValue();

    return {
      name: value.name.trim(),
      email: value.email.trim(),
      phone: this.cleanOptional(value.phone),
      address: this.cleanOptional(value.address),
      company: this.cleanOptional(value.company),
      taxId: this.cleanOptional(value.taxId),
      notes: this.cleanOptional(value.notes),
    };
  }

  private cleanOptional(value: string): string | null {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }
}
