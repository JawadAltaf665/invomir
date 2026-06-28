import { PaymentStatus } from '../models/payment.models';

const statusClasses: Record<PaymentStatus, string> = {
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  failed: 'bg-red-50 text-red-700 ring-red-200',
  refunded: 'bg-amber-50 text-amber-700 ring-amber-200',
};

export function paymentStatusLabel(status: string): string {
  return toTitleCase(status);
}

export function paymentStatusClass(status: string): string {
  const normalizedStatus = status.toLowerCase() as PaymentStatus;
  const statusClass =
    statusClasses[normalizedStatus] ?? 'bg-neutral-100 text-neutral-700 ring-neutral-200';

  return `inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusClass}`;
}

export function formatPaymentCurrency(value: number, currency: string, locale = 'en'): string {
  const safeValue = Number.isFinite(value) ? value : 0;

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      currencyDisplay: 'code',
      maximumFractionDigits: 2,
    }).format(safeValue);
  } catch {
    return `${currency} ${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(safeValue)}`;
  }
}

export function formatStripeConnectedDate(
  value: string | null | undefined,
  locale = 'en',
): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}
export function formatPaymentDateTime(
  value: string | null | undefined,
  locale = 'en',
  notSetLabel = 'Not set',
): string {
  if (!value) {
    return notSetLabel;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return notSetLabel;
  }

  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function formatPaymentGatewayReference(
  stripePaymentIntentId: string | null,
  stripeChargeId: string | null,
  manualEntryLabel = 'Manual entry',
): string {
  return stripePaymentIntentId ?? stripeChargeId ?? manualEntryLabel;
}

function toTitleCase(value: string): string {
  return value
    .replace(/[-_]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(' ');
}
