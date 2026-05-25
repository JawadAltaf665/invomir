import { SupportedCurrency } from '../../../core/auth/auth.models';

export interface UserProfileDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  businessName: string;
  logoUrl: string | null;
  profilePictureUrl: string | null;
  currency: SupportedCurrency | string;
  taxPercent: number;
  plan: string;
  role: string;
  stripeAccountId: string | null;
  emailVerified: boolean;
  lastLoginAt: string | null;
  trialEndsAt: string | null;
  createdAt: string;
}

export interface UserLogoDto {
  logoUrl: string;
}

export interface UserProfilePictureDto {
  profilePictureUrl: string;
}

export interface UpdateUserProfileRequest {
  businessName: string;
  currency: SupportedCurrency;
  taxPercent: number;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface CurrencyOption {
  value: SupportedCurrency;
  label: string;
  helper: string;
}
