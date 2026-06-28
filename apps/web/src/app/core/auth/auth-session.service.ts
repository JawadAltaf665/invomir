import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, firstValueFrom, map, of, shareReplay, tap, throwError } from 'rxjs';

import { ApiResponseError } from '../errors/api-response-error';
import { ApiResponse } from '../models/api-response.model';
import { Permission } from '../permissions/permissions';
import { AuthApiService } from './auth-api.service';
import {
  AuthState,
  AuthTokenDto,
  ForgotPasswordRequest,
  GoogleLoginRequest,
  LoginRequest,
  RegisterRequest,
  ResetPasswordRequest,
  VerifyEmailRequest
} from './auth.models';
import { TokenStorageService } from './token-storage.service';

const anonymousState: AuthState = {
  status: 'anonymous',
  user: null,
  accessToken: null,
  accessTokenExpiresAt: null
};

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly authApi = inject(AuthApiService);
  private readonly tokenStorage = inject(TokenStorageService);
  private refreshInFlight$: Observable<AuthTokenDto> | null = null;
  private readonly stateSignal = signal<AuthState>(this.tokenStorage.getStoredState() ?? anonymousState);
  private readonly authInitializedSignal = signal(false);

  readonly state = this.stateSignal.asReadonly();
  /** True once the APP_INITIALIZER has finished checking/refreshing the session. */
  readonly authInitialized = this.authInitializedSignal.asReadonly();
  readonly user = computed(() => this.state().user);
  readonly status = computed(() => this.state().status);
  readonly isAuthenticated = computed(
    () => this.state().status === 'authenticated' && this.tokenStorage.isAccessTokenValid()
  );
  readonly permissions = computed(() => this.state().user?.permissions ?? []);
  readonly role = computed(() => this.state().user?.role ?? null);

  /**
   * Called by APP_INITIALIZER before routes are evaluated.
   * - If the access token is valid → marks initialized immediately.
   * - If the token is expired but we have stored user data → attempt silent
   *   refresh (the httpOnly refresh-token cookie is sent automatically).
   * - On any failure → clears state and marks initialized so the guard can
   *   redirect to /auth/login cleanly.
   */
  async initializeAuth(): Promise<void> {
    try {
      if (this.isAuthenticated()) {
        return; // Token still valid — no network call needed.
      }

      if (this.tokenStorage.hasStoredUser()) {
        // Access token expired but user was previously logged in — try silent refresh.
        await firstValueFrom(this.refreshSession());
      }
    } catch {
      // Refresh token also expired or revoked — clear everything gracefully.
      this.clearSession();
    } finally {
      this.authInitializedSignal.set(true);
    }
  }

  login(request: LoginRequest): Observable<AuthTokenDto> {
    return this.authApi.login(request).pipe(
      map(response => this.unwrap(response)),
      tap(token => this.acceptToken(token))
    );
  }

  googleLogin(request: GoogleLoginRequest): Observable<AuthTokenDto> {
    return this.authApi.googleLogin(request).pipe(
      map(response => this.unwrap(response)),
      tap(token => this.acceptToken(token))
    );
  }

  register(request: RegisterRequest): Observable<AuthTokenDto> {
    return this.authApi.register(request).pipe(
      map(response => this.unwrap(response)),
      tap(token => this.acceptToken(token))
    );
  }

  refreshSession(): Observable<AuthTokenDto> {
    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }

    this.stateSignal.update(state => ({ ...state, status: 'refreshing' }));

    this.refreshInFlight$ = this.authApi.refresh().pipe(
      map(response => this.unwrap(response)),
      tap(token => this.acceptToken(token)),
      catchError(error => {
        this.clearSession();
        return throwError(() => error);
      }),
      finalize(() => {
        this.refreshInFlight$ = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    return this.refreshInFlight$;
  }

  logout(allDevices = false): Observable<void> {
    return this.authApi.logout({ allDevices }).pipe(
      map(response => this.unwrap(response)),
      map(() => undefined),
      catchError(error => {
        this.clearSession();
        return throwError(() => error);
      }),
      finalize(() => this.clearSession())
    );
  }

  forgotPassword(request: ForgotPasswordRequest): Observable<string> {
    return this.authApi.forgotPassword(request).pipe(map(response => this.unwrap(response)));
  }

  resetPassword(request: ResetPasswordRequest): Observable<string> {
    return this.authApi.resetPassword(request).pipe(
      map(response => this.unwrap(response)),
      tap(() => this.clearSession())
    );
  }

  verifyEmail(request: VerifyEmailRequest): Observable<string> {
    return this.authApi.verifyEmail(request).pipe(map(response => this.unwrap(response)));
  }

  ensureAuthenticated(): Observable<boolean> {
    if (this.isAuthenticated()) {
      return of(true);
    }

    return this.refreshSession().pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  hasPermission(permission: Permission): boolean {
    return this.permissions().includes(permission);
  }

  hasAnyPermission(requiredPermissions: readonly Permission[]): boolean {
    return requiredPermissions.some(permission => this.hasPermission(permission));
  }

  hasAllPermissions(requiredPermissions: readonly Permission[]): boolean {
    return requiredPermissions.every(permission => this.hasPermission(permission));
  }

  clearSession(): void {
    this.tokenStorage.clear();
    this.stateSignal.set(anonymousState);
  }

  private acceptToken(token: AuthTokenDto): void {
    this.stateSignal.set(this.tokenStorage.saveToken(token));
  }

  private unwrap<T>(response: ApiResponse<T>): T {
    if (!response.success || response.data === null) {
      const message = response.message ?? response.errors[0] ?? 'Request failed.';
      throw new ApiResponseError(message, response.errors.length > 0 ? response.errors : [message]);
    }

    return response.data;
  }
}
