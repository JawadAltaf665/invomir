import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class CurrentUserProfileRefreshService {
  private readonly versionSignal = signal(0);

  readonly version = this.versionSignal.asReadonly();

  notifyProfileChanged(): void {
    this.versionSignal.update((version) => version + 1);
  }
}
