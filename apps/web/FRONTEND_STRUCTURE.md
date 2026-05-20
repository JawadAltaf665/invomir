# InvoMir Web Frontend Structure

This Angular app is prepared as a non-functional architecture skeleton. It follows the local frontend standards in `docs/prompts/invomir_frontend_engineer.md` and the UI direction in `docs/prompts/Invomir-UIUX.md`.

## Backend Research Summary

The backend is an ASP.NET Core clean architecture API with JSON camelCase responses, JWT auth, refresh tokens, permission policies, rate limits, Stripe, Redis, and PostgreSQL. The common response contracts are:

- `ApiResponse<T>` with `success`, `data`, `message`, and `errors`
- `PagedResult<T>` with `items`, `page`, `pageSize`, `totalCount`, and computed `totalPages`

Frontend domains are aligned to these API areas:

- Auth: `POST /api/auth/register`, `login`, `refresh`, `logout`, `forgot-password`, `reset-password`, `verify-email`
- Users/settings: `GET/PUT /api/users/me`, `GET /api/users/me/permissions`, `PUT /api/users/me/password`, `POST /api/users/me/logo`
- Dashboard: `GET /api/dashboard`
- Clients: list/create/detail/update/delete under `/api/clients`
- Invoices: list/create/detail/update/delete plus send, resend, mark-paid, reminders, cancel, duplicate, PDF, and tracking under `/api/invoices`
- Reports: monthly reports and export under `/api/reports`
- Payments: payment history under `/api/payments`, public payment pages under `/pay`
- Stripe: connect, connect callback, and webhook under `/api/stripe`
- Subscriptions: current subscription, status, plans, checkout, and cancel under `/api/subscriptions`
- Audit logs: list and entity history under `/api/audit-logs`
- Admin users: list/detail/update plan/update trial under `/api/admin/users`

## Folder Rules

- `core` owns singleton app infrastructure: API clients, auth, guards, interceptors, permissions, config, and cross-cutting services.
- `shared` owns reusable UI building blocks and presentation-only helpers.
- `layout` owns auth, dashboard, and public shells.
- `features` owns product domains. Each feature keeps its pages, components, services, models, store, guards, resolvers, and route placeholder together.
- `state` owns global session, tenant, and UI state boundaries.
- `environments` owns API/base URL configuration. Do not hardcode backend URLs inside components or feature services.

No product behavior is implemented yet. Route files intentionally export empty arrays until the first screen is built.
