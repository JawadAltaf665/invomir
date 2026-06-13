import { create } from 'zustand';

import { clearSession, loadSession, saveSession } from '@/src/services/auth/session-storage';
import { setAccessToken } from '@/src/services/api/auth-token';
import { AuthStatus, AuthTokenDto, AuthUser } from '@/src/features/auth/types';
import { Permission } from '@/src/types/permissions';

interface AuthStore {
  status: AuthStatus;
  user: AuthUser | null;
  accessToken: string | null;
  accessTokenExpiresAt: string | null;
  restoreSession: () => Promise<void>;
  setSession: (token: AuthTokenDto) => Promise<void>;
  clearLocalSession: () => Promise<void>;
  hasPermission: (permission: Permission) => boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  status: 'bootstrapping',
  user: null,
  accessToken: null,
  accessTokenExpiresAt: null,

  async restoreSession() {
    const session = await loadSession();

    if (!session || !isTokenFresh(session.accessTokenExpiresAt)) {
      await clearSession();
      setAccessToken(null);
      set({ status: 'anonymous', user: null, accessToken: null, accessTokenExpiresAt: null });
      return;
    }

    setAccessToken(session.accessToken);
    set({
      status: 'authenticated',
      user: toAuthUser(session),
      accessToken: session.accessToken,
      accessTokenExpiresAt: session.accessTokenExpiresAt,
    });
  },

  async setSession(token) {
    await saveSession(token);
    setAccessToken(token.accessToken);
    set({
      status: 'authenticated',
      user: toAuthUser(token),
      accessToken: token.accessToken,
      accessTokenExpiresAt: token.accessTokenExpiresAt,
    });
  },

  async clearLocalSession() {
    await clearSession();
    setAccessToken(null);
    set({ status: 'anonymous', user: null, accessToken: null, accessTokenExpiresAt: null });
  },

  hasPermission(permission) {
    return Boolean(get().user?.permissions.includes(permission));
  },
}));

function toAuthUser(token: AuthTokenDto): AuthUser {
  return {
    id: token.userId,
    tenantId: token.tenantId,
    email: token.email,
    firstName: token.firstName,
    trialEndsAt: token.trialEndsAt,
    plan: token.plan,
    role: token.role,
    permissions: token.permissions,
  };
}

function isTokenFresh(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) {
    return false;
  }

  const expiresAtMs = new Date(expiresAt).getTime();
  return Number.isFinite(expiresAtMs) && expiresAtMs - 30_000 > Date.now();
}
