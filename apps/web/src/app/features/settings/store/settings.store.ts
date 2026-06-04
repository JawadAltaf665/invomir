import { HttpEventType } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, filter, finalize, map, tap, throwError } from 'rxjs';

import { ApiResponseError, extractApiErrors } from '../../../core/errors/api-response-error';
import { ApiResponse } from '../../../core/models/api-response.model';
import { CurrentUserProfileRefreshService } from '../../../core/services/current-user-profile-refresh.service';
import { WorkspaceCurrencyRefreshService } from '../../../core/services/workspace-currency-refresh.service';
import {
  ChangePasswordRequest,
  UpdateUserProfileRequest,
  UserLogoDto,
  UserProfilePictureDto,
  UserProfileDto,
} from '../models/settings.models';
import { SettingsApiService } from '../services/settings-api.service';

@Injectable({ providedIn: 'root' })
export class SettingsStore {
  private readonly settingsApi = inject(SettingsApiService);
  private readonly currentUserProfileRefresh = inject(CurrentUserProfileRefreshService);
  private readonly workspaceCurrencyRefresh = inject(WorkspaceCurrencyRefreshService);

  private readonly profileSignal = signal<UserProfileDto | null>(null);
  private readonly isLoadingSignal = signal(false);
  private readonly loadErrorMessagesSignal = signal<readonly string[]>([]);

  private readonly isSavingProfileSignal = signal(false);
  private readonly profileErrorMessagesSignal = signal<readonly string[]>([]);
  private readonly profileSuccessMessageSignal = signal('');

  private readonly isUploadingLogoSignal = signal(false);
  private readonly logoUploadProgressSignal = signal(0);
  private readonly logoErrorMessagesSignal = signal<readonly string[]>([]);
  private readonly logoSuccessMessageSignal = signal('');
  private readonly logoVersionSignal = signal(Date.now());

  private readonly isUploadingProfilePictureSignal = signal(false);
  private readonly profilePictureUploadProgressSignal = signal(0);
  private readonly profilePictureErrorMessagesSignal = signal<readonly string[]>([]);
  private readonly profilePictureSuccessMessageSignal = signal('');
  private readonly profilePictureVersionSignal = signal(Date.now());

  private readonly isChangingPasswordSignal = signal(false);
  private readonly passwordErrorMessagesSignal = signal<readonly string[]>([]);
  private readonly passwordSuccessMessageSignal = signal('');

  readonly profile = this.profileSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly loadErrorMessages = this.loadErrorMessagesSignal.asReadonly();

  readonly isSavingProfile = this.isSavingProfileSignal.asReadonly();
  readonly profileErrorMessages = this.profileErrorMessagesSignal.asReadonly();
  readonly profileSuccessMessage = this.profileSuccessMessageSignal.asReadonly();

  readonly isUploadingLogo = this.isUploadingLogoSignal.asReadonly();
  readonly logoUploadProgress = this.logoUploadProgressSignal.asReadonly();
  readonly logoErrorMessages = this.logoErrorMessagesSignal.asReadonly();
  readonly logoSuccessMessage = this.logoSuccessMessageSignal.asReadonly();
  readonly logoVersion = this.logoVersionSignal.asReadonly();

  readonly isUploadingProfilePicture = this.isUploadingProfilePictureSignal.asReadonly();
  readonly profilePictureUploadProgress = this.profilePictureUploadProgressSignal.asReadonly();
  readonly profilePictureErrorMessages = this.profilePictureErrorMessagesSignal.asReadonly();
  readonly profilePictureSuccessMessage = this.profilePictureSuccessMessageSignal.asReadonly();
  readonly profilePictureVersion = this.profilePictureVersionSignal.asReadonly();

  readonly isChangingPassword = this.isChangingPasswordSignal.asReadonly();
  readonly passwordErrorMessages = this.passwordErrorMessagesSignal.asReadonly();
  readonly passwordSuccessMessage = this.passwordSuccessMessageSignal.asReadonly();

  readonly isBusy = computed(
    () =>
      this.isLoading() ||
      this.isSavingProfile() ||
      this.isUploadingLogo() ||
      this.isUploadingProfilePicture() ||
      this.isChangingPassword(),
  );

  loadProfile(): void {
    if (this.isLoading()) {
      return;
    }

    this.isLoadingSignal.set(true);
    this.loadErrorMessagesSignal.set([]);

    this.settingsApi
      .getCurrentUser()
      .pipe(
        map((response) => this.unwrap(response, 'Profile could not be loaded.')),
        finalize(() => this.isLoadingSignal.set(false)),
      )
      .subscribe({
        next: (profile) => {
          this.profileSignal.set(profile);
          this.logoVersionSignal.set(Date.now());
          this.profilePictureVersionSignal.set(Date.now());
        },
        error: (error) => this.loadErrorMessagesSignal.set(extractApiErrors(error)),
      });
  }

  saveProfile(request: UpdateUserProfileRequest): Observable<UserProfileDto> {
    this.isSavingProfileSignal.set(true);
    this.profileErrorMessagesSignal.set([]);
    this.profileSuccessMessageSignal.set('');
    const previousCurrency = this.normalizeCurrency(this.profile()?.currency);

    return this.settingsApi.updateCurrentUser(request).pipe(
      map((response) => this.unwrap(response, 'Profile could not be updated.')),
      tap((profile) => {
        this.profileSignal.set(profile);
        this.profileSuccessMessageSignal.set('Profile updated successfully.');
        this.currentUserProfileRefresh.notifyProfileChanged();

        if (this.normalizeCurrency(profile.currency) !== previousCurrency) {
          this.workspaceCurrencyRefresh.notifyCurrencyChanged();
        }
      }),
      catchError((error) => {
        this.profileErrorMessagesSignal.set(extractApiErrors(error));
        return throwError(() => error);
      }),
      finalize(() => this.isSavingProfileSignal.set(false)),
    );
  }

  uploadLogo(file: File): Observable<UserLogoDto> {
    this.isUploadingLogoSignal.set(true);
    this.logoUploadProgressSignal.set(0);
    this.logoErrorMessagesSignal.set([]);
    this.logoSuccessMessageSignal.set('');

    return this.settingsApi.uploadLogo(file).pipe(
      tap((event) => {
        if (event.type === HttpEventType.UploadProgress) {
          const progress = event.total ? Math.round((event.loaded / event.total) * 100) : 50;
          this.logoUploadProgressSignal.set(progress);
        }
      }),
      filter((event) => event.type === HttpEventType.Response),
      map((event) => this.unwrap(event.body, 'Logo could not be uploaded.')),
      tap((logo) => {
        this.profileSignal.update((profile) =>
          profile ? { ...profile, logoUrl: logo.logoUrl } : profile,
        );
        this.logoVersionSignal.set(Date.now());
        this.logoUploadProgressSignal.set(100);
        this.logoSuccessMessageSignal.set('Logo uploaded successfully.');
      }),
      catchError((error) => {
        this.logoErrorMessagesSignal.set(extractApiErrors(error));
        return throwError(() => error);
      }),
      finalize(() => this.isUploadingLogoSignal.set(false)),
    );
  }

  uploadProfilePicture(file: File): Observable<UserProfilePictureDto> {
    this.isUploadingProfilePictureSignal.set(true);
    this.profilePictureUploadProgressSignal.set(0);
    this.profilePictureErrorMessagesSignal.set([]);
    this.profilePictureSuccessMessageSignal.set('');

    return this.settingsApi.uploadProfilePicture(file).pipe(
      tap((event) => {
        if (event.type === HttpEventType.UploadProgress) {
          const progress = event.total ? Math.round((event.loaded / event.total) * 100) : 50;
          this.profilePictureUploadProgressSignal.set(progress);
        }
      }),
      filter((event) => event.type === HttpEventType.Response),
      map((event) => this.unwrap(event.body, 'Profile picture could not be uploaded.')),
      tap((profilePicture) => {
        this.profileSignal.update((profile) =>
          profile ? { ...profile, profilePictureUrl: profilePicture.profilePictureUrl } : profile,
        );
        this.profilePictureVersionSignal.set(Date.now());
        this.profilePictureUploadProgressSignal.set(100);
        this.profilePictureSuccessMessageSignal.set('Profile picture uploaded successfully.');
        this.currentUserProfileRefresh.notifyProfileChanged();
      }),
      catchError((error) => {
        this.profilePictureErrorMessagesSignal.set(extractApiErrors(error));
        return throwError(() => error);
      }),
      finalize(() => this.isUploadingProfilePictureSignal.set(false)),
    );
  }

  changePassword(request: ChangePasswordRequest): Observable<string> {
    this.isChangingPasswordSignal.set(true);
    this.passwordErrorMessagesSignal.set([]);
    this.passwordSuccessMessageSignal.set('');

    return this.settingsApi.changePassword(request).pipe(
      map((response) => this.unwrap(response, 'Password could not be changed.')),
      tap((message) => this.passwordSuccessMessageSignal.set(message)),
      catchError((error) => {
        this.passwordErrorMessagesSignal.set(extractApiErrors(error));
        return throwError(() => error);
      }),
      finalize(() => this.isChangingPasswordSignal.set(false)),
    );
  }

  private unwrap<T>(response: ApiResponse<T> | null, fallbackMessage: string): T {
    if (!response?.success || response.data === null) {
      const message = response?.message ?? response?.errors[0] ?? fallbackMessage;
      throw new ApiResponseError(message, response?.errors.length ? response.errors : [message]);
    }

    return response.data;
  }

  private normalizeCurrency(currency: string | null | undefined): string {
    return currency?.trim().toUpperCase() || '';
  }
}
