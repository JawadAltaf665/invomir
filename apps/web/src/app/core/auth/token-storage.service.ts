import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

import { AuthState, AuthTokenDto, AuthUser } from './auth.models';

const ACCESS_TOKEN_KEY = 'invomir.access_token';
const REFRESH_TOKEN_KEY = 'invomir.refresh_token';
const EXPIRES_AT_KEY = 'invomir.access_token_expires_at';
const USER_KEY = 'invomir.auth_user';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  getAccessToken(): string | null {
    return this.read(ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return this.read(REFRESH_TOKEN_KEY);
  }

  getAccessTokenExpiresAt(): string | null {
    return this.read(EXPIRES_AT_KEY);
  }

  getStoredState(): AuthState | null {
    const accessToken = this.getAccessToken();
    const accessTokenExpiresAt = this.getAccessTokenExpiresAt();
    const userJson = this.read(USER_KEY);

    if (!accessToken || !accessTokenExpiresAt || !userJson) {
      return null;
    }

    try {
      const user = JSON.parse(userJson) as AuthUser;

      return {
        status: this.isAccessTokenValid() ? 'authenticated' : 'anonymous',
        user,
        accessToken,
        accessTokenExpiresAt
      };
    } catch {
      this.clear();
      return null;
    }
  }

  saveToken(token: AuthTokenDto): AuthState {
    const user = this.toUser(token);

    this.write(ACCESS_TOKEN_KEY, token.accessToken);
    this.write(REFRESH_TOKEN_KEY, token.refreshToken);
    this.write(EXPIRES_AT_KEY, token.accessTokenExpiresAt);
    this.write(USER_KEY, JSON.stringify(user));

    return {
      status: 'authenticated',
      user,
      accessToken: token.accessToken,
      accessTokenExpiresAt: token.accessTokenExpiresAt
    };
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
    this.remove(ACCESS_TOKEN_KEY);
    this.remove(REFRESH_TOKEN_KEY);
    this.remove(EXPIRES_AT_KEY);
    this.remove(USER_KEY);
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

  private read(key: string): string | null {
    return this.isBrowser ? window.localStorage.getItem(key) : null;
  }

  private write(key: string, value: string): void {
    if (this.isBrowser) {
      window.localStorage.setItem(key, value);
    }
  }

  private remove(key: string): void {
    if (this.isBrowser) {
      window.localStorage.removeItem(key);
    }
  }
}
