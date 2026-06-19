# Admin Feature

Backend alignment:

- `GET /api/admin/users` loads paged system users with `q`, `role`, `plan`, `isActive`, `emailVerified`, `isTrialActive`, `hasStripeCustomer`, `page`, and `limit`.
- `GET /api/admin/users/{id}` loads the user, workspace, stats, invoices, Stripe references, and plan history.
- `PATCH /api/admin/users/{id}/plan` updates the user and tenant plan.
- `PATCH /api/admin/users/{id}/role` updates the user role, revokes active refresh sessions for that user, and changes role-derived permissions.
- `PATCH /api/admin/users/{id}/trial` updates the user and tenant trial end date.

Permissions:

- `system.access` gates the admin area.
- `system.user.view` gates list and detail reads.
- `system.user.manage` gates role, plan, and trial updates.

Owns system-admin user listing, details, role updates, plan updates, trial updates, admin-only models, and strict admin permission checks.
