import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  computed,
  Component,
  DestroyRef,
  forwardRef,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  ControlValueAccessor,
  FormControl,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { LucideChevronDown } from '@lucide/angular';

import { extractApiErrors } from '../../../core/errors/api-response-error';
import { LookupApiService } from '../../../core/services/lookup-api.service';
import { CallingCountry } from '../../models/calling-country.model';

const internationalPhonePattern = /^\+[1-9]\d{4,14}$/;

@Component({
  selector: 'app-international-phone-input',
  standalone: true,
  host: {
    class: 'block w-full',
  },
  imports: [NgClass, ReactiveFormsModule, MatAutocompleteModule, LucideChevronDown],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InternationalPhoneInputComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => InternationalPhoneInputComponent),
      multi: true,
    },
  ],
  templateUrl: './international-phone-input.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InternationalPhoneInputComponent implements ControlValueAccessor, Validator, OnInit {
  readonly label = input('Phone');
  readonly defaultCountryIso = input('PK');
  readonly optional = input(true);

  protected readonly countryQuery = new FormControl<CallingCountry | string>('', {
    nonNullable: true,
  });
  protected readonly nationalNumber = new FormControl('', { nonNullable: true });
  protected readonly countries = signal<readonly CallingCountry[]>([]);
  protected readonly selectedCountry = signal<CallingCountry | null>(null);
  protected readonly countrySearch = signal('');
  protected readonly isDisabled = signal(false);
  protected readonly isLoadingCountries = signal(false);
  protected readonly countryErrorMessage = signal('');

  protected readonly filteredCountries = computed(() => {
    const query = normalizeSearch(this.countrySearch());
    const countries = this.countries();

    if (!query) {
      return countries;
    }

    return countries.filter((country) =>
      normalizeSearch(`${country.name} ${country.iso2} +${country.dialCode}`).includes(query),
    );
  });

  protected readonly phoneErrorMessage = computed(() => {
    const errors = this.currentValidationErrors();

    if (!errors || !(this.nationalNumber.touched || this.nationalNumber.dirty)) {
      return '';
    }

    if (errors['internationalPhoneMin']) {
      return 'Enter a complete international phone number.';
    }

    if (errors['internationalPhoneMax']) {
      return 'Phone number cannot exceed 15 digits including country code.';
    }

    return 'Enter a valid international phone number.';
  });

  protected readonly normalizedPreview = computed(() => {
    const digits = this.localDigits();
    const country = this.selectedCountry();
    return country && digits ? `+${country.dialCode}${digits}` : '';
  });
  protected readonly hasError = computed(
    () => Boolean(this.countryErrorMessage()) || Boolean(this.phoneErrorMessage()),
  );

  private readonly lookupApi = inject(LookupApiService);
  private readonly destroyRef = inject(DestroyRef);
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;
  private onValidatorChange: () => void = () => undefined;
  private isWritingValue = false;
  private pendingValue: string | null | undefined = undefined;

  constructor() {
    this.nationalNumber.addValidators(() => this.currentValidationErrors());

    this.countryQuery.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      this.countrySearch.set(typeof value === 'string' ? value : this.countryLabel(value));
    });

    this.nationalNumber.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => this.handleNationalNumberChange(value));
  }

  ngOnInit(): void {
    this.loadCountries();
  }

  writeValue(value: string | null): void {
    if (this.countries().length === 0) {
      this.pendingValue = value;
      return;
    }

    this.isWritingValue = true;

    if (!value) {
      this.setCountry(this.defaultCountry(), false);
      this.nationalNumber.setValue('', { emitEvent: false });
      this.isWritingValue = false;
      this.refreshValidation();
      return;
    }

    this.applyInternationalValue(value, false);
    this.isWritingValue = false;
    this.refreshValidation();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);

    if (isDisabled) {
      this.countryQuery.disable({ emitEvent: false });
      this.nationalNumber.disable({ emitEvent: false });
      return;
    }

    this.countryQuery.enable({ emitEvent: false });
    this.nationalNumber.enable({ emitEvent: false });
  }

  validate(_: AbstractControl): ValidationErrors | null {
    return this.currentValidationErrors();
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  protected displayCountry = (value: CallingCountry | string | null): string => {
    if (!value) {
      return '';
    }

    return typeof value === 'string' ? value : this.compactCountryLabel(value);
  };

  protected selectCountry(event: MatAutocompleteSelectedEvent): void {
    const country = event.option.value as CallingCountry;
    this.setCountry(country, true);
    this.markTouched();
  }

  protected countryLabel(country: CallingCountry | null): string {
    if (!country) {
      return '';
    }

    return `${country.name} (+${country.dialCode})`;
  }

  protected compactCountryLabel(country: CallingCountry | null): string {
    if (!country) {
      return '';
    }

    return `${country.iso2} +${country.dialCode}`;
  }

  protected markTouched(): void {
    this.nationalNumber.markAsTouched();
    this.onTouched();
    this.refreshValidation();
  }

  protected restoreSelectedCountry(): void {
    const country = this.selectedCountry();

    if (!country) {
      return;
    }

    this.countryQuery.setValue(country, { emitEvent: false });
    this.countrySearch.set(this.countryLabel(country));
  }

  private loadCountries(): void {
    if (this.isLoadingCountries()) {
      return;
    }

    this.isLoadingCountries.set(true);
    this.countryErrorMessage.set('');

    this.lookupApi
      .listCallingCountries()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (countries) => {
          this.countries.set(countries);
          this.applyLoadedCountryState();
          this.isLoadingCountries.set(false);
        },
        error: (error) => {
          this.countryErrorMessage.set(extractApiErrors(error)[0] ?? 'Countries failed to load.');
          this.isLoadingCountries.set(false);
          this.refreshValidation();
        },
      });
  }

  private applyLoadedCountryState(): void {
    this.isWritingValue = true;

    if (this.pendingValue !== undefined) {
      const pendingValue = this.pendingValue;
      this.pendingValue = undefined;

      if (pendingValue) {
        this.applyInternationalValue(pendingValue, false);
      } else {
        this.setCountry(this.defaultCountry(), false);
        this.nationalNumber.setValue('', { emitEvent: false });
      }
    } else {
      this.setCountry(this.defaultCountry(), false);
    }

    this.isWritingValue = false;
    this.refreshValidation();
  }

  private handleNationalNumberChange(value: string): void {
    if (this.isWritingValue) {
      return;
    }

    if (isInternationalInput(value)) {
      this.applyInternationalValue(value, true);
      return;
    }

    const numericValue = digitsOnly(value);

    if (numericValue !== value) {
      this.nationalNumber.setValue(numericValue, { emitEvent: false });
    }

    this.emitValue();
    this.refreshValidation();
  }

  private applyInternationalValue(value: string, emitChange: boolean): void {
    const digits = digitsOnly(value).replace(/^00/, '');
    const country =
      this.findCountryByDialPrefix(digits) ?? this.selectedCountry() ?? this.defaultCountry();
    const nationalDigits = digits.startsWith(country.dialCode)
      ? digits.slice(country.dialCode.length)
      : digits;

    this.setCountry(country, false);
    this.nationalNumber.setValue(nationalDigits, { emitEvent: false });
    this.refreshValidation();

    if (emitChange) {
      this.emitValue();
    }
  }

  private setCountry(country: CallingCountry, emitChange: boolean): void {
    this.selectedCountry.set(country);
    this.countryQuery.setValue(country, { emitEvent: false });
    this.countrySearch.set(this.countryLabel(country));

    if (emitChange) {
      this.emitValue();
    }

    this.refreshValidation();
  }

  private emitValue(): void {
    const digits = this.localDigits();
    const country = this.selectedCountry();
    const value = country && digits ? `+${country.dialCode}${digits}` : '';
    this.onChange(value);
  }

  private localDigits(): string {
    return digitsOnly(this.nationalNumber.value);
  }

  private currentValidationErrors(): ValidationErrors | null {
    const rawValue = this.nationalNumber.value.trim();

    if (!rawValue) {
      return null;
    }

    const country = this.selectedCountry();

    if (!country) {
      return { internationalPhoneCountry: true };
    }

    const totalDigits = country.dialCode.length + this.localDigits().length;

    if (totalDigits < 5) {
      return { internationalPhoneMin: true };
    }

    if (totalDigits > 15) {
      return { internationalPhoneMax: true };
    }

    if (!internationalPhonePattern.test(`+${country.dialCode}${this.localDigits()}`)) {
      return { internationalPhoneFormat: true };
    }

    return null;
  }

  private refreshValidation(): void {
    this.nationalNumber.updateValueAndValidity({ emitEvent: false });
    this.onValidatorChange();
  }

  private defaultCountry(): CallingCountry {
    return (
      this.countries().find((country) => country.iso2 === this.defaultCountryIso().toUpperCase()) ??
      this.countries()[0]
    );
  }

  private findCountryByDialPrefix(digits: string): CallingCountry | undefined {
    return [...this.countries()]
      .sort((left, right) => right.dialCode.length - left.dialCode.length)
      .find((country) => digits.startsWith(country.dialCode));
  }
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

function isInternationalInput(value: string): boolean {
  const trimmedValue = value.trim();
  return trimmedValue.startsWith('+') || trimmedValue.startsWith('00');
}

function normalizeSearch(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[\s()+.-]+/g, '');
}
