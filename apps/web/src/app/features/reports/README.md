# Reports Feature

Backend alignment:

- `GET /api/reports/monthly`
- `GET /api/reports/export`

Owns monthly invoice aggregation, paid/outstanding/overdue metrics, invoice count summaries, report filters, CSV/PDF download handling, report charts, and permission-aware export actions.

Permissions:

- `report.view` for route access and monthly analytics.
- `report.export` for CSV/PDF downloads.
