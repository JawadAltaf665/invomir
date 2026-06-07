import { Injectable } from '@angular/core';

import { AuthState, AuthTokenDto, AuthUser } from './auth.models';

const LEGACY_AUTH_STORAGE_KEYS = [
  'invomir.access_token',
  'invomir.refresh_token',
  'invomir.access_token_expires_at',
  'invomir.auth_user'
];

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private authState: AuthState | null = null;

  constructor() {
    this.clearLegacyBrowserStorage();
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
    this.clearLegacyBrowserStorage();
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
