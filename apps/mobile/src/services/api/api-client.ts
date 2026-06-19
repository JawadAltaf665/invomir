import { create, AxiosRequestConfig } from 'axios';

import { appConfig } from '@/src/config/environment';
import { getAccessToken } from '@/src/services/api/auth-token';
import { normalizeApiError } from '@/src/services/api/api-error';
import { ApiResponse } from '@/src/types/api';

type UnauthorizedHandler = () => void;

let unauthorizedHandler: UnauthorizedHandler | null = null;

export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler;
}

export const apiClient = create({
  baseURL: appConfig.apiBaseUrl,
  timeout: 20_000,
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

if (__DEV__) {
  console.info(`[InvoMir API] ${appConfig.apiBaseUrl}`);
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const normalized = normalizeApiError(error);

    if (normalized.isUnauthorized) {
      unauthorizedHandler?.();
    }

    return Promise.reject(normalized);
  },
);

export async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.request<ApiResponse<T>>(config);
  const body = response.data;

  if (body?.success && body.data !== null) {
    return body.data;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  throw {
    status: response.status,
    message: body?.message ?? 'The server returned an empty response.',
    errors: body?.errors?.length ? body.errors : [body?.message ?? 'The server returned an empty response.'],
    isUnauthorized: response.status === 401,
    isForbidden: response.status === 403,
    isNetworkError: false,
  };
}

export async function apiRequestVoid(config: AxiosRequestConfig): Promise<void> {
  await apiClient.request(config);
}
