# Auth Feature

Backend alignment: `/api/auth`.

Owns login, register, refresh-token flow entry points, logout, password reset, email verification, auth models, and auth-specific form components.

## Implemented Auth Flow

- Public pages live under `/auth/login`, `/auth/register`, `/auth/forgot-password`, `/auth/reset-password`, and `/auth/verify-email`.
- Backend email links are also supported at `/reset-password?token=...` and `/verify-email?token=...`.
- `AuthApiService` owns direct `/api/auth/*` calls.
- `AuthSessionService` owns Signals-based session state, token persistence, refresh orchestration, logout, and permission checks.
- `authInterceptor` attaches JWT access tokens to protected API calls, sends credentials for cookie refresh support, and retries once after a `401`.
- `authGuard`, `guestGuard`, and `permissionGuard` prepare protected SaaS routing and permission-aware pages.

## Backend Contract Notes

- Login/register return `ApiResponse<AuthTokenDto>`.
- The backend sets an HttpOnly `refresh_token` cookie and also returns the refresh token in the response body.
- Frontend sends `withCredentials: true` and stores the returned refresh token as a fallback for local development and non-cookie refresh paths.
- Reset password revokes active refresh tokens, so frontend clears local session after successful reset.
