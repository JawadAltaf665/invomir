# Subscriptions Feature

Backend alignment:

- `GET /api/subscriptions` loads the current plan, billing status, trial dates/countdown, usage metrics, and feature flags.
- `GET /api/subscriptions/status` returns the same current subscription DTO.
- `GET /api/subscriptions/plans` loads the public plan catalog and checkout availability flags.
- `POST /api/subscriptions/checkout` starts Stripe subscription checkout with `plan` and `interval`.
- `POST /api/subscriptions/cancel` schedules active Stripe subscription cancellation at period end.

Permissions:

- `subscription.view` gates the route/current subscription APIs.
- `subscription.manage` gates checkout and cancellation actions.

Owns subscription overview, usage metrics, pricing cards, checkout redirect handling, cancellation, and billing status UI.
