import {
  CurrentSubscriptionDto,
  SubscriptionFeatureView,
  SubscriptionFeaturesDto,
  SubscriptionInterval,
  SubscriptionPlanCardView,
  SubscriptionPlanDto,
  SubscriptionUsageMetricDto,
  SubscriptionUsageMetricView,
} from '../models/subscription.models';

const featureLabels: Record<keyof SubscriptionFeaturesDto, string> = {
  reminders: 'Payment reminders',
  onlinePayments: 'Online payments',
  reportsExport: 'Report exports',
  teamSeats: 'Team seats',
};

const featureDescriptions: Record<keyof SubscriptionFeaturesDto, string> = {
  reminders: 'Automated payment follow-ups for unpaid invoices.',
  onlinePayments: 'Hosted invoice payment pages with card collection.',
  reportsExport: 'Downloadable CSV and PDF report exports.',
  teamSeats: 'Additional staff access for shared billing work.',
};

export function formatBillingCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}

export function formatBillingDate(value: string | null): string {
  if (!value) {
    return 'Not set';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatBillingLabel(value: string | null | undefined): string {
  if (!value) {
    return 'Not set';
  }

  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatBillingStatusTone(
  status: string,
  cancelAtPeriodEnd: boolean,
): 'success' | 'warning' | 'danger' | 'neutral' {
  if (cancelAtPeriodEnd) {
    return 'warning';
  }

  if (status === 'active' || status === 'trialing') {
    return 'success';
  }

  if (status === 'past_due') {
    return 'danger';
  }

  return 'neutral';
}

export function formatBillingStatusLabel(status: string, cancelAtPeriodEnd: boolean): string {
  if (cancelAtPeriodEnd) {
    return 'Cancels at period end';
  }

  return formatBillingLabel(status);
}

export function formatTrialDaysRemaining(daysRemaining: number | null): string {
  if (daysRemaining === null) {
    return 'Trial period not active';
  }

  if (daysRemaining <= 1) {
    return '1 day left in your trial';
  }

  return `${daysRemaining.toLocaleString('en-US')} days left in your trial`;
}

export function buildFeatureViews(
  features: SubscriptionFeaturesDto,
): readonly SubscriptionFeatureView[] {
  return (Object.keys(featureLabels) as (keyof SubscriptionFeaturesDto)[]).map((id) => ({
    id,
    label: featureLabels[id],
    description: featureDescriptions[id],
    enabled: features[id],
  }));
}

export function buildUsageMetricView(
  id: string,
  label: string,
  metric: SubscriptionUsageMetricDto,
): SubscriptionUsageMetricView {
  const percentage = metric.limit
    ? Math.min(100, Math.round((metric.used / metric.limit) * 100))
    : 0;
  const limitDisplay = metric.limit === null ? 'Unlimited' : metric.limit.toLocaleString('en-US');
  const helper =
    metric.limit === null
      ? `${metric.used.toLocaleString('en-US')} used`
      : `${metric.used.toLocaleString('en-US')} of ${limitDisplay} used`;

  return {
    id,
    label,
    usedDisplay: metric.used.toLocaleString('en-US'),
    limitDisplay,
    helper,
    percentage,
    tone: percentage >= 90 ? 'danger' : percentage >= 75 ? 'warning' : 'neutral',
  };
}

export function buildPlanCardView(
  plan: SubscriptionPlanDto,
  currentSubscription: CurrentSubscriptionDto | null,
): SubscriptionPlanCardView {
  const yearlySavings = plan.pricePerMonth * 12 - plan.pricePerYear;
  const isPaid = plan.pricePerMonth > 0 || plan.pricePerYear > 0;

  return {
    plan,
    priceDisplay: formatBillingCurrency(plan.pricePerMonth, plan.currency),
    yearlyPriceDisplay: formatBillingCurrency(plan.pricePerYear, plan.currency),
    savingsDisplay:
      yearlySavings > 0 ? `Save ${formatBillingCurrency(yearlySavings, plan.currency)}` : null,
    limitSummary: [
      `Clients: ${formatLimit(plan.limits.clients)}`,
      `Invoices: ${formatLimit(plan.limits.invoicesPerMonth)}`,
      `Team seats: ${plan.limits.teamSeats}`,
    ],
    features: buildFeatureViews(plan.features),
    isCurrent: currentSubscription?.plan === plan.plan,
    isPaid,
    isPopular: plan.plan === 'starter',
    isRecommended: plan.plan === 'professional',
  };
}

export function checkoutButtonLabel(
  card: SubscriptionPlanCardView,
  interval: SubscriptionInterval,
): string {
  if (card.isCurrent) {
    return 'Current plan';
  }

  if (!card.isPaid) {
    return 'Free plan';
  }

  return `Choose ${interval === 'year' ? 'yearly' : 'monthly'}`;
}

function formatLimit(limit: number | null): string {
  return limit === null ? 'Unlimited' : limit.toLocaleString('en-US');
}
