import { SupportedCurrency } from '@/src/constants/currencies';
import { Permission } from '@/src/types/permissions';

export type AuthStatus = 'bootstrapping' | 'anonymous' | 'authenticated';
export type UserRole = 'system_admin' | 'owner' | 'admin' | 'member' | 'accountant' | 'viewer';
export type SubscriptionPlan = 'free' | 'starter' | 'professional' | 'business';

export interface AuthTokenDto {
  accessToken: string;
  accessTokenExpiresAt: string;
  userId: string;
  tenantId: string;
  email: string;
  firstName: string;
  trialEndsAt: string | null;
  plan: SubscriptionPlan | string;
  role: UserRole | string;
  permissions: readonly Permission[];
}

export interface AuthUser {
  id: string;
  tenantId: string;
  email: string;
  firstName: string;
  trialEndsAt: string | null;
  plan: SubscriptionPlan | string;
  role: UserRole | string;
  permissions: readonly Permission[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface GoogleLoginRequest {
  idToken: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  businessName: string;
  firstName: string;
  lastName: string;
  currency: SupportedCurrency;
  taxPercent: number;
}

export interface LogoutRequest {
  allDevices: boolean;
}

export interface ForgotPasswordRequest {
  email: string;
}
