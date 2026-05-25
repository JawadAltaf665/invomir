import { SupportedCurrency } from '../auth/auth.models';

export interface CurrentUserProfileDto {
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

export interface UpdateCurrentUserProfileRequest {
  businessName?: string | null;
  currency?: SupportedCurrency | string | null;
  taxPercent?: number | null;
}
