import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { AuthSessionService } from '../auth/auth-session.service';
import { TokenStorageService } from '../auth/token-storage.service';

const publicAuthEndpoints = [
  '/api/auth/login',
  '/api/auth/google',
  '/api/auth/register',
  '/api/auth/refresh',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/auth/verify-email'
];

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authSession = inject(AuthSessionService);
  const tokenStorage = inject(TokenStorageService);
  const isApiRequest = request.url.startsWith(environment.apiBaseUrl) || request.url.startsWith('/api/');
  const isPublicAuthRequest = publicAuthEndpoints.some(endpoint => request.url.includes(endpoint));
  const accessToken = tokenStorage.getAccessToken();

  const authenticatedRequest =
    isApiRequest && accessToken && !isPublicAuthRequest
      ? request.clone({
          withCredentials: true,
          setHeaders: {
            Authorization: `Bearer ${accessToken}`
          }
        })
      : request.clone({
          withCredentials: isApiRequest || request.withCredentials
        });

  return next(authenticatedRequest).pipe(
    catchError(error => {
      const shouldRefresh =
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        isApiRequest &&
        !isPublicAuthRequest;

      if (!shouldRefresh) {
        return throwError(() => error);
      }

      return authSession.refreshSession().pipe(
        switchMap(() => {
          const refreshedToken = tokenStorage.getAccessToken();

          const retryRequest = refreshedToken
            ? request.clone({
                withCredentials: true,
                setHeaders: {
                  Authorization: `Bearer ${refreshedToken}`
                }
              })
            : request.clone({ withCredentials: true });

          return next(retryRequest);
        }),
        catchError(refreshError => {
          authSession.clearSession();
          return throwError(() => refreshError);
        })
      );
    })
  );
};
