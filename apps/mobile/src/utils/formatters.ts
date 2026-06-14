import { format, isValid, parseISO } from 'date-fns';

export function formatMoney(amount: number, currency: string, locale = 'en'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

export function formatDate(value: string | null | undefined, fallback = 'Not set'): string {
  if (!value) {
    return fallback;
  }

  const parsed = parseISO(value);

  if (!isValid(parsed)) {
    return fallback;
  }

  return format(parsed, 'dd-MM-yyyy');
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? 'I';
  const second = parts[1]?.[0] ?? '';

  return `${first}${second}`.toUpperCase();
}

export function formatCount(count: number, singular: string, plural: string): string {
  return count === 1 ? `1 ${singular}` : `${count} ${plural}`;
}
