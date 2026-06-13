export type SubscriptionPlanCode = 'free' | 'starter' | 'professional' | 'business';
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'trialing' | string;

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

export interface SubscriptionFeaturesDto {
  reminders: boolean;
  onlinePayments: boolean;
  reportsExport: boolean;
  teamSeats: boolean;
}
