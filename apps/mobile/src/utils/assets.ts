import { appConfig } from '@/src/config/environment';

export function resolveAssetUrl(assetUrl: string | null | undefined, cacheKey?: string | number | null): string | null {
  if (!assetUrl) {
    return null;
  }

  const trimmedUrl = assetUrl.trim();

  if (!trimmedUrl) {
    return null;
  }

  const resolvedUrl = /^(https?:|data:|file:|blob:)/i.test(trimmedUrl)
    ? trimmedUrl
    : `${appConfig.apiBaseUrl}/${trimmedUrl.replace(/^\/+/, '')}`;

  if (cacheKey === null || cacheKey === undefined || cacheKey === '') {
    return resolvedUrl;
  }

  const separator = resolvedUrl.includes('?') ? '&' : '?';
  return `${resolvedUrl}${separator}v=${encodeURIComponent(String(cacheKey))}`;
}
