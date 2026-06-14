import { Injectable, inject } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, filter, map } from 'rxjs';

import {
  ConfirmDialogComponent,
  ConfirmDialogData,
  ConfirmDialogResult,
} from '../../shared/components/confirm-dialog/confirm-dialog.component';

export interface ConfirmationDialogOptions {
  title: string;
  message: string;
  cancelLabel: string;
  confirmLabel: string;
  processingLabel: string;
  tone?: 'primary' | 'danger';
}

@Injectable({ providedIn: 'root' })
export class ConfirmationDialogService {
  private readonly dialog = inject(MatDialog);

  confirm(options: ConfirmationDialogOptions): Observable<boolean> {
    return this.open<boolean>({
      ...options,
      action: undefined,
    }).pipe(map((result) => result.confirmed));
  }

  confirmAction<T>(
    options: ConfirmationDialogOptions,
    action: () => Observable<T>,
  ): Observable<T> {
    return this.open<T>({
      ...options,
      action,
    }).pipe(
      filter((result): result is ConfirmDialogResult<T> & { result: T } =>
        result.confirmed && result.result !== undefined,
      ),
      map((result) => result.result),
    );
  }

  private open<T>(data: ConfirmDialogData<T>): Observable<ConfirmDialogResult<T>> {
    return this.dialog
      .open<ConfirmDialogComponent<T>, ConfirmDialogData<T>, ConfirmDialogResult<T>>(
        ConfirmDialogComponent<T>,
        {
          autoFocus: false,
          disableClose: true,
          maxWidth: 'calc(100vw - 32px)',
          panelClass: 'invomir-confirm-dialog-panel',
          width: '420px',
          data,
        },
      )
      .afterClosed()
      .pipe(map((result) => result ?? { confirmed: false }));
  }
}
