# Admin Feature

Backend alignment:

- `GET /api/admin/users` loads paged system users with `q`, `page`, and `limit`.
- `GET /api/admin/users/{id}` loads the user, workspace, stats, invoices, Stripe references, and plan history.
- `PATCH /api/admin/users/{id}/plan` updates the user and tenant plan.
- `PATCH /api/admin/users/{id}/trial` updates the user and tenant trial end date.

Permissions:

- `system.access` gates the admin area.
- `system.user.view` gates list and detail reads.
- `system.user.manage` gates plan and trial updates.

Owns system-admin user listing, details, plan updates, trial updates, admin-only models, and strict admin permission checks.
