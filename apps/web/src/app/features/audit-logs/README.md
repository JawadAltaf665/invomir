# Audit Logs Feature

Backend alignment:

- `GET /api/audit-logs` loads system-admin audit activity with `entityName`, `entityId`, `action`, `from`, `to`, `search`, `page`, and `limit`.
- `GET /api/audit-logs/{entityName}/{entityId}` supports reusable system-admin entity-history panels for admin detail pages later.

Permissions:

- `system.access` gates route access and audit history reads. Workspace owner/member roles must not see this module.

Owns audit log listing, entity history models, backend search filters, date-picker ranges, pagination, action badges, entity links, and system-admin-only access.
