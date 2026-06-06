# Dashboard Feature

Backend alignment: `/api/dashboard`.

Owns revenue summary, invoice analytics, recent invoices, payment summary, overdue invoices, monthly charts, subscription status, and dashboard cache boundaries.
Dashboard action center items are backend-driven through `/api/dashboard/action-items`; frontend components only render returned actions.

## API Contract

- `GET /api/dashboard`
- `GET /api/dashboard/action-items`
- Requires authenticated session and `dashboard.view`
- Returns `ApiResponse<DashboardDto>`
- Action items return `ApiResponse<DashboardActionItemsDto>` with stable item ids, severity type, action label/url, dismissible flag, and priority.

## Frontend Flow

- `DashboardApiService` owns HTTP access to the backend endpoint.
- `DashboardStore` unwraps API responses, holds loading/error/data state, and maps DTOs into display-ready dashboard view models.
- `DashboardActionCenterComponent` renders backend-returned workshop actions without owning business rules.
- Dashboard cache is scoped by authenticated `tenantId:userId`; session changes clear stale dashboard data before any render.
- `dashboard.routes.ts` owns the lazy dashboard page route behind the authenticated `/app/dashboard` shell.
- `DashboardComponent` orchestrates loading and composes feature widgets.
- Dashboard widgets remain presentational and receive typed inputs.
