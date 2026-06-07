import { Permission } from '../permissions/permissions';

export type AuthStatus = 'anonymous' | 'authenticated' | 'refreshing';

export type UserRole = 'system_admin' | 'owner' | 'admin' | 'member' | 'accountant' | 'viewer';

export type SubscriptionPlan = 'free' | 'starter' | 'professional' | 'business';

export type SupportedCurrency = 'USD' | 'PKR' | 'AED' | 'GBP' | 'EUR' | 'SAR';

export const supportedCurrencies: readonly SupportedCurrency[] = ['USD', 'PKR', 'AED', 'GBP', 'EUR', 'SAR'];

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

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  accessToken: string | null;
  accessTokenExpiresAt: string | null;
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

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}
