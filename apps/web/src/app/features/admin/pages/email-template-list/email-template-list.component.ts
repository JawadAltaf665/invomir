import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatSelectModule } from '@angular/material/select';
import { RouterLink } from '@angular/router';
import {
  LucideChevronDown,
  LucideChevronUp,
  LucideEye,
  LucideFileText,
  LucideRefreshCcw,
  LucideRotateCcw,
  LucideSearch,
  LucideSlidersHorizontal,
  LucideTrash2,
  LucideXCircle,
} from '@lucide/angular';
import { finalize, map } from 'rxjs';

import { ApiResponseError, extractApiErrors } from '../../../../core/errors/api-response-error';
import { ApiResponse } from '../../../../core/models/api-response.model';
import { ConfirmationDialogService } from '../../../../core/services/confirmation-dialog.service';
import { PaginationComponent } from '../../../../shared/components/pagination/pagination.component';
import { EmailTemplatePreviewDialogComponent } from '../../components/email-template-preview-dialog/email-template-preview-dialog.component';
import {
  EmailTemplateDto,
  EmailTemplateListQuery,
  EmailTemplatePageResult,
  EmailTemplateType,
  emailTemplateTypes,
} from '../../models/admin-email.models';
import { AdminEmailApiService } from '../../services/admin-email-api.service';

@Component({
  selector: 'app-email-template-list',
  standalone: true,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    MatButtonModule,
    MatMenuModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    RouterLink,
    PaginationComponent,
    LucideChevronDown,
    LucideChevronUp,
    LucideEye,
    LucideFileText,
    LucideRefreshCcw,
    LucideRotateCcw,
    LucideSearch,
    LucideSlidersHorizontal,
    LucideTrash2,
    LucideXCircle,
  ],
  templateUrl: './email-template-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailTemplateListComponent implements OnInit {
  protected readonly emailTemplateTypes = emailTemplateTypes;
  private readonly fb = inject(FormBuilder);
  protected readonly filters = signal<EmailTemplateListQuery>({
    templateType: '',
    language: '',
    isActive: '',
    search: '',
    page: 1,
    limit: 20,
  });
  protected readonly rows = signal<readonly EmailTemplateDto[]>([]);
  protected readonly totalCount = signal(0);
  protected readonly totalPages = signal(0);
  protected readonly isLoading = signal(false);
  protected readonly errorMessages = signal<readonly string[]>([]);
  protected readonly previewingTemplateId = signal<string | null>(null);
  protected readonly openActionTemplateId = signal<string | null>(null);
  protected readonly skeletonRows = [1, 2, 3, 4, 5] as const;
  protected readonly form = this.fb.group({
    search: this.fb.nonNullable.control(''),
    templateType: this.fb.nonNullable.control<EmailTemplateType | ''>(''),
    language: this.fb.nonNullable.control(''),
    isActive: this.fb.nonNullable.control<boolean | ''>(''),
  });

  private readonly api = inject(AdminEmailApiService);
  private readonly confirmation = inject(ConfirmationDialogService);
  private readonly dialog = inject(MatDialog);

  constructor() {
    effect(() => {
      const filters = this.filters();

      this.form.patchValue(
        {
          search: filters.search ?? '',
          templateType: filters.templateType ?? '',
          language: filters.language ?? '',
          isActive: filters.isActive ?? '',
        },
        { emitEvent: false },
      );
    });
  }

  ngOnInit(): void {
    this.load();
  }

  protected load(patch: Partial<EmailTemplateListQuery> = {}): void {
    const query = { ...this.filters(), ...patch };
    this.filters.set(query);
    this.isLoading.set(true);
    this.errorMessages.set([]);

    this.api
      .listTemplates(query)
      .pipe(
        map((response) => this.unwrap(response, 'Email templates could not be loaded.')),
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
    this.load({ templateType: '', language: '', isActive: '', search: '', page: 1 });
  }

  protected applyFilters(): void {
    const value = this.form.getRawValue();

    this.load({
      search: value.search,
      templateType: value.templateType,
      language: value.language,
      isActive: value.isActive,
      page: 1,
    });
  }

  protected refresh(): void {
    this.load({ page: this.filters().page });
  }

  protected previewTemplateNow(template: EmailTemplateDto): void {
    this.previewingTemplateId.set(template.id);
    this.errorMessages.set([]);
    this.api
      .previewTemplate({
        subject: template.subject,
        body: template.body,
        tokens: this.sampleTokens(),
      })
      .pipe(
        map((response) => this.unwrap(response, 'Email template preview failed.')),
        finalize(() => this.previewingTemplateId.set(null)),
      )
      .subscribe({
        next: (preview) => {
          this.dialog.open(EmailTemplatePreviewDialogComponent, {
            width: '760px',
            maxWidth: 'calc(100vw - 32px)',
            autoFocus: false,
            data: {
              title: `Preview: ${template.name}`,
              description: 'Rendered with sample token values.',
              subject: preview.subject,
              body: preview.body,
            },
          });
        },
        error: (error) => this.errorMessages.set(extractApiErrors(error)),
      });
  }

  protected activate(template: EmailTemplateDto): void {
    this.confirmation
      .confirmAction(
        {
          title: 'Confirm Action',
          message: `Activate ${template.name}?`,
          cancelLabel: 'Cancel',
          confirmLabel: 'Confirm',
          processingLabel: 'Activating...',
        },
        () => this.api.activateTemplate(template.id),
      )
      .pipe(map((response) => this.unwrap(response, 'Email template could not be activated.')))
      .subscribe({
        next: () => this.load(),
        error: (error) => this.errorMessages.set(extractApiErrors(error)),
      });
  }

  protected deactivate(template: EmailTemplateDto): void {
    this.confirmation
      .confirmAction(
        {
          title: 'Confirm Action',
          message: `Deactivate ${template.name}?`,
          cancelLabel: 'Cancel',
          confirmLabel: 'Confirm',
          processingLabel: 'Deactivating...',
        },
        () => this.api.deactivateTemplate(template.id),
      )
      .pipe(map((response) => this.unwrap(response, 'Email template could not be deactivated.')))
      .subscribe({
        next: () => this.load(),
        error: (error) => this.errorMessages.set(extractApiErrors(error)),
      });
  }

  protected delete(template: EmailTemplateDto): void {
    this.confirmation
      .confirmAction(
        {
          title: 'Confirm Action',
          message: `Are you sure you want to delete ${template.name}?`,
          cancelLabel: 'Cancel',
          confirmLabel: 'Confirm',
          processingLabel: 'Deleting...',
          tone: 'danger',
        },
        () => this.api.deleteTemplate(template.id),
      )
      .pipe(map((response) => this.unwrap(response, 'Email template could not be deleted.')))
      .subscribe({
        next: () => this.load(),
        error: (error) => this.errorMessages.set(extractApiErrors(error)),
      });
  }

  protected changePage(page: number): void {
    this.load({ page });
  }

  protected changePageSize(limit: number): void {
    this.load({ page: 1, limit });
  }

  private sampleTokens(): Record<string, string> {
    return {
      CompanyName: 'Acme Studio',
      CustomerName: 'Sara Khan',
      InvoiceNumber: 'INV-001',
      InvoiceAmount: 'USD 1,200.00',
      DueDate: '2026-07-14',
      InvoiceUrl: 'https://invomir.com/pay/demo',
      PaymentLink: 'https://invomir.com/pay/demo',
      UserName: 'Admin',
      PlanName: 'Professional',
      VerificationLink: 'https://invomir.com/verify-email?token=demo',
      ResetPasswordLink: 'https://invomir.com/reset-password?token=demo',
      InvitationLink: 'https://invomir.com/accept-invitation?token=demo',
      CustomMessage: '<p>Please see the attached invoice.</p>',
      TrackingPixelUrl: 'https://api.invomir.com/api/invoices/track/demo',
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
