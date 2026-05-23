# Settings Feature

Backend alignment:

- `GET /api/users/me` loads the authenticated user and business profile DTO.
- `PUT /api/users/me` updates `businessName`, `currency`, and `taxPercent`.
- `PUT /api/users/me/password` changes the password and revokes refresh sessions.
- `POST /api/users/me/logo` uploads a `logo` multipart file and returns `logoUrl`.

Permissions:

- Backend treats current-user settings APIs as authenticated account endpoints.
- Frontend route/sidebar and management controls use `settings.manage` for permission-aware product UI.

Owns profile settings, password changes, business identity settings, logo upload, invoice defaults, and settings permission-aware UI.
