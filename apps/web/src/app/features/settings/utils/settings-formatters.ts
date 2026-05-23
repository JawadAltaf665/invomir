import { supportedCurrencies } from '../../../core/auth/auth.models';
import { apiUrl } from '../../../core/config/api-url';
import { CurrencyOption } from '../models/settings.models';

const currencyHelpers: Record<string, string> = {
  USD: 'US dollar',
  PKR: 'Pakistani rupee',
  AED: 'UAE dirham',
  GBP: 'British pound',
  EUR: 'Euro',
  SAR: 'Saudi riyal',
};

export const settingsCurrencyOptions: readonly CurrencyOption[] = supportedCurrencies.map(
  (currency) => ({
    value: currency,
    label: currency,
    helper: currencyHelpers[currency],
  }),
);

export const acceptedLogoTypes = ['image/png', 'image/jpeg', 'image/svg+xml'] as const;
export const acceptedLogoExtensions = ['.png', '.jpg', '.jpeg', '.svg'] as const;
export const maxLogoBytes = 2 * 1024 * 1024;

export function formatProfileName(firstName: string, lastName: string): string {
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName.length > 0 ? fullName : 'Account user';
}

export function formatSettingsDate(value: string | null): string {
  if (!value) {
    return 'Not set';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatSettingsDateTime(value: string | null): string {
  if (!value) {
    return 'Not set';
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export function formatSettingsLabel(value: string | null | undefined): string {
  if (!value) {
    return 'Not set';
  }

  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function resolveLogoUrl(logoUrl: string | null): string | null {
  if (!logoUrl) {
    return null;
  }

  if (/^https?:\/\//i.test(logoUrl)) {
    return logoUrl;
  }

  return apiUrl(logoUrl);
}

export function isAcceptedLogoFile(file: File): boolean {
  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();

  return (
    acceptedLogoTypes.some((type) => type.toLowerCase() === file.type.toLowerCase()) &&
    acceptedLogoExtensions.some((allowedExtension) => allowedExtension === extension)
  );
}
