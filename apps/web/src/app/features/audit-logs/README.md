# Audit Logs Feature

Backend alignment:

- `GET /api/audit-logs` loads tenant-scoped activity with `entityName`, `entityId`, `action`, `from`, `to`, `page`, and `limit`.
- `GET /api/audit-logs/{entityName}/{entityId}` supports reusable entity-history panels for invoice/client/admin detail pages later.

Permissions:

- `audit_log.view` gates route access and audit history reads.

Owns audit log listing, entity history models, filters, pagination, action badges, entity links, and permission-aware access.
