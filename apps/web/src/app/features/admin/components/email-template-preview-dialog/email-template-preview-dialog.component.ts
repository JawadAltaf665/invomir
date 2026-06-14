import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';

export interface EmailTemplatePreviewDialogData {
  title: string;
  description: string;
  subject: string;
  body: string;
}

@Component({
  selector: 'app-email-template-preview-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogActions, MatDialogContent, MatDialogTitle],
  template: `
    <div class="min-w-0 max-w-3xl p-6">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h2 mat-dialog-title class="m-0 text-xl font-semibold text-neutral-900">
            {{ data.title }}
          </h2>
          <p class="mt-2 text-sm text-neutral-500">{{ data.description }}</p>
        </div>
        <button mat-icon-button type="button" aria-label="Close preview" (click)="close()">
          <span class="text-xl leading-none">&times;</span>
        </button>
      </div>

      <mat-dialog-content class="mt-5 max-h-[70vh] overflow-y-auto p-0">
        <div class="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
          <p class="text-xs font-medium uppercase tracking-normal text-neutral-500">Subject</p>
          <p class="mt-2 text-sm font-semibold text-neutral-900">{{ data.subject }}</p>
        </div>

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
export class EmailTemplatePreviewDialogComponent {
  protected readonly data = inject<EmailTemplatePreviewDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<EmailTemplatePreviewDialogComponent>);

  protected close(): void {
    this.dialogRef.close();
  }
}
