# WeChat Pay and Alipay Direct Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fail-closed production backend for direct WeChat Pay Native and Alipay QR payments.

**Architecture:** Provider adapters normalize WeChat and Alipay into one payment service. The service owns server-side pricing and durable order state; PostgreSQL atomically grants paid access only after a verified provider result.

**Tech Stack:** Node.js 18+, built-in `crypto`, built-in `fetch`, `node:test`, PostgreSQL via `pg`, official `alipay-sdk`

---

### Task 1: Shared payment security primitives

**Files:**
- Create: `server/payments/shared.mjs`
- Create: `test/payments/shared.test.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write failing tests**

Test that `createPaymentAccessToken()` round-trips only the exact order/session pair, rejects a changed order ID, and rejects expired tokens. Test that `getProduct('premium')` returns a server-owned CNY price of 6800 minor units.

- [ ] **Step 2: Verify the tests fail**

Run: `node --test test/payments/shared.test.mjs`

Expected: failure because `server/payments/shared.mjs` does not exist.

- [ ] **Step 3: Implement the primitives**

Export `PaymentError`, `createMerchantOrderNo`, `normalizePem`, `getProduct`, `createPaymentAccessToken`, and `verifyPaymentAccessToken`. Require `PAYMENT_TOKEN_SECRET` in production and use HMAC-SHA256 with constant-time signature verification.

- [ ] **Step 4: Verify the tests pass**

Run: `node --test test/payments/shared.test.mjs`

Expected: all shared-payment tests pass.

### Task 2: Provider adapters

**Files:**
- Create: `server/payments/wechat.mjs`
- Create: `server/payments/alipay.mjs`
- Create: `test/payments/wechat.test.mjs`
- Create: `test/payments/alipay.test.mjs`
- Modify: `package.json`
- Modify: `package-lock.json`

- [ ] **Step 1: Write failing crypto tests**

Generate temporary RSA keys in tests. Verify WeChat authorization messages, response signatures, AES-256-GCM notification decryption, and Alipay RSA2 notification signatures. Verify any changed body or amount fails.

- [ ] **Step 2: Verify the tests fail**

Run: `node --test test/payments/wechat.test.mjs test/payments/alipay.test.mjs`

Expected: module-not-found failures for both adapters.

- [ ] **Step 3: Implement the WeChat adapter**

Export configuration inspection, Native order creation, merchant-order query, signature verification, and notification decoding. Use `/v3/pay/transactions/native`, `/v3/pay/transactions/out-trade-no/{outTradeNo}`, RSA-SHA256, WeChat response headers, and AES-256-GCM resource decryption.

- [ ] **Step 4: Implement the Alipay adapter with the official SDK**

Install `alipay-sdk`. Export configuration inspection, QR order creation through `alipay.trade.precreate`, order query through `alipay.trade.query`, and notification verification through the SDK's RSA2 verifier.

- [ ] **Step 5: Verify provider tests pass**

Run: `node --test test/payments/wechat.test.mjs test/payments/alipay.test.mjs`

Expected: all provider-adapter tests pass.

### Task 3: Durable order lifecycle

**Files:**
- Modify: `server/database.mjs`
- Create: `server/payments/service.mjs`
- Create: `test/payments/service.test.mjs`

- [ ] **Step 1: Write failing service tests**

Use injected in-memory repository/provider doubles to prove missing provider configuration fails closed, browser-supplied prices are ignored, invalid callbacks cannot complete orders, and duplicate valid callbacks complete an order once.

- [ ] **Step 2: Verify the tests fail**

Run: `node --test test/payments/service.test.mjs`

Expected: failure because the service does not exist.

- [ ] **Step 3: Add database operations**

Add `getUserRecordBySessionId`, `getPaymentOrderById`, and `completePaymentOrder`. The completion method uses a transaction and row lock, verifies amount/provider/session, updates the order only from a non-paid state, and updates the matching user entitlement exactly once.

- [ ] **Step 4: Implement the service**

Export configuration status, create-order, get/reconcile-order, WeChat notification, and Alipay notification functions. Inject repository and adapters in tests; use real database/provider implementations by default.

- [ ] **Step 5: Verify lifecycle tests pass**

Run: `node --test test/payments/service.test.mjs`

Expected: all payment-service tests pass.

### Task 4: HTTP routes and production configuration

**Files:**
- Modify: `server/server.mjs`
- Modify: `.env.example`
- Modify: `README.md`
- Create: `test/payments/http.test.mjs`

- [ ] **Step 1: Write failing route tests**

Test safe public configuration output, create/status validation, callback content types, and `410 Gone` from the old simulated payment job route.

- [ ] **Step 2: Verify route tests fail**

Run: `node --test test/payments/http.test.mjs`

Expected: the new routes do not exist and the simulated route remains enabled.

- [ ] **Step 3: Add the routes**

Add bounded raw-body and form-body parsing. Route create/status operations to the service; preserve the exact raw callback body needed for signature verification; return WeChat JSON acknowledgement and Alipay plain-text acknowledgement.

- [ ] **Step 4: Document production variables**

Document PostgreSQL, callback base URL, payment token secret, WeChat APPID/merchant ID/API v3 key/private key/certificate serial/WeChat Pay public key, and Alipay APPID/private key/Alipay public key.

- [ ] **Step 5: Run the complete phase verification once**

Run: `npm test`, `npx tsc --noEmit`, `npm run lint`, and `npm run build`.

Expected: payment tests, lint, and build pass. If TypeScript remains unconfigured, report that check separately without hiding it.

- [ ] **Step 6: Commit and push**

Stage only the payment implementation, tests, documentation, manifest, and lockfile. Commit with `feat: add direct WeChat and Alipay payment backend` and push `main`.
