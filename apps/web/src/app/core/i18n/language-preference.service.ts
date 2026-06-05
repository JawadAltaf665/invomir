import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, finalize, map, switchMap, tap, throwError } from 'rxjs';

import { ApiResponseError, extractApiErrors } from '../errors/api-response-error';
import { ApiResponse } from '../models/api-response.model';
import { CurrentUserProfileRefreshService } from '../services/current-user-profile-refresh.service';
import { SupportedLanguage, getLanguageOption, supportedLanguages } from './language.config';
import { LanguagePreferenceApiService } from './language-preference-api.service';
import { TranslationService } from './translation.service';

@Injectable({ providedIn: 'root' })
export class LanguagePreferenceService {
  private readonly api = inject(LanguagePreferenceApiService);
  private readonly translation = inject(TranslationService);
  private readonly profileRefresh = inject(CurrentUserProfileRefreshService);
  private readonly isLoadingSignal = signal(false);
  private readonly isSavingSignal = signal(false);
  private readonly errorMessagesSignal = signal<readonly string[]>([]);

  readonly options = supportedLanguages;
  readonly currentLanguage = this.translation.language;
  readonly direction = this.translation.direction;
  readonly currentOption = computed(() => getLanguageOption(this.currentLanguage()));
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly isSaving = this.isSavingSignal.asReadonly();
  readonly errorMessages = this.errorMessagesSignal.asReadonly();

  load(): void {
    if (this.isLoading()) {
      return;
    }

    this.isLoadingSignal.set(true);
    this.errorMessagesSignal.set([]);

    this.api
      .getLanguage()
      .pipe(
        map((response) =>
          this.unwrap(response, this.translation.translate('layout.languageLoadError')),
        ),
        switchMap((preference) => this.translation.setLanguage(preference.language)),
        catchError((error) => {
          this.errorMessagesSignal.set(extractApiErrors(error));
          return this.translation.setLanguage('en');
        }),
        finalize(() => this.isLoadingSignal.set(false)),
      )
      .subscribe();
  }

  changeLanguage(language: SupportedLanguage): void {
    if (this.isSaving() || language === this.currentLanguage()) {
      return;
    }

    const previousLanguage = this.currentLanguage();
    this.isSavingSignal.set(true);
    this.errorMessagesSignal.set([]);

    this.translation
      .setLanguage(language)
      .pipe(
        switchMap(() => this.api.updateLanguage({ language })),
        map((response) =>
          this.unwrap(response, this.translation.translate('layout.languageUpdateError')),
        ),
        switchMap((preference) => this.translation.setLanguage(preference.language)),
        tap(() => this.profileRefresh.notifyProfileChanged()),
        catchError((error) => {
          this.errorMessagesSignal.set(extractApiErrors(error));
          return this.translation
            .setLanguage(previousLanguage)
            .pipe(switchMap(() => throwError(() => error)));
        }),
        finalize(() => this.isSavingSignal.set(false)),
      )
      .subscribe({ error: () => void 0 });
  }

  private unwrap<T>(response: ApiResponse<T>, fallbackMessage: string): T {
    if (!response.success || response.data === null) {
      const message = response.message ?? response.errors[0] ?? fallbackMessage;
      throw new ApiResponseError(message, response.errors.length > 0 ? response.errors : [message]);
    }

    return response.data;
  }
}
