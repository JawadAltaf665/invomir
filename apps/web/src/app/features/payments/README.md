# Payments Feature

Backend alignment:

- `GET /api/payments`
- `POST /api/stripe/connect`

Owns authenticated payment history, status filtering, backend pagination, invoice/client payment links, Stripe Connect start flow, and payment status models.

Permissions:

- `payment.view` for route access and payment history.
- `payment.manage` for the Stripe Connect CTA.
