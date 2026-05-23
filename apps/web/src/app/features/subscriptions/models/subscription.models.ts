export type SubscriptionPlanCode = 'free' | 'starter' | 'professional' | 'business';
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'trialing' | string;
export type SubscriptionInterval = 'month' | 'year';

export interface CurrentSubscriptionDto {
  plan: SubscriptionPlanCode | string;
  status: SubscriptionStatus;
  pricePerMonth: number;
  pricePerYear: number;
  currency: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  trialDaysRemaining: number | null;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  cancelAtPeriodEnd: boolean;
  cancelledAt: string | null;
  usage: SubscriptionUsageDto;
  features: SubscriptionFeaturesDto;
}

export interface SubscriptionUsageDto {
  clients: SubscriptionUsageMetricDto;
  invoicesThisMonth: SubscriptionUsageMetricDto;
}

export interface SubscriptionUsageMetricDto {
  used: number;
  limit: number | null;
}

export interface SubscriptionPlansDto {
  plans: readonly SubscriptionPlanDto[];
}

export interface SubscriptionPlanDto {
  plan: SubscriptionPlanCode | string;
  name: string;
  description: string;
  pricePerMonth: number;
  pricePerYear: number;
  currency: string;
  monthlyCheckoutAvailable: boolean;
  yearlyCheckoutAvailable: boolean;
  limits: SubscriptionPlanLimitsDto;
  features: SubscriptionFeaturesDto;
}

export interface SubscriptionPlanLimitsDto {
  clients: number | null;
  invoicesPerMonth: number | null;
  teamSeats: number;
}

export interface SubscriptionFeaturesDto {
  reminders: boolean;
  onlinePayments: boolean;
  reportsExport: boolean;
  teamSeats: boolean;
}

export interface SubscriptionCheckoutRequest {
  plan: string;
  interval: SubscriptionInterval;
}

export interface SubscriptionCheckoutDto {
  checkoutUrl: string;
  sessionId: string;
}

export interface SubscriptionCancellationDto {
  stripeSubscriptionId: string;
  status: SubscriptionStatus;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  cancelledAt: string | null;
}

export interface SubscriptionUsageMetricView {
  id: string;
  label: string;
  usedDisplay: string;
  limitDisplay: string;
  helper: string;
  percentage: number;
  tone: 'neutral' | 'warning' | 'danger';
}

export interface SubscriptionFeatureView {
  id: keyof SubscriptionFeaturesDto;
  label: string;
  description: string;
  enabled: boolean;
}

export interface SubscriptionPlanCardView {
  plan: SubscriptionPlanDto;
  priceDisplay: string;
  yearlyPriceDisplay: string;
  savingsDisplay: string | null;
  limitSummary: readonly string[];
  features: readonly SubscriptionFeatureView[];
  isCurrent: boolean;
  isPaid: boolean;
  isPopular: boolean;
  isRecommended: boolean;
}
