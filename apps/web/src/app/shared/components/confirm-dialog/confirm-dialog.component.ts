import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { LucideAlertTriangle } from '@lucide/angular';
import { Observable, finalize } from 'rxjs';

import { extractApiErrors } from '../../../core/errors/api-response-error';

export interface ConfirmDialogData<T = unknown> {
  title: string;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
  processingLabel: string;
  tone?: 'primary' | 'danger';
  action?: () => Observable<T>;
}

export interface ConfirmDialogResult<T = unknown> {
  confirmed: boolean;
  result?: T;
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    LucideAlertTriangle,
  ],
  template: `
    <div class="w-full max-w-md p-6">
      <div class="flex items-start gap-4">
        <div class="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-700">
          <svg lucideAlertTriangle class="size-5" aria-hidden="true"></svg>
        </div>

        <div class="min-w-0 flex-1">
          <h2 mat-dialog-title class="m-0 text-lg font-semibold text-neutral-900">
            {{ data.title }}
          </h2>
          <mat-dialog-content class="mt-2 p-0 text-sm leading-6 text-neutral-600">
            {{ data.message }}

            @if (errorMessages().length > 0) {
              <div class="mt-4 rounded-xl border border-red-200 bg-red-50 p-3">
                @for (error of errorMessages(); track error) {
                  <p class="text-xs font-medium text-red-700">{{ error }}</p>
                }
              </div>
            }
          </mat-dialog-content>
        </div>
      </div>

      <mat-dialog-actions align="end" class="mt-6 gap-2 p-0">
        <button mat-button type="button" [disabled]="isProcessing()" (click)="cancel()">
          {{ data.cancelLabel }}
        </button>
        <button
          mat-flat-button
          [color]="data.tone === 'danger' ? 'warn' : 'primary'"
          type="button"
          [disabled]="isProcessing()"
          (click)="confirm()"
        >
          {{ isProcessing() ? data.processingLabel : data.confirmLabel }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent<T = unknown> {
  protected readonly data = inject<ConfirmDialogData<T>>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<ConfirmDialogComponent<T>, ConfirmDialogResult<T>>);

  protected readonly isProcessing = signal(false);
  protected readonly errorMessages = signal<readonly string[]>([]);

  protected cancel(): void {
    if (this.isProcessing()) {
      return;
    }

    this.dialogRef.close({ confirmed: false });
  }

  protected confirm(): void {
    if (this.isProcessing()) {
      return;
    }

    if (!this.data.action) {
      this.dialogRef.close({ confirmed: true });
      return;
    }

    this.isProcessing.set(true);
    this.errorMessages.set([]);

    this.data
      .action()
      .pipe(finalize(() => this.isProcessing.set(false)))
      .subscribe({
        next: (result) => this.dialogRef.close({ confirmed: true, result }),
        error: (error) => this.errorMessages.set(extractApiErrors(error)),
      });
  }
}
