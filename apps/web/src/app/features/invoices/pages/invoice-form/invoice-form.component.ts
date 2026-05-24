import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideArrowLeft, LucidePlus, LucideSave, LucideTrash2 } from '@lucide/angular';
import { finalize, map } from 'rxjs';

import { ApiResponseError, extractApiErrors } from '../../../../core/errors/api-response-error';
import { supportedCurrencies } from '../../../../core/auth/auth.models';
import { ApiResponse, PagedResult } from '../../../../core/models/api-response.model';
import { CurrentUserApiService } from '../../../../core/services/current-user-api.service';
import {
  InvoiceClientListItemDto,
  InvoiceDetailDto,
  InvoiceDiscountDto,
  InvoiceDiscountType,
  InvoiceItemInputDto,
  InvoicePaymentTerms,
  InvoiceSaveRequest,
  invoiceDiscountTypes,
  invoicePaymentTerms,
} from '../../models/invoice.models';
import { InvoiceApiService } from '../../services/invoice-api.service';
import {
  calculateInvoiceDraftTotals,
  discountTypeLabel,
  formatInvoiceCurrency,
  paymentTermsLabel,
} from '../../utils/invoice-formatters';
import { InvoiceTotalsSummaryComponent } from '../../components/invoice-totals-summary/invoice-totals-summary.component';

type InvoiceItemFormGroup = FormGroup<{
  description: FormControl<string>;
  quantity: FormControl<number>;
  unitPrice: FormControl<number>;
}>;

type InvoiceFormGroup = FormGroup<{
  clientId: FormControl<string>;
  dueDate: FormControl<string>;
  paymentTerms: FormControl<string>;
  currency: FormControl<string>;
  taxPercent: FormControl<number>;
  discountType: FormControl<InvoiceDiscountType>;
  discountValue: FormControl<number>;
  notes: FormControl<string>;
  items: FormArray<InvoiceItemFormGroup>;
}>;

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    RouterLink,
    InvoiceTotalsSummaryComponent,
    LucideArrowLeft,
    LucidePlus,
    LucideSave,
    LucideTrash2,
  ],
  templateUrl: './invoice-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InvoiceFormComponent implements OnInit {
  private readonly invoiceApi = inject(InvoiceApiService);
  private readonly currentUserApi = inject(CurrentUserApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

  protected readonly isLoading = signal(false);
  protected readonly isSubmitting = signal(false);
  protected readonly errorMessages = signal<readonly string[]>([]);
  protected readonly clientOptions = signal<readonly InvoiceClientListItemDto[]>([]);
  protected readonly editingInvoice = signal<InvoiceDetailDto | null>(null);
  protected readonly workspaceCurrency = signal('USD');
  protected readonly currencyOptions = supportedCurrencies;

  protected readonly isEditMode = computed(() => !!this.editingInvoice());
  protected readonly title = computed(() =>
    this.isEditMode() ? `Edit ${this.editingInvoice()?.invoiceNumber ?? 'invoice'}` : 'New invoice',
  );

  protected readonly paymentTermOptions = invoicePaymentTerms.map((terms) => ({
    value: terms,
    label: paymentTermsLabel(terms),
  }));
  protected readonly discountTypeOptions = invoiceDiscountTypes.map((type) => ({
    value: type,
    label: discountTypeLabel(type),
  }));

  protected readonly form: InvoiceFormGroup = new FormGroup(
    {
      clientId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      dueDate: new FormControl('', { nonNullable: true }),
      paymentTerms: new FormControl('', { nonNullable: true }),
      currency: new FormControl('USD', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(3), Validators.maxLength(3)],
      }),
      taxPercent: new FormControl(0, {
        nonNullable: true,
        validators: [Validators.min(0), Validators.max(100)],
      }),
      discountType: new FormControl<InvoiceDiscountType>('fixed', { nonNullable: true }),
      discountValue: new FormControl(0, { nonNullable: true, validators: [Validators.min(0)] }),
      notes: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(1000)] }),
      items: new FormArray<InvoiceItemFormGroup>([this.createItemGroup()]),
    },
    {
      validators: [dueDateOrPaymentTermsValidator(), discountValueValidator()],
    },
  );

  protected get items(): FormArray<InvoiceItemFormGroup> {
    return this.form.controls.items;
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const invoiceId = this.route.snapshot.paramMap.get('id');
    this.loadWorkspaceDefaults(!!invoiceId);
    this.loadClients();

    if (invoiceId) {
      this.loadInvoice(invoiceId);
    }
  }

  protected addItem(): void {
    if (this.items.length >= 100) {
      return;
    }

    this.items.push(this.createItemGroup());
  }

  protected removeItem(index: number): void {
    if (this.items.length === 1) {
      return;
    }

    this.items.removeAt(index);
    this.form.markAsDirty();
  }

  protected submit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      this.form.markAllAsTouched();
      return;
    }

    const invoiceId = this.editingInvoice()?.id;
    const request = this.toSaveRequest();
    const request$ = invoiceId
      ? this.invoiceApi.updateInvoice(invoiceId, request)
      : this.invoiceApi.createInvoice(request);

    this.isSubmitting.set(true);
    this.errorMessages.set([]);

    request$
      .pipe(
        map((response) => this.unwrap(response, 'Invoice could not be saved.')),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe({
        next: (invoice) => void this.router.navigate(['/app/invoices', invoice.id]),
        error: (error) => this.errorMessages.set(extractApiErrors(error)),
      });
  }

  protected draftTotals(): {
    subtotal: number;
    discountAmount: number;
    taxAmount: number;
    total: number;
  } {
    return calculateInvoiceDraftTotals(
      this.items.getRawValue(),
      this.validPreviewTaxPercent(),
      this.discountPayload(),
    );
  }

  protected currentCurrency(): string {
    return this.form.controls.currency.value || 'USD';
  }

  protected formatCurrency(value: number): string {
    return formatInvoiceCurrency(value, this.currentCurrency());
  }

  protected hasItemError(
    index: number,
    controlName: keyof InvoiceItemFormGroup['controls'],
    error: string,
  ): boolean {
    const control = this.items.at(index).controls[controlName];
    return control.hasError(error) && (control.touched || control.dirty);
  }

  private loadClients(): void {
    this.invoiceApi
      .listClients()
      .pipe(map((response) => this.unwrapPaged(response, 'Clients could not be loaded.')))
      .subscribe({
        next: (result) => this.clientOptions.set(result.items),
        error: (error) => this.errorMessages.set(extractApiErrors(error)),
      });
  }

  private loadWorkspaceDefaults(isEditingInvoice: boolean): void {
    this.currentUserApi
      .getCurrentUser()
      .pipe(map((response) => this.unwrap(response, 'Workspace defaults could not be loaded.')))
      .subscribe({
        next: (profile) => {
          const currency = profile.currency.toUpperCase();
          this.workspaceCurrency.set(currency);

          if (!isEditingInvoice) {
            this.form.controls.currency.setValue(currency, { emitEvent: false });
            this.form.controls.taxPercent.setValue(profile.taxPercent, { emitEvent: false });
          }
        },
        error: (error) => this.appendErrors(extractApiErrors(error)),
      });
  }

  private loadInvoice(invoiceId: string): void {
    this.isLoading.set(true);
    this.errorMessages.set([]);

    this.invoiceApi
      .getInvoice(invoiceId)
      .pipe(
        map((response) => this.unwrap(response, 'Invoice could not be loaded.')),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (invoice) => {
          this.editingInvoice.set(invoice);
          this.patchForm(invoice);
        },
        error: (error) => this.errorMessages.set(extractApiErrors(error)),
      });
  }

  private patchForm(invoice: InvoiceDetailDto): void {
    if (invoice.status !== 'draft') {
      this.errorMessages.set(['Only draft invoices can be edited.']);
    }

    this.ensureClientOption(invoice);
    this.items.clear();
    invoice.items.forEach((item) => {
      this.items.push(
        this.createItemGroup({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        }),
      );
    });

    if (this.items.length === 0) {
      this.items.push(this.createItemGroup());
    }

    this.form.patchValue({
      clientId: invoice.client.id,
      dueDate: invoice.dueDate,
      paymentTerms: '',
      currency: invoice.currency,
      taxPercent: invoice.taxPercent,
      discountType: 'fixed',
      discountValue: invoice.discountAmount,
      notes: invoice.notes ?? '',
    });

    if (invoice.status !== 'draft') {
      this.form.disable({ emitEvent: false });
    }
  }

  private ensureClientOption(invoice: InvoiceDetailDto): void {
    const options = this.clientOptions();
    if (options.some((client) => client.id === invoice.client.id)) {
      return;
    }

    this.clientOptions.set([
      ...options,
      {
        id: invoice.client.id,
        name: invoice.client.name,
        email: invoice.client.email,
        company: invoice.client.company ?? null,
        totalRevenue: 0,
        invoiceCount: 0,
      },
    ]);
  }

  private createItemGroup(item: Partial<InvoiceItemInputDto> = {}): InvoiceItemFormGroup {
    return new FormGroup({
      description: new FormControl(item.description ?? '', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(200)],
      }),
      quantity: new FormControl(item.quantity ?? 1, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(0.01)],
      }),
      unitPrice: new FormControl(item.unitPrice ?? 0, {
        nonNullable: true,
        validators: [Validators.required, Validators.min(0)],
      }),
    });
  }

  private toSaveRequest(): InvoiceSaveRequest {
    const value = this.form.getRawValue();

    return {
      clientId: value.clientId,
      dueDate: value.dueDate || null,
      paymentTerms: value.dueDate
        ? null
        : ((value.paymentTerms || null) as InvoicePaymentTerms | null),
      taxPercent: value.taxPercent,
      discount: this.discountPayload(),
      notes: value.notes.trim() || null,
      currency: value.currency.toUpperCase(),
      items: value.items.map((item) => ({
        description: item.description.trim(),
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      })),
    };
  }

  private discountPayload(): InvoiceDiscountDto | null {
    const type = this.form.controls.discountType.value;
    const value = Number(this.form.controls.discountValue.value);

    if (!Number.isFinite(value) || value <= 0 || (type === 'percent' && value > 100)) {
      return null;
    }

    return {
      type,
      value,
    };
  }

  private validPreviewTaxPercent(): number {
    const value = Number(this.form.controls.taxPercent.value);
    return Number.isFinite(value) && value >= 0 && value <= 100 ? value : 0;
  }

  private unwrap<T>(response: ApiResponse<T>, fallbackMessage: string): T {
    if (!response.success || response.data === null) {
      const message = response.message ?? response.errors[0] ?? fallbackMessage;
      throw new ApiResponseError(message, response.errors.length > 0 ? response.errors : [message]);
    }

    return response.data;
  }

  private unwrapPaged<T>(
    response: ApiResponse<PagedResult<T>>,
    fallbackMessage: string,
  ): PagedResult<T> {
    return this.unwrap(response, fallbackMessage);
  }

  private appendErrors(messages: readonly string[]): void {
    this.errorMessages.set([...this.errorMessages(), ...messages]);
  }
}

function dueDateOrPaymentTermsValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const dueDate = control.get('dueDate')?.value as string | null;
    const paymentTerms = control.get('paymentTerms')?.value as string | null;

    return dueDate || paymentTerms ? null : { dueDateOrPaymentTerms: true };
  };
}

function discountValueValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const type = control.get('discountType')?.value as InvoiceDiscountType | null;
    const value = Number(control.get('discountValue')?.value ?? 0);

    if (type === 'percent' && value > 100) {
      return { discountPercentExceeded: true };
    }

    return null;
  };
}
