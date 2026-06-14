import { AxiosError } from 'axios';

import { ApiProblem, ApiResponse } from '@/src/types/api';

const fallbackMessage = 'We could not complete the request. Please try again.';

export function normalizeApiError(error: unknown): ApiProblem {
  if (!isAxiosError(error)) {
    return {
      status: 0,
      message: fallbackMessage,
      errors: [fallbackMessage],
      isUnauthorized: false,
      isForbidden: false,
      isNetworkError: false,
    };
  }

  const status = error.response?.status ?? 0;
  const responseData = error.response?.data as Partial<ApiResponse<unknown>> | undefined;
  const responseErrors = Array.isArray(responseData?.errors) ? responseData.errors : [];
  const message =
    responseErrors[0] ??
    responseData?.message ??
    friendlyStatusMessage(status, Boolean(error.request && !error.response));

  return {
    status,
    message,
    errors: responseErrors.length > 0 ? responseErrors : [message],
    isUnauthorized: status === 401,
    isForbidden: status === 403,
    isNetworkError: Boolean(error.request && !error.response),
  };
}

function isAxiosError(error: unknown): error is AxiosError {
  return Boolean(error && typeof error === 'object' && 'isAxiosError' in error);
}

function friendlyStatusMessage(status: number, isNetworkError: boolean): string {
  if (isNetworkError) {
    return 'We could not reach InvoMir. Please check your connection and try again.';
  }

  if (status === 401) {
    return 'Your session has expired. Please log in again.';
  }

  if (status === 403) {
    return 'You do not have permission to perform this action.';
  }

  if (status === 422) {
    return 'Please check the highlighted details and try again.';
  }

  if (status >= 500) {
    return 'InvoMir is having trouble right now. Please try again shortly.';
  }

  return fallbackMessage;
}
