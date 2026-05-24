import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WorkspaceCurrencyRefreshService {
  private readonly versionSignal = signal(0);

  readonly version = this.versionSignal.asReadonly();

  notifyCurrencyChanged(): void {
    this.versionSignal.update((version) => version + 1);
  }
}
