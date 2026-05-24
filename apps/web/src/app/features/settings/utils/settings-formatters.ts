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
export const acceptedProfilePictureTypes = ['image/png', 'image/jpeg', 'image/webp'] as const;
export const acceptedProfilePictureExtensions = ['.png', '.jpg', '.jpeg', '.webp'] as const;
export const maxLogoBytes = 2 * 1024 * 1024;
export const maxProfilePictureBytes = 2 * 1024 * 1024;

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

export function resolveLogoUrl(
  logoUrl: string | null,
  cacheKey?: string | number | null,
): string | null {
  return resolveAssetUrl(logoUrl, cacheKey);
}

export function resolveProfilePictureUrl(
  profilePictureUrl: string | null,
  cacheKey?: string | number | null,
): string | null {
  return resolveAssetUrl(profilePictureUrl, cacheKey);
}

export function resolveAssetUrl(
  assetUrl: string | null,
  cacheKey?: string | number | null,
): string | null {
  if (!assetUrl) {
    return null;
  }

  const resolvedUrl = /^https?:\/\//i.test(assetUrl) ? assetUrl : apiUrl(assetUrl);

  if (cacheKey === null || cacheKey === undefined || cacheKey === '') {
    return resolvedUrl;
  }

  const separator = resolvedUrl.includes('?') ? '&' : '?';
  return `${resolvedUrl}${separator}v=${encodeURIComponent(String(cacheKey))}`;
}

export function isAcceptedLogoFile(file: File): boolean {
  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();

  return (
    acceptedLogoTypes.some((type) => type.toLowerCase() === file.type.toLowerCase()) &&
    acceptedLogoExtensions.some((allowedExtension) => allowedExtension === extension)
  );
}

export function isAcceptedProfilePictureFile(file: File): boolean {
  const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();

  return (
    acceptedProfilePictureTypes.some((type) => type.toLowerCase() === file.type.toLowerCase()) &&
    acceptedProfilePictureExtensions.some((allowedExtension) => allowedExtension === extension)
  );
}
