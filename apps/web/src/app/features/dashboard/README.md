# Dashboard Feature

Backend alignment: `/api/dashboard`.

Owns revenue summary, invoice analytics, recent invoices, payment summary, overdue invoices, monthly charts, subscription status, and dashboard cache boundaries.

## API Contract

- `GET /api/dashboard`
- Requires authenticated session and `dashboard.view`
- Returns `ApiResponse<DashboardDto>`

## Frontend Flow

- `DashboardApiService` owns HTTP access to the backend endpoint.
- `DashboardStore` unwraps API responses, holds loading/error/data state, and maps DTOs into display-ready dashboard view models.
- `dashboard.routes.ts` owns the lazy dashboard page route behind the authenticated `/app/dashboard` shell.
- `DashboardComponent` orchestrates loading and composes feature widgets.
- Dashboard widgets remain presentational and receive typed inputs.
