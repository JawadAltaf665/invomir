import { SupportedCurrency } from '@/src/constants/currencies';
import { SupportedLanguage } from '@/src/constants/languages';

export interface UserProfileDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  businessName: string;
  logoUrl: string | null;
  profilePictureUrl: string | null;
  currency: SupportedCurrency | string;
  preferredLanguage: SupportedLanguage | string;
  taxPercent: number;
  plan: string;
  role: string;
  stripeAccountId: string | null;
  emailVerified: boolean;
  lastLoginAt: string | null;
  trialEndsAt: string | null;
  createdAt: string;
}

export interface UpdateUserProfileRequest {
  businessName?: string | null;
  currency?: SupportedCurrency | string | null;
  taxPercent?: number | null;
}

export interface LanguagePreferenceDto {
  language: SupportedLanguage | string;
}

export interface UpdateLanguagePreferenceRequest {
  language: SupportedLanguage;
}
