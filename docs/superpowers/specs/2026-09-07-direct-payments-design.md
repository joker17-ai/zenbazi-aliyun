# WeChat Pay and Alipay Direct Integration Design

## Scope

Implement the production backend for direct WeChat Pay API v3 Native payments and Alipay `alipay.trade.precreate` payments. Frontend checkout wiring and production credentials are separate activation steps; this phase exposes stable backend endpoints ready for that work.

## Safety invariants

- A browser request can create a `pending` order but can never mark it paid.
- Paid access is granted only after a provider-signed callback is verified or a signed provider query reports success.
- Prices and coupon balances come from the server-side product catalog and user record, never from browser-supplied totals.
- Production payment creation requires PostgreSQL and a fully configured provider. Missing configuration fails closed.
- Provider private keys, API v3 keys, and payment access-token secrets are environment variables and never enter Git.
- Callback handling is idempotent. Duplicate notifications do not grant access twice or deduct coupons twice.
- Callback amounts, merchant identifiers, application identifiers, and merchant order numbers must match the stored order.

## Components

### Shared payment layer

`server/payments/shared.mjs` owns merchant-order generation, PEM normalization, signed client access tokens, supported products, provider configuration errors, and constant-time comparisons.

### WeChat Pay adapter

`server/payments/wechat.mjs` signs API v3 requests with RSA-SHA256, verifies WeChat response and callback signatures using the configured WeChat Pay public key, decrypts callback resources with AES-256-GCM, creates Native orders, and queries orders by merchant order number.

### Alipay adapter

`server/payments/alipay.mjs` uses the official `alipay-sdk` package to create QR-code orders and query them. It verifies asynchronous notifications with the configured Alipay public key before returning normalized payment results.

### Payment service and persistence

`server/payments/service.mjs` validates configuration, calculates the server-owned amount, creates a durable pending order, calls the selected provider, verifies callbacks, reconciles provider query results, and completes an order exactly once.

`server/database.mjs` gains targeted lookups and a transactional completion method. It updates both the payment order and the matching user entitlement in one database transaction.

## HTTP API

- `GET /api/payments/config` returns whether WeChat and Alipay are configured, without returning secrets.
- `POST /api/payments/orders` creates a provider order and returns `orderId`, a short-lived signed `accessToken`, `codeUrl`, amount, currency, and expiry.
- `GET /api/payments/orders/:orderId?token=...` returns the stored state and reconciles a pending order with its provider.
- `POST /api/payments/wechat/notify` verifies and decrypts a WeChat notification.
- `POST /api/payments/alipay/notify` verifies an Alipay form notification.
- The legacy `POST /api/jobs/payment` simulated-success route returns `410 Gone`.

## Failure behavior

Gateway errors return a stable public error code and are logged without secrets. Invalid callbacks do not mutate an order. Database or payment configuration absence returns `503`; malformed client input returns `400`; unknown orders return `404`.

## Verification

Node's built-in test runner covers authorization signing, notification verification/decryption, Alipay notification verification, access-token tampering, configuration fail-closed behavior, and callback normalization. HTTP smoke checks confirm configuration status and rejection of the old simulated route. The existing lint, TypeScript check, and production build run once at the end of the phase.
