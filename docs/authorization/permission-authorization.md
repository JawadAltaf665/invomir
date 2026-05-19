# InvoMir Permission-Based Authorization

## Authorization Architecture

InvoMir now uses permission-based authorization on top of JWT authentication.

Flow:

1. User logs in or refreshes a token.
2. The backend loads the user's current tenant role.
3. `IRolePermissionProvider` resolves the role into permission names.
4. `TokenService` writes one JWT claim per permission using claim type `permission`.
5. Controllers declare required permissions with `[RequirePermission(...)]`.
6. `PermissionAuthorizationPolicyProvider` builds the policy dynamically at runtime.
7. `PermissionAuthorizationHandler` checks the current user's JWT permission claims.
8. ASP.NET Core returns `401` for missing/invalid authentication and `403` for authenticated users without the required permission.

Public endpoints are intentionally unchanged. Public auth routes, public payment pages, Stripe webhook/callback routes, invoice tracking pixels, subscription plan listing, and health checks do not require permission claims.

## Permission Naming Strategy

Permission names use this format:

```text
module.action
```

Rules:

- Lowercase only.
- Dot separates module and action.
- Multi-word actions use underscores, for example `invoice.mark_paid`.
- Tenant/product permissions are separated from platform/system permissions.
- Constants live in `InvoMir.Shared.Constants.Permissions`.

Examples:

```text
invoice.view
invoice.create
client.delete
payment.manage
report.export
subscription.manage
system.user.manage
```

## Permission Catalog

Current modules:

| Module | Permissions |
| --- | --- |
| Dashboard | `dashboard.view` |
| Invoice | `invoice.view`, `invoice.create`, `invoice.update`, `invoice.delete`, `invoice.send`, `invoice.mark_paid`, `invoice.cancel`, `invoice.duplicate`, `invoice.manage_reminders` |
| Client | `client.view`, `client.create`, `client.update`, `client.delete` |
| Payment | `payment.view`, `payment.manage` |
| Report | `report.view`, `report.export` |
| Audit Log | `audit_log.view` |
| Subscription | `subscription.view`, `subscription.manage` |
| Team | `team.manage` |
| Settings | `settings.manage` |
| System | `system.access`, `system.user.view`, `system.user.manage` |

## Role-Permission Mapping

Role maps are centralized in `DefaultRolePermissionProvider`.

| Role | Scope | Strategy |
| --- | --- | --- |
| `system_admin` | Platform/system | All permissions, including `system.*` |
| `owner` | Tenant | All organization-scoped permissions, but not platform `system.*` |
| `admin` | Tenant | Broad operational permissions, excluding platform and owner-only billing control |
| `accountant` | Tenant | Invoice, payment, report, and read access needed for accounting workflows |
| `member` | Tenant | Day-to-day create/update/view access without destructive or billing powers |
| `viewer` | Tenant | Read-only product access |

Important: `owner` means owner of a tenant account, not platform owner. Cross-tenant admin APIs require `system.*` permissions and should be assigned only to trusted internal platform operators through the `system_admin` role.

## JWT Claim Strategy

Access tokens include:

| Claim | Purpose |
| --- | --- |
| `sub` | Standard subject/user id |
| `user_id` | InvoMir user id |
| `email` | User email |
| `tenant_id` | Current tenant boundary for global query filters |
| `organization_id` | Alias for future organization/team context |
| `first_name` | Lightweight profile display |
| `plan` | Current plan |
| `role` | Tenant role identifier |
| `http://schemas.microsoft.com/ws/2008/06/identity/claims/role` | ASP.NET role compatibility |
| `permission` | Repeated once per granted permission |

Example permission claims:

```text
permission = invoice.view
permission = invoice.create
permission = client.view
permission = report.export
```

JWT permission claims are the per-request authorization cache. Role changes require issuing a fresh access token, which is acceptable because access tokens are short-lived.

## Database Structure Review

Current auth schema has:

| Current table/field | Meaning |
| --- | --- |
| `users.role` | Single role for the current tenant |
| `users.tenant_id` | User belongs to one tenant |
| `tenants` | Tenant root |

No migration was added in this change intentionally.

Reason: the current product data model is still one user to one tenant. Adding `roles`, `permissions`, `role_permissions`, `user_roles`, and `organization_memberships` now would create unused schema surface before team/multi-organization membership exists.

The code is prepared for that future by depending on `IRolePermissionProvider`. When custom roles are needed, replace `DefaultRolePermissionProvider` with a database-backed provider and add:

| Future table | Purpose |
| --- | --- |
| `roles` | Tenant/system role records |
| `permissions` | Optional persisted permission catalog |
| `role_permissions` | Role to permission assignments |
| `user_roles` | User role membership per tenant/organization |
| `organization_memberships` | Allows one user to be admin in one organization and viewer in another |

## Permission Seeding

Current default permissions and role mappings are seeded in code through:

- `Permissions.All`
- `Permissions.OrganizationScoped`
- `DefaultRolePermissionProvider`

This is the source of truth until custom roles are introduced. A future database-backed role provider should seed from the same permission constants so code and database stay aligned.

## Dynamic Policy Implementation

Implemented pieces:

| Piece | Location | Responsibility |
| --- | --- | --- |
| Permission constants | `InvoMir.Shared/Constants/Permissions.cs` | Central permission catalog |
| Role mapping | `InvoMir.Application/Security/DefaultRolePermissionProvider.cs` | Role to permissions |
| Permission checker | `InvoMir.Application/Security/ClaimsPermissionChecker.cs` | Reads permission claims |
| Attribute | `InvoMir.API/Authorization/RequirePermissionAttribute.cs` | Controller syntax |
| Requirement | `InvoMir.API/Authorization/PermissionRequirement.cs` | Authorization requirement |
| Dynamic provider | `InvoMir.API/Authorization/PermissionAuthorizationPolicyProvider.cs` | Runtime policy resolution |
| Handler | `InvoMir.API/Authorization/PermissionAuthorizationHandler.cs` | Grants/denies access |

Policy format:

```text
Permission:invoice.create
Permission:client.delete
Permission:system.user.manage
```

New permissions do not need manual `AddPolicy(...)` registration. Add the constant, add it to the catalog/role map, then use `[RequirePermission(Permissions.X.Y)]`.

## Endpoint Authorization Matrix

| Module | Endpoint | Method | Previous Auth | Permission Required | Final Type |
| --- | --- | --- | --- | --- | --- |
| Health | `/health` | GET | Public | None | Public |
| Health | `/health/ready` | GET | Public | None | Public |
| Auth | `/api/auth/register` | POST | Public | None | Public |
| Auth | `/api/auth/login` | POST | Public | None | Public |
| Auth | `/api/auth/refresh` | POST | Public | None | Public |
| Auth | `/api/auth/logout` | POST | Authenticated | None | Authenticated only |
| Auth | `/api/auth/forgot-password` | POST | Public | None | Public |
| Auth | `/api/auth/reset-password` | POST | Public | None | Public |
| Auth | `/api/auth/verify-email` | POST | Public | None | Public |
| Users | `/api/users/me` | GET | Authenticated | None | Authenticated only |
| Users | `/api/users/me/permissions` | GET | New | None | Authenticated only |
| Users | `/api/users/me` | PUT | Authenticated | None | Authenticated only |
| Users | `/api/users/me/password` | PUT | Authenticated | None | Authenticated only |
| Users | `/api/users/me/logo` | POST | Authenticated | None | Authenticated only |
| Dashboard | `/api/dashboard` | GET | Authenticated | `dashboard.view` | Permission |
| Clients | `/api/clients` | GET | Authenticated | `client.view` | Permission |
| Clients | `/api/clients` | POST | Authenticated | `client.create` | Permission |
| Clients | `/api/clients/{id}` | GET | Authenticated | `client.view` | Permission |
| Clients | `/api/clients/{id}` | PUT | Authenticated | `client.update` | Permission |
| Clients | `/api/clients/{id}` | DELETE | Authenticated | `client.delete` | Permission |
| Invoices | `/api/invoices` | GET | Authenticated | `invoice.view` | Permission |
| Invoices | `/api/invoices` | POST | Authenticated | `invoice.create` | Permission |
| Invoices | `/api/invoices/{id}` | GET | Authenticated | `invoice.view` | Permission |
| Invoices | `/api/invoices/{id}/pdf` | GET | Authenticated | `invoice.view` | Permission |
| Invoices | `/api/invoices/{id}/send` | POST | Authenticated | `invoice.send` | Permission |
| Invoices | `/api/invoices/{id}/resend` | POST | Authenticated | `invoice.send` | Permission |
| Invoices | `/api/invoices/{id}/mark-paid` | POST | Authenticated | `invoice.mark_paid` | Permission |
| Invoices | `/api/invoices/{id}/reminders` | PATCH | Authenticated | `invoice.manage_reminders` | Permission |
| Invoices | `/api/invoices/track/{token}` | GET | Public | None | Public |
| Invoices | `/api/invoices/{id}` | PUT | Authenticated | `invoice.update` | Permission |
| Invoices | `/api/invoices/{id}` | DELETE | Authenticated | `invoice.delete` | Permission |
| Invoices | `/api/invoices/{id}/cancel` | POST | Authenticated | `invoice.cancel` | Permission |
| Invoices | `/api/invoices/{id}/duplicate` | POST | Authenticated | `invoice.duplicate` | Permission |
| Payments | `/api/payments` | GET | Authenticated | `payment.view` | Permission |
| Payment Page | `/pay/{token}` | GET | Public | None | Public |
| Reports | `/api/reports/monthly` | GET | Authenticated | `report.view` | Permission |
| Reports | `/api/reports/export` | GET | Authenticated | `report.export` | Permission |
| Stripe | `/api/stripe/connect` | POST | Authenticated | `payment.manage` | Permission |
| Stripe | `/api/stripe/connect/callback` | GET | Public | None | Public |
| Stripe | `/api/stripe/webhook` | POST | Public | None | Public webhook |
| Subscriptions | `/api/subscriptions` | GET | Authenticated | `subscription.view` | Permission |
| Subscriptions | `/api/subscriptions/status` | GET | Authenticated | `subscription.view` | Permission |
| Subscriptions | `/api/subscriptions/plans` | GET | Public | None | Public |
| Subscriptions | `/api/subscriptions/checkout` | POST | Authenticated | `subscription.manage` | Permission |
| Subscriptions | `/api/subscriptions/cancel` | POST | Authenticated | `subscription.manage` | Permission |
| Audit Logs | `/api/audit-logs` | GET | Authenticated | `audit_log.view` | Permission |
| Audit Logs | `/api/audit-logs/{entityName}/{entityId}` | GET | Authenticated | `audit_log.view` | Permission |
| Admin Users | `/api/admin/users` | GET | Admin policy | `system.user.view` | Admin/system permission |
| Admin Users | `/api/admin/users/{id}` | GET | Admin policy | `system.user.view` | Admin/system permission |
| Admin Users | `/api/admin/users/{id}/plan` | PATCH | Admin policy | `system.user.manage` | Admin/system permission |
| Admin Users | `/api/admin/users/{id}/trial` | PATCH | Admin policy | `system.user.manage` | Admin/system permission |

## Controller Migration Plan

Completed migration:

- Product module controllers now use `[RequirePermission(...)]`.
- Public endpoints keep `[AllowAnonymous]`.
- Auth-only personal account endpoints remain `[Authorize]`.
- Cross-tenant admin endpoints now require `system.*` permission claims instead of the previous weak `isAdmin = true` shortcut.
- Added `GET /api/users/me/permissions` for frontend menu/sidebar authorization.

Future controller guidance:

1. Public endpoint: use `[AllowAnonymous]`.
2. Personal account endpoint: use `[Authorize]`.
3. Tenant product endpoint: use `[RequirePermission(Permissions.Module.Action)]`.
4. Cross-tenant/platform endpoint: use a `Permissions.System.*` permission.

## SaaS Scalability Considerations

Current design is tenant-aware because JWTs include `tenant_id` and permission claims are issued for the current tenant context.

Future multi-organization support should change permission resolution from:

```text
User.Role -> Permissions
```

to:

```text
User + OrganizationMembership + Role -> Permissions
```

No controller changes should be required if the replacement provider still emits the same permission claims.

## Security Considerations

- Public endpoints were not permission-gated.
- System admin endpoints no longer depend on the ambiguous `isAdmin` claim.
- Unknown permissions fail fast through `RequirePermissionAttribute`.
- Object-level tenant safety still depends on global query filters and handler-level ownership checks.
- JWT permission claims are short-lived authorization snapshots; revoke by changing role and requiring token refresh or session revocation.
- Do not grant `system_admin` to tenant customers.
- Avoid adding broad wildcard permission checks. Prefer explicit permission claims for auditability.

## PR Test Plan

- Run `dotnet build .\backend\Invomir.slnx`.
- Login/register and confirm access token contains repeated `permission` claims.
- Call a permission-gated endpoint with no token and expect `401`.
- Call a permission-gated endpoint with a token missing the permission and expect `403`.
- Call public endpoints without a token and confirm they still work:
  - `POST /api/auth/login`
  - `POST /api/auth/refresh`
  - `GET /api/subscriptions/plans`
  - `POST /api/stripe/webhook`
  - `GET /pay/{token}`
  - `GET /api/invoices/track/{token}`
- Call `GET /api/users/me/permissions` with a valid token and confirm the role and permission list match the role map.
