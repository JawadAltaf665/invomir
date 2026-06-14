import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, effect, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DATE_LOCALE, provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import {
  LucideChevronDown,
  LucideChevronUp,
  LucideEye,
  LucideInbox,
  LucideRefreshCcw,
  LucideRotateCcw,
  LucideSearch,
  LucideXCircle,
} from '@lucide/angular';
import { finalize, map } from 'rxjs';

import { ApiResponseError, extractApiErrors } from '../../../../core/errors/api-response-error';
import { ApiResponse } from '../../../../core/models/api-response.model';
import { ConfirmationDialogService } from '../../../../core/services/confirmation-dialog.service';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { QueuedEmailDetailsDialogComponent } from '../../components/queued-email-details-dialog/queued-email-details-dialog.component';
import {
  EmailTemplateType,
  QueuedEmailDto,
  QueuedEmailListQuery,
  QueuedEmailPageResult,
  QueuedEmailStatus,
  emailTemplateTypes,
  queuedEmailStatuses,
} from '../../models/admin-email.models';
import { AdminEmailApiService } from '../../services/admin-email-api.service';

@Component({
  selector: 'app-queued-email-list',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatMenuModule,
    MatSelectModule,
    PaginationComponent,
    LucideChevronDown,
    LucideChevronUp,
    LucideEye,
    LucideInbox,
    LucideRefreshCcw,
    LucideRotateCcw,
    LucideSearch,
    LucideXCircle,
  ],
  templateUrl: './queued-email-list.component.html',
  providers: [provideNativeDateAdapter(), { provide: MAT_DATE_LOCALE, useValue: 'en-GB' }],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueuedEmailListComponent implements OnInit {
  protected readonly emailTemplateTypes = emailTemplateTypes;
  protected readonly queuedEmailStatuses = queuedEmailStatuses;
  private readonly fb = inject(FormBuilder);
  protected readonly filters = signal<QueuedEmailListQuery>({
    status: '',
    templateType: '',
    tenantId: '',
    from: '',
    to: '',
    searchEmail: '',
    page: 1,
    limit: 20,
  });
  protected readonly rows = signal<readonly QueuedEmailDto[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly isLoading = signal(false);
  protected readonly errorMessages = signal<readonly string[]>([]);
  protected readonly openActionEmailId = signal<string | null>(null);
  protected readonly skeletonRows = [1, 2, 3, 4, 5] as const;
  protected readonly form = this.fb.group(
    {
      searchEmail: this.fb.nonNullable.control(''),
      status: this.fb.nonNullable.control<QueuedEmailStatus | ''>(''),
      templateType: this.fb.nonNullable.control<EmailTemplateType | ''>(''),
      tenantId: this.fb.nonNullable.control(''),
      from: this.fb.control<Date | null>(null),
      to: this.fb.control<Date | null>(null),
    },
    {
      validators: [this.dateRangeValidator],
    },
  );

  private readonly api = inject(AdminEmailApiService);
  private readonly confirmation = inject(ConfirmationDialogService);
  private readonly dialog = inject(MatDialog);

  constructor() {
    effect(() => {
      const filters = this.filters();

      this.form.patchValue(
        {
          searchEmail: filters.searchEmail ?? '',
          status: filters.status ?? '',
          templateType: filters.templateType ?? '',
          tenantId: filters.tenantId ?? '',
          from: this.toDate(filters.from),
          to: this.toDate(filters.to),
        },
        { emitEvent: false },
      );
    });
  }

  ngOnInit(): void {
    this.load();
  }

  protected load(patch: Partial<QueuedEmailListQuery> = {}): void {
    const query = { ...this.filters(), ...patch };
    this.filters.set(query);
    this.isLoading.set(true);
    this.errorMessages.set([]);

    this.api
      .listQueuedEmails(query)
      .pipe(
        map((response) => this.unwrap(response, 'Queued emails could not be loaded.')),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (page) => {
          this.rows.set(page.items);
          this.totalCount.set(page.totalCount);
          this.totalPages.set(page.totalPages);
        },
        error: (error) => this.errorMessages.set(extractApiErrors(error)),
      });
  }

  protected resetFilters(): void {
    this.load({
      status: '',
      templateType: '',
      tenantId: '',
      from: '',
      to: '',
      searchEmail: '',
      page: 1,
    });
  }

  protected applyFilters(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();

    this.load({
      status: value.status,
      templateType: value.templateType,
      tenantId: value.tenantId,
      from: this.toFilterDate(value.from),
      to: this.toFilterDate(value.to),
      searchEmail: value.searchEmail,
      page: 1,
    });
  }

  protected openDetails(email: QueuedEmailDto): void {
    this.dialog.open(QueuedEmailDetailsDialogComponent, {
      width: '760px',
      maxWidth: 'calc(100vw - 32px)',
      autoFocus: false,
      data: email,
    });
  }

  protected retry(email: QueuedEmailDto): void {
    this.confirmation
      .confirmAction(
        {
          title: 'Confirm Action',
          message: `Retry queued email to ${email.toEmail}?`,
          cancelLabel: 'Cancel',
          confirmLabel: 'Confirm',
          processingLabel: 'Retrying...',
        },
        () => this.api.retryQueuedEmail(email.id),
      )
      .pipe(map((response) => this.unwrap(response, 'Queued email could not be retried.')))
      .subscribe({
        next: () => this.load(),
        error: (error) => this.errorMessages.set(extractApiErrors(error)),
      });
  }

  protected cancel(email: QueuedEmailDto): void {
    this.confirmation
      .confirmAction(
        {
          title: 'Confirm Action',
          message: `Cancel queued email to ${email.toEmail}?`,
          cancelLabel: 'Cancel',
          confirmLabel: 'Confirm',
          processingLabel: 'Cancelling...',
          tone: 'danger',
        },
        () => this.api.cancelQueuedEmail(email.id),
      )
      .pipe(map((response) => this.unwrap(response, 'Queued email could not be cancelled.')))
      .subscribe({
        next: () => this.load(),
        error: (error) => this.errorMessages.set(extractApiErrors(error)),
      });
  }

  protected canRetry(email: QueuedEmailDto): boolean {
    return email.status === 'Failed';
  }

  protected canCancel(email: QueuedEmailDto): boolean {
    return email.status === 'Pending' || email.status === 'Failed';
  }

  protected changePage(page: number): void {
    this.load({ page });
  }

  protected changePageSize(limit: number): void {
    this.load({ page: 1, limit });
  }

  private unwrap<T>(response: ApiResponse<T>, fallbackMessage: string): T {
    if (!response.success || response.data === null) {
      const message = response.message ?? response.errors[0] ?? fallbackMessage;
      throw new ApiResponseError(message, response.errors.length > 0 ? response.errors : [message]);
    }

    return response.data;
  }

  private toDate(value: string | null | undefined): Date | null {
    if (!value) {
      return null;
    }

    const date = new Date(`${value}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private toFilterDate(value: Date | null): string {
    if (!value || Number.isNaN(value.getTime())) {
      return '';
    }

    const year = value.getFullYear();
    const month = `${value.getMonth() + 1}`.padStart(2, '0');
    const day = `${value.getDate()}`.padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private dateRangeValidator(control: AbstractControl): ValidationErrors | null {
    const from = control.get('from')?.value as Date | null;
    const to = control.get('to')?.value as Date | null;

    if (!from || !to || Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
      return null;
    }

    return from <= to ? null : { dateRange: true };
  }
}
