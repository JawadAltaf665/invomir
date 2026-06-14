import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';

import { QueuedEmailDto } from '../../models/admin-email.models';

@Component({
  selector: 'app-queued-email-details-dialog',
  standalone: true,
  imports: [DatePipe, MatButtonModule, MatDialogActions, MatDialogContent, MatDialogTitle],
  template: `
    <div class="min-w-0 max-w-3xl p-6">
      <div class="flex items-start justify-between gap-4">
        <div class="min-w-0">
          <h2 mat-dialog-title class="m-0 truncate text-xl font-semibold text-neutral-900">
            Queued email details
          </h2>
          <p class="mt-2 break-words text-sm text-neutral-500 [overflow-wrap:anywhere]">
            {{ data.toEmail }}
          </p>
        </div>
        <button mat-icon-button type="button" aria-label="Close queued email details" (click)="close()">
          <span class="text-xl leading-none">&times;</span>
        </button>
      </div>

      <mat-dialog-content class="mt-5 max-h-[70vh] overflow-y-auto p-0">
        <div class="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <p class="text-xs font-medium uppercase tracking-normal text-neutral-500">Subject</p>
          <p class="mt-2 break-words text-sm font-semibold text-neutral-900 [overflow-wrap:anywhere]">
            {{ data.subject }}
          </p>
        </div>

        <dl class="mt-4 grid gap-3 text-sm md:grid-cols-3">
          <div class="rounded-2xl border border-neutral-200 bg-white p-4">
            <dt class="text-xs font-medium uppercase tracking-normal text-neutral-500">Status</dt>
            <dd class="mt-2 font-semibold text-neutral-900">{{ data.statusName }}</dd>
          </div>
          <div class="rounded-2xl border border-neutral-200 bg-white p-4">
            <dt class="text-xs font-medium uppercase tracking-normal text-neutral-500">Retries</dt>
            <dd class="mt-2 font-semibold text-neutral-900">
              {{ data.retryCount }} / {{ data.maxRetryCount }}
            </dd>
          </div>
          <div class="rounded-2xl border border-neutral-200 bg-white p-4">
            <dt class="text-xs font-medium uppercase tracking-normal text-neutral-500">Template</dt>
            <dd class="mt-2 font-semibold text-neutral-900">{{ data.templateTypeName || 'Custom' }}</dd>
          </div>
          <div class="rounded-2xl border border-neutral-200 bg-white p-4">
            <dt class="text-xs font-medium uppercase tracking-normal text-neutral-500">Scheduled</dt>
            <dd class="mt-2 font-semibold text-neutral-900">
              {{ data.scheduledAt ? (data.scheduledAt | date: 'short') : 'Now' }}
            </dd>
          </div>
          <div class="rounded-2xl border border-neutral-200 bg-white p-4">
            <dt class="text-xs font-medium uppercase tracking-normal text-neutral-500">Sent</dt>
            <dd class="mt-2 font-semibold text-neutral-900">
              {{ data.sentAt ? (data.sentAt | date: 'short') : 'Not sent' }}
            </dd>
          </div>
          <div class="rounded-2xl border border-neutral-200 bg-white p-4">
            <dt class="text-xs font-medium uppercase tracking-normal text-neutral-500">Last attempt</dt>
            <dd class="mt-2 font-semibold text-neutral-900">
              {{ data.lastAttemptAt ? (data.lastAttemptAt | date: 'short') : 'None' }}
            </dd>
          </div>
        </dl>

        <div class="mt-4 grid gap-3 text-sm md:grid-cols-2">
          <div class="rounded-2xl border border-neutral-200 bg-white p-4">
            <p class="text-xs font-medium uppercase tracking-normal text-neutral-500">Recipient</p>
            <p class="mt-2 break-words font-semibold text-neutral-900 [overflow-wrap:anywhere]">
              {{ data.toName || 'No name' }}
            </p>
            <p class="mt-1 break-words text-neutral-500 [overflow-wrap:anywhere]">{{ data.toEmail }}</p>
          </div>
          <div class="rounded-2xl border border-neutral-200 bg-white p-4">
            <p class="text-xs font-medium uppercase tracking-normal text-neutral-500">Tenant</p>
            <p class="mt-2 break-words font-semibold text-neutral-900 [overflow-wrap:anywhere]">
              {{ data.tenantId || 'System' }}
            </p>
            @if (data.hasAttachment) {
              <p class="mt-1 truncate text-neutral-500">Attachment: {{ data.attachmentFileName }}</p>
            }
          </div>
        </div>

        @if (data.errorMessage) {
          <p class="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{{ data.errorMessage }}</p>
        }

        <div class="mt-4 rounded-2xl border border-neutral-200 bg-white p-4">
          <p class="text-xs font-medium uppercase tracking-normal text-neutral-500">Body</p>
          <div class="prose prose-sm mt-3 max-w-none" [innerHTML]="data.body"></div>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end" class="mt-5 p-0">
        <button mat-flat-button type="button" (click)="close()">Done</button>
      </mat-dialog-actions>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QueuedEmailDetailsDialogComponent {
  protected readonly data = inject<QueuedEmailDto>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<QueuedEmailDetailsDialogComponent>);

  protected close(): void {
    this.dialogRef.close();
  }
}
