# Team

Purpose: manage workspace team members and pending invitations from the real `/api/team` backend contract.

API dependencies:
- `GET /api/team/members`
- `GET /api/team/invitations`
- `POST /api/team/invitations`
- `DELETE /api/team/invitations/{id}`
- `DELETE /api/team/members/{id}`
- `PATCH /api/team/members/{id}/role`
- `POST /api/team/invitations/{token}/accept`

Permission:
- Protected workspace screen uses `team.manage`.
- Owner-only actions are still enforced by the backend; frontend hides invite/remove/role-change actions unless the current role is `owner`.
