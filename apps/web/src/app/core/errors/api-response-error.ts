import { HttpErrorResponse } from '@angular/common/http';

import { ApiResponse } from '../models/api-response.model';

export class ApiResponseError extends Error {
  constructor(
    message: string,
    readonly errors: readonly string[] = [message],
    readonly status?: number
  ) {
    super(message);
    this.name = 'ApiResponseError';
  }
}

export function extractApiErrors(error: unknown): readonly string[] {
  if (error instanceof ApiResponseError) {
    return error.errors.length > 0 ? error.errors : [error.message];
  }

  if (error instanceof HttpErrorResponse) {
    const apiError = error.error as Partial<ApiResponse<unknown>> | undefined;

    if (Array.isArray(apiError?.errors) && apiError.errors.length > 0) {
      return apiError.errors.filter((item): item is string => typeof item === 'string');
    }

    if (typeof apiError?.message === 'string' && apiError.message.length > 0) {
      return [apiError.message];
    }

    if (typeof error.message === 'string' && error.message.length > 0) {
      return [error.message];
    }
  }

  if (error instanceof Error && error.message.length > 0) {
    return [error.message];
  }

  return ['Something went wrong. Please try again.'];
}

export function firstApiError(error: unknown): string {
  return extractApiErrors(error)[0] ?? 'Something went wrong. Please try again.';
}
