import { ChangeDetectionStrategy, Component, effect, input, output } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { LucideSave } from '@lucide/angular';

import { SupportedCurrency } from '../../../../core/auth/auth.models';
import { UpdateUserProfileRequest, UserProfileDto } from '../../models/settings.models';
import { settingsCurrencyOptions } from '../../utils/settings-formatters';

type BusinessProfileFormGroup = FormGroup<{
  businessName: FormControl<string>;
  currency: FormControl<SupportedCurrency>;
  taxPercent: FormControl<number>;
}>;

import { TranslatePipe } from '../../../../core/i18n/translate.pipe';

@Component({
  selector: 'app-business-profile-form',
  standalone: true,
  host: {
    class: 'block h-full',
  },
  imports: [
    TranslatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    LucideSave,
  ],
  templateUrl: './business-profile-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BusinessProfileFormComponent {
  readonly profile = input<UserProfileDto | null>(null);
  readonly canManage = input(false);
  readonly isSaving = input(false);
  readonly errorMessages = input<readonly string[]>([]);
  readonly successMessage = input('');

  readonly saveRequested = output<UpdateUserProfileRequest>();

  protected readonly currencyOptions = settingsCurrencyOptions;
  protected readonly form: BusinessProfileFormGroup = new FormGroup({
    businessName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(200)],
    }),
    currency: new FormControl<SupportedCurrency>('USD', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    taxPercent: new FormControl(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0), Validators.max(100)],
    }),
  });

  constructor() {
    effect(() => {
      const profile = this.profile();

      if (profile) {
        this.form.patchValue(
          {
            businessName: profile.businessName,
            currency: this.toSupportedCurrency(profile.currency),
            taxPercent: profile.taxPercent,
          },
          { emitEvent: false },
        );
      }
    });

    effect(() => {
      if (this.canManage() && !this.isSaving()) {
        this.form.enable({ emitEvent: false });
        return;
      }

      this.form.disable({ emitEvent: false });
    });
  }

  protected submit(): void {
    if (!this.canManage() || this.isSaving() || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    this.saveRequested.emit({
      businessName: value.businessName.trim(),
      currency: value.currency,
      taxPercent: value.taxPercent,
    });
  }

  private toSupportedCurrency(value: string): SupportedCurrency {
    return this.currencyOptions.some((option) => option.value === value)
      ? (value as SupportedCurrency)
      : 'USD';
  }
}
