import { PaymentStatus } from '../models/payment.models';

const statusClasses: Record<PaymentStatus, string> = {
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  failed: 'bg-red-50 text-red-700 ring-red-200',
  refunded: 'bg-amber-50 text-amber-700 ring-amber-200',
};

const methodLabels: Record<string, string> = {
  card: 'Card',
  cash: 'Cash',
  bank_transfer: 'Bank transfer',
  cheque: 'Cheque',
  other: 'Other',
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

export function paymentMethodLabel(method: string): string {
  return methodLabels[method.toLowerCase()] ?? toTitleCase(method);
}

export function formatPaymentCurrency(value: number, currency: string): string {
  const safeValue = Number.isFinite(value) ? value : 0;

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      currencyDisplay: 'code',
      maximumFractionDigits: 2,
    }).format(safeValue);
  } catch {
    return `${currency} ${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(safeValue)}`;
  }
}

export function formatPaymentDateTime(value: string | null | undefined): string {
  if (!value) {
    return 'Not set';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Not set';
  }

  return new Intl.DateTimeFormat('en-US', {
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
): string {
  return stripePaymentIntentId ?? stripeChargeId ?? 'Manual entry';
}

function toTitleCase(value: string): string {
  return value
    .replace(/[-_]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`)
    .join(' ');
}
