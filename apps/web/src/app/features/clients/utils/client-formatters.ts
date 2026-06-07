export function formatClientDate(
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
  }).format(date);
}

export function formatClientCurrency(
  value: number | null | undefined,
  currency: string,
  locale = 'en',
): string {
  const safeValue = Number(value ?? 0);

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'code',
    maximumFractionDigits: 2,
  }).format(Number.isFinite(safeValue) ? safeValue : 0);
}

export function clientInitials(name: string | null | undefined): string {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return 'CL';
  }

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export function clientInvoiceStatusLabel(status: string): string {
  return status
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function clientInvoiceStatusClass(status: string): string {
  switch (status.toLowerCase()) {
    case 'paid':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'sent':
    case 'viewed':
      return 'border-blue-200 bg-blue-50 text-blue-700';
    case 'overdue':
      return 'border-red-200 bg-red-50 text-red-700';
    case 'cancelled':
      return 'border-neutral-200 bg-neutral-100 text-neutral-600';
    default:
      return 'border-amber-200 bg-amber-50 text-amber-700';
  }
}
