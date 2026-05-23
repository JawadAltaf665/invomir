import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { LucideDownload } from '@lucide/angular';

import {
  ReportExportFormat,
  ReportExportQuery,
  ReportInvoiceStatus,
  reportInvoiceStatuses,
} from '../../models/report.models';
import { defaultExportRange, reportStatusLabel } from '../../utils/report-formatters';

@Component({
  selector: 'app-report-export-panel',
  standalone: true,
  host: {
    class: 'block h-full',
  },
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    LucideDownload,
  ],
  templateUrl: './report-export-panel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportExportPanelComponent {
  private readonly fb = inject(FormBuilder);
  private readonly defaultRange = defaultExportRange();

  readonly canExport = input(false);
  readonly isExporting = input(false);
  readonly errorMessages = input<readonly string[]>([]);

  readonly exportRequested = output<ReportExportQuery>();

  protected readonly statusOptions = reportInvoiceStatuses.map((status) => ({
    value: status,
    label: reportStatusLabel(status),
  }));
  protected readonly validationMessage = signal('');

  protected readonly form = this.fb.nonNullable.group({
    from: this.fb.nonNullable.control(this.defaultRange.from, Validators.required),
    to: this.fb.nonNullable.control(this.defaultRange.to, Validators.required),
    status: this.fb.control<ReportInvoiceStatus | null>(null),
  });

  protected exportReport(format: ReportExportFormat): void {
    if (!this.canExport() || this.isExporting()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.validationMessage.set('Choose a valid report date range.');
      return;
    }

    const value = this.form.getRawValue();
    const rangeError = this.validateRange(value.from, value.to);

    if (rangeError) {
      this.validationMessage.set(rangeError);
      return;
    }

    this.validationMessage.set('');
    this.exportRequested.emit({
      format,
      from: value.from,
      to: value.to,
      status: value.status,
    });
  }

  private validateRange(from: string, to: string): string {
    const fromDate = new Date(`${from}T00:00:00`);
    const toDate = new Date(`${to}T00:00:00`);

    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      return 'Choose a valid report date range.';
    }

    if (toDate < fromDate) {
      return 'To date must be on or after from date.';
    }

    const days = Math.round((toDate.getTime() - fromDate.getTime()) / 86_400_000);

    return days > 366 ? 'Report date range cannot exceed 366 days.' : '';
  }
}
