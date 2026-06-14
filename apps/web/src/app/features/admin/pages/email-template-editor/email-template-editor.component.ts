import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, map } from 'rxjs';

import { ApiResponseError, extractApiErrors } from '../../../../core/errors/api-response-error';
import { ApiResponse } from '../../../../core/models/api-response.model';
import { EmailTemplatePreviewDialogComponent } from '../../components/email-template-preview-dialog/email-template-preview-dialog.component';
import {
  EmailTemplateDto,
  EmailTemplateRequest,
  EmailTemplateType,
  emailTemplateTypes,
} from '../../models/admin-email.models';
import { AdminEmailApiService } from '../../services/admin-email-api.service';

@Component({
  selector: 'app-email-template-editor',
  standalone: true,
  imports: [MatButtonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './email-template-editor.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailTemplateEditorComponent implements OnInit {
  protected readonly emailTemplateTypes = emailTemplateTypes;
  protected readonly id = signal<string | null>(null);
  protected readonly isLoading = signal(false);
  protected readonly isSaving = signal(false);
  protected readonly isPreviewing = signal(false);
  protected readonly errorMessages = signal<readonly string[]>([]);

  protected readonly form = inject(FormBuilder).nonNullable.group({
    templateType: ['InvoiceSent' as EmailTemplateType, Validators.required],
    name: ['', [Validators.required, Validators.maxLength(200)]],
    language: ['en', [Validators.required, Validators.maxLength(20)]],
    subject: ['', [Validators.required, Validators.maxLength(300)]],
    body: ['', Validators.required],
    isActive: [true],
  });

  private readonly api = inject(AdminEmailApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.id.set(id);

    if (id) {
      this.loadTemplate(id);
    }
  }

  protected save(): void {
    if (this.form.invalid || this.isSaving()) {
      this.form.markAllAsTouched();
      return;
    }

    const id = this.id();
    const request = this.toRequest();
    this.isSaving.set(true);
    this.errorMessages.set([]);

    const saveRequest = id
      ? this.api.updateTemplate(id, request)
      : this.api.createTemplate({ ...request, isSystemTemplate: true });

    saveRequest
      .pipe(
        map((response) => this.unwrap(response, 'Email template could not be saved.')),
        finalize(() => this.isSaving.set(false)),
      )
      .subscribe({
        next: () => void this.router.navigate(['/app/admin/email-templates']),
        error: (error) => this.errorMessages.set(extractApiErrors(error)),
      });
  }

  protected renderPreview(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.isPreviewing.set(true);
    this.errorMessages.set([]);
    this.api
      .previewTemplate({
        subject: value.subject,
        body: value.body,
        tokens: this.sampleTokens(),
      })
      .pipe(
        map((response) => this.unwrap(response, 'Email template preview failed.')),
        finalize(() => this.isPreviewing.set(false)),
      )
      .subscribe({
        next: (preview) => {
          this.dialog.open(EmailTemplatePreviewDialogComponent, {
            width: '760px',
            maxWidth: 'calc(100vw - 32px)',
            autoFocus: false,
            data: {
              title: 'Template preview',
              description: 'Rendered with sample token values.',
              subject: preview.subject,
              body: preview.body,
            },
          });
        },
        error: (error) => this.errorMessages.set(extractApiErrors(error)),
      });
  }

  private loadTemplate(id: string): void {
    this.isLoading.set(true);
    this.errorMessages.set([]);

    this.api
      .getTemplate(id)
      .pipe(
        map((response) => this.unwrap(response, 'Email template could not be loaded.')),
        finalize(() => this.isLoading.set(false)),
      )
      .subscribe({
        next: (template) => this.patchTemplate(template),
        error: (error) => this.errorMessages.set(extractApiErrors(error)),
      });
  }

  private patchTemplate(template: EmailTemplateDto): void {
    this.form.patchValue({
      templateType: template.templateType,
      name: template.name,
      language: template.language,
      subject: template.subject,
      body: template.body,
      isActive: template.isActive,
    });
  }

  private toRequest(): EmailTemplateRequest {
    const value = this.form.getRawValue();
    return {
      templateType: value.templateType,
      name: value.name.trim(),
      language: value.language.trim() || 'en',
      subject: value.subject.trim(),
      body: value.body,
      isActive: value.isActive,
    };
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
