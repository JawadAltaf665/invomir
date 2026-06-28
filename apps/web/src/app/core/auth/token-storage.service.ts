import { Injectable } from '@angular/core';

import { AuthState, AuthTokenDto, AuthUser } from './auth.models';

const AUTH_STATE_STORAGE_KEY = 'invomir.auth';

const LEGACY_AUTH_STORAGE_KEYS = [
  'invomir.access_token',
  'invomir.refresh_token',
  'invomir.access_token_expires_at',
  'invomir.auth_user'
];

/** Persisted shape — access token + expiry + user info. Refresh token stays in httpOnly cookie only. */
interface PersistedAuthState {
  accessToken: string;
  accessTokenExpiresAt: string;
  user: AuthUser;
}

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private authState: AuthState | null = null;

  constructor() {
    this.clearLegacyBrowserStorage();
    this.loadFromStorage();
  }

  getAccessToken(): string | null {
    return this.authState?.accessToken ?? null;
  }

  getAccessTokenExpiresAt(): string | null {
    return this.authState?.accessTokenExpiresAt ?? null;
  }

  getStoredState(): AuthState | null {
    if (!this.authState) {
      return null;
    }

    return this.isAccessTokenValid()
      ? this.authState
      : {
          ...this.authState,
          status: 'anonymous'
        };
  }

  saveToken(token: AuthTokenDto): AuthState {
    const user = this.toUser(token);
    this.authState = {
      status: 'authenticated',
      user,
      accessToken: token.accessToken,
      accessTokenExpiresAt: token.accessTokenExpiresAt
    };

    this.persistToStorage(this.authState);
    return this.authState;
  }

  isAccessTokenValid(bufferMs = 30_000): boolean {
    const expiresAt = this.getAccessTokenExpiresAt();

    if (!expiresAt) {
      return false;
    }

    const expiresAtMs = new Date(expiresAt).getTime();
    return Number.isFinite(expiresAtMs) && expiresAtMs - bufferMs > Date.now();
  }

  clear(): void {
    this.authState = null;
    this.removeFromStorage();
    this.clearLegacyBrowserStorage();
  }

  /**
   * Indicates whether the stored state has a user context (even if the access
   * token is expired). Used by the auth initializer to decide whether to
   * attempt a silent refresh instead of redirecting to login immediately.
   */
  hasStoredUser(): boolean {
    return this.authState?.user != null;
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const raw = window.localStorage.getItem(AUTH_STATE_STORAGE_KEY);
      if (!raw) return;

      const parsed = JSON.parse(raw) as PersistedAuthState;
      if (!parsed?.accessToken || !parsed?.user) return;

      this.authState = {
        status: 'authenticated',
        user: parsed.user,
        accessToken: parsed.accessToken,
        accessTokenExpiresAt: parsed.accessTokenExpiresAt ?? null
      };
    } catch {
      // Corrupted storage — ignore and start fresh
      this.removeFromStorage();
    }
  }

  private persistToStorage(state: AuthState): void {
    if (typeof window === 'undefined' || !state.user) {
      return;
    }

    const persisted: PersistedAuthState = {
      accessToken: state.accessToken!,
      accessTokenExpiresAt: state.accessTokenExpiresAt!,
      user: state.user
    };

    window.localStorage.setItem(AUTH_STATE_STORAGE_KEY, JSON.stringify(persisted));
  }

  private removeFromStorage(): void {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(AUTH_STATE_STORAGE_KEY);
    }
  }

  private toUser(token: AuthTokenDto): AuthUser {
    return {
      id: token.userId,
      tenantId: token.tenantId,
      email: token.email,
      firstName: token.firstName,
      trialEndsAt: token.trialEndsAt,
      plan: token.plan,
      role: token.role,
      permissions: token.permissions
    };
  }

  private clearLegacyBrowserStorage(): void {
    if (typeof window === 'undefined') {
      return;
    }

    for (const key of LEGACY_AUTH_STORAGE_KEYS) {
      window.localStorage.removeItem(key);
    }
  }
}
