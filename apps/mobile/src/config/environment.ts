import Constants from 'expo-constants';
import { Platform } from 'react-native';

type AppExtra = {
  apiBaseUrl?: string;
  apiPort?: number | string;
  webBillingUrl?: string;
  googleWebClientId?: string;
  googleIosClientId?: string;
  googleAndroidClientId?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as AppExtra;
const configuredApiBaseUrl = extra.apiBaseUrl ?? 'http://localhost:5299';

export const appConfig = {
  apiBaseUrl: resolveApiBaseUrl(configuredApiBaseUrl, extra.apiPort ?? 5299),
  webBillingUrl: extra.webBillingUrl ?? 'https://app.invomir.com/billing',
  googleWebClientId: extra.googleWebClientId ?? '',
  googleIosClientId: extra.googleIosClientId ?? extra.googleWebClientId ?? '',
  googleAndroidClientId: extra.googleAndroidClientId ?? extra.googleWebClientId ?? '',
} as const;

function resolveApiBaseUrl(apiBaseUrl: string, apiPort: number | string): string {
  if (Platform.OS === 'web' || !isLocalhostUrl(apiBaseUrl)) {
    return trimTrailingSlash(apiBaseUrl);
  }

  const devHost = getExpoDevHost();

  if (!devHost) {
    return trimTrailingSlash(apiBaseUrl);
  }

  return isPrivateDevelopmentHost(devHost)
    ? `http://${devHost}:${apiPort}`
    : trimTrailingSlash(apiBaseUrl);
}

function isLocalhostUrl(value: string): boolean {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(value);
}

function getExpoDevHost(): string | null {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    Constants.platform?.ios?.hostUri ??
    Constants.platform?.android?.hostUri ??
    Constants.linkingUri;

  if (!hostUri) {
    return null;
  }

  const host = hostUri
    .replace(/^[a-z]+:\/\//i, '')
    .replace(/^\/\//, '')
    .split('/')[0]
    .split(':')[0];

  return host && host !== 'localhost' ? host : null;
}

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '');
}

function isPrivateDevelopmentHost(host: string): boolean {
  if (host === '127.0.0.1') {
    return true;
  }

  const parts = host.split('.').map((part) => Number(part));

  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part))) {
    return false;
  }

  return (
    parts[0] === 10 ||
    (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
    (parts[0] === 192 && parts[1] === 168)
  );
}
