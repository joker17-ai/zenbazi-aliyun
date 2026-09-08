# ZenBazi Admin Management System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a searchable, read-only admin system for users, direct-payment orders, and generated reports, with one-click report viewing and the existing ZenBazi visual style.

**Architecture:** Add parameterized admin read queries to the PostgreSQL repository, expose them through a small injected admin service and authenticated HTTP routes, then replace the current single dashboard with tabbed React panels. Existing metrics and decrypt routes remain compatible; all new detail reads are audited and payment state stays read-only.

**Tech Stack:** Node.js 20, PostgreSQL (`pg`), React 18, Tailwind CSS, Node test runner, Vite.

---

## File map

- `server/database.mjs`: schema migration, encrypted contact persistence, paginated admin read queries, row mappers.
- `server/admin/service.mjs`: list-query validation, masking, overview aggregation, and repository orchestration.
- `server/admin/http.mjs`: route matching and route parameter decoding.
- `server/server.mjs`: authenticated route wiring and report-view audit logging.
- `src/utils/adminClient.js`: browser client for new admin endpoints.
- `src/components/AdminDashboard.jsx`: login and tab shell.
- `src/components/admin/AdminOverview.jsx`: summary cards and recent activity.
- `src/components/admin/AdminUsers.jsx`: searchable user list and user detail.
- `src/components/admin/AdminPayments.jsx`: searchable payment order list and order detail.
- `src/components/admin/AdminReports.jsx`: report list and readable content drawer.
- `src/components/admin/AdminTableState.jsx`: shared loading, empty, and error states.
- `test/admin/http.test.mjs`: route matching tests.
- `test/admin/service.test.mjs`: validation, masking, pagination-envelope, and orchestration tests.
- `test/admin/database.test.mjs`: admin row mapping and encrypted contact field tests.

### Task 1: Stabilize the direct-payment foundation

**Files:**
- Modify: `server/payments/wechat.mjs`
- Modify: `server/payments/alipay.mjs`
- Modify: `server/database.mjs`
- Modify: `server/server.mjs`
- Modify: `.env.example`
- Test: `test/payments/*.test.mjs`

- [ ] **Step 1: Add focused regression tests for provider identity and entitlement safety**

Add assertions that WeChat rejects a mismatched `Wechatpay-Serial`, Alipay rejects a mismatched `seller_id`, and payment completion throws when no matching user row is updated.

```js
assert.throws(() => verifyWechatResponse(headers, body, config), /serial/i);
assert.throws(() => parseAlipayNotification({ ...signed, seller_id: 'wrong' }), /seller/i);
await assert.rejects(() => completePaymentOrder('ZB1', result), /user record/i);
```

- [ ] **Step 2: Run the payment tests and observe the new failures**

Run: `node --test test/payments/*.test.mjs`

Expected: the new identity and missing-user assertions fail before implementation.

- [ ] **Step 3: Enforce configured provider identities and remove simulated payment execution**

Require `WECHAT_PAY_PUBLIC_KEY_ID` and `ALIPAY_SELLER_ID`, compare them to signed provider messages, require one updated `user_records` row inside the payment transaction, and remove `processPaymentJob` plus the payment branch from the job dispatcher. Keep `POST /api/jobs/payment` returning HTTP 410.

- [ ] **Step 4: Run focused payment checks**

Run: `node --test test/payments/*.test.mjs`

Expected: all payment tests pass.

- [ ] **Step 5: Commit the completed payment foundation**

```bash
git add .env.example README.md package.json package-lock.json server test/payments
git commit -m "feat: add verified direct payment backend"
```

### Task 2: Add admin database records and contact persistence

**Files:**
- Modify: `server/database.mjs`
- Modify: `server/server.mjs`
- Test: `test/admin/database.test.mjs`

- [ ] **Step 1: Write failing row-mapping tests**

```js
test('admin user rows expose decrypted business fields without payment secrets', () => {
  const user = mapAdminUserRow(fakeEncryptedUserRow());
  assert.equal(user.name, '张三');
  assert.equal(user.phone, '13800138000');
  assert.equal(user.paymentStatus, 'paid');
  assert.equal(Object.hasOwn(user, 'requestPayload'), false);
});

test('admin payment rows include user and report linkage', () => {
  const order = mapAdminPaymentRow(fakeJoinedPaymentRow());
  assert.equal(order.userName, '张三');
  assert.equal(order.reportId, 'report-1');
  assert.equal(order.payableMinor, 6800);
});
```

- [ ] **Step 2: Run the database mapping test and verify failure**

Run: `node --test test/admin/database.test.mjs`

Expected: FAIL because the admin mappers do not exist.

- [ ] **Step 3: Add contact columns and admin indexes**

Add idempotent migrations inside `ensureDatabase()`:

```sql
ALTER TABLE user_records ADD COLUMN IF NOT EXISTS phone_cipher TEXT;
ALTER TABLE user_records ADD COLUMN IF NOT EXISTS phone_hash TEXT;
ALTER TABLE user_records ADD COLUMN IF NOT EXISTS email_cipher TEXT;
ALTER TABLE user_records ADD COLUMN IF NOT EXISTS email_hash TEXT;
CREATE INDEX IF NOT EXISTS idx_user_records_phone_hash ON user_records (phone_hash);
CREATE INDEX IF NOT EXISTS idx_user_records_email_hash ON user_records (email_hash);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status_created ON payment_orders (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_records_session_created ON report_records (session_id, created_at DESC);
```

Extend `upsertUserRecord()` to encrypt contact values and hash normalized exact-search values. Add `updateUserContact(sessionId, { phone, email })`, then call it from `/api/report/generate` when the request contains a session ID and contact data.

- [ ] **Step 4: Add parameterized admin repository methods**

Export these methods with `LIMIT $n OFFSET $n` and an independent count query:

```js
listAdminUsers({ monthKey, status, query, limit, offset })
getAdminUserById(id)
listAdminPayments({ monthKey, status, provider, query, limit, offset })
getAdminPaymentById(id)
listAdminReports({ monthKey, status, query, limit, offset })
getAdminReportById(id)
getAdminOverview(monthKey)
```

Join users, orders, and reports by `session_id`; do not select `request_cipher`, `response_cipher`, or callback payloads for browser responses.

- [ ] **Step 5: Run the focused database test**

Run: `node --test test/admin/database.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit database support**

```bash
git add server/database.mjs server/server.mjs test/admin/database.test.mjs
git commit -m "feat: add admin data repository"
```

### Task 3: Build the admin service and authenticated routes

**Files:**
- Create: `server/admin/service.mjs`
- Create: `server/admin/http.mjs`
- Modify: `server/server.mjs`
- Test: `test/admin/service.test.mjs`
- Test: `test/admin/http.test.mjs`

- [ ] **Step 1: Write failing query-validation and service tests**

```js
test('normalizes bounded admin pagination', () => {
  assert.deepEqual(normalizeAdminQuery(new URLSearchParams('page=2&pageSize=500')), {
    page: 2,
    pageSize: 100,
    limit: 100,
    offset: 100,
    monthKey: '',
    status: '',
    provider: '',
    query: ''
  });
});

test('user list masks contact and session identifiers', async () => {
  const service = createAdminService(fakeRepository());
  const result = await service.listUsers({ page: 1, pageSize: 20 });
  assert.equal(result.items[0].phone, '138****8000');
  assert.match(result.items[0].sessionId, /^sess…/);
});
```

- [ ] **Step 2: Run the service and HTTP tests and verify failure**

Run: `node --test test/admin/service.test.mjs test/admin/http.test.mjs`

Expected: FAIL because the modules do not exist.

- [ ] **Step 3: Implement the injected admin service**

`createAdminService(repository)` must expose:

```js
getOverview(query)
listUsers(query)
getUser(id)
listPayments(query)
getPayment(id)
listReports(query)
getReport(id)
```

Use `normalizeAdminQuery()` for every list, return `{ items, page, pageSize, total }`, mask phone/email/session identifiers in lists, and return full permitted fields in authenticated detail methods. Throw errors with `status = 404` for missing records and `status = 503`, `code = 'DATABASE_REQUIRED'` when PostgreSQL is disabled.

- [ ] **Step 4: Implement exact route matching**

`matchAdminRoute(method, pathname)` must recognize only the seven paths in the approved design and URL-decode detail IDs. It must return `null` for `/api/admin/login`, `/api/admin/metrics`, and `/api/admin/decrypt` so compatibility handlers remain in control.

- [ ] **Step 5: Wire authenticated routes**

In `server/server.mjs`, call `requireAdmin(req)` before invoking the new service. For report detail, append a `decrypt_audit_logs` row using the authenticated admin subject. Return JSON error codes through the existing top-level error handler.

- [ ] **Step 6: Run focused server tests**

Run: `node --test test/admin/*.test.mjs`

Expected: PASS.

- [ ] **Step 7: Commit the admin API**

```bash
git add server/admin server/server.mjs test/admin
git commit -m "feat: add authenticated admin APIs"
```

### Task 4: Add the admin browser client

**Files:**
- Modify: `src/utils/adminClient.js`
- Test: `test/admin/client-contract.test.mjs`

- [ ] **Step 1: Write a failing endpoint-contract test**

Read the source and assert it exports all seven client operations and does not build URLs by concatenating unescaped user input.

```js
for (const name of ['getAdminOverview', 'listAdminUsers', 'getAdminUser', 'listAdminPayments', 'getAdminPayment', 'listAdminReports', 'getAdminReport']) {
  assert.match(source, new RegExp(`export async function ${name}\\b`));
}
assert.match(source, /URLSearchParams/);
assert.match(source, /encodeURIComponent/);
```

- [ ] **Step 2: Run the contract test and verify failure**

Run: `node --test test/admin/client-contract.test.mjs`

Expected: FAIL because the exports are missing.

- [ ] **Step 3: Implement client operations**

Add a shared `buildAdminQuery(params)` using `URLSearchParams`. Lists accept a filter object; detail methods encode the ID. Preserve `adminFetch()` token handling and convert HTTP 401 into an error carrying `status = 401` so the UI can return to login.

- [ ] **Step 4: Run the focused contract test**

Run: `node --test test/admin/client-contract.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit the browser client**

```bash
git add src/utils/adminClient.js test/admin/client-contract.test.mjs
git commit -m "feat: add admin API client"
```

### Task 5: Replace manual decryption with the tabbed management UI

**Files:**
- Modify: `src/components/AdminDashboard.jsx`
- Create: `src/components/admin/AdminOverview.jsx`
- Create: `src/components/admin/AdminUsers.jsx`
- Create: `src/components/admin/AdminPayments.jsx`
- Create: `src/components/admin/AdminReports.jsx`
- Create: `src/components/admin/AdminTableState.jsx`
- Modify: `src/utils/translations.js`

- [ ] **Step 1: Extract the existing visual primitives**

Keep the established classes: rounded `2xl/3xl` cards, `#F5F0E6` surfaces, `#B22222` primary actions, `#2C2C2C` text, serif headings, and existing shadows. Add shared `StatusBadge`, `TableState`, `Pagination`, and `DetailDrawer` components to `AdminTableState.jsx`.

- [ ] **Step 2: Build the navigation shell**

Replace the month/sequence form with four tabs: `overview`, `users`, `payments`, `reports`. Keep login, logout, exit, admin-token expiry handling, and the current local-development banner.

- [ ] **Step 3: Build the overview and list panels**

Each panel owns its request state and provides:

```js
const [filters, setFilters] = useState({ month: currentMonth, query: '', status: '', page: 1, pageSize: 20 });
const [state, setState] = useState({ loading: true, error: '', data: null });
```

Use a debounced text search, explicit status/provider selects, refresh button, accessible table headers, empty state, error retry, and server pagination. Currency renders from minor units with `Intl.NumberFormat('zh-CN', { style: 'currency', currency })`.

- [ ] **Step 4: Add one-click details and readable report content**

Clicking “查看生成内容” calls `getAdminReport(reportId)` and opens a drawer with title, user, order state, generation time, report paragraphs, and zen message. Show raw JSON only inside a collapsed troubleshooting disclosure. Users or orders without a report show “尚未生成” instead of a disabled mystery field.

- [ ] **Step 5: Add Simplified Chinese copy and retain other-language fallback**

Add labels for navigation, filters, payment statuses, provider names, report states, pagination, empty/error states, and detail fields under `translations['zh-CN'].admin`. When a translation is absent in other locales, use the Simplified Chinese admin copy instead of rendering `undefined`.

- [ ] **Step 6: Run targeted lint**

Run: `npx eslint src/components/AdminDashboard.jsx src/components/admin src/utils/adminClient.js src/utils/translations.js`

Expected: zero errors.

- [ ] **Step 7: Commit the UI**

```bash
git add src/components/AdminDashboard.jsx src/components/admin src/utils/translations.js
git commit -m "feat: add user payment and report admin UI"
```

### Task 6: Phase verification and local QA

**Files:**
- Modify only files required by defects found during verification.

- [ ] **Step 1: Run the single full verification pass for this phase**

Run once, in order:

```bash
npm test
npx tsc --noEmit
npm run build
```

Expected: tests and build pass. If TypeScript is not installed, record `npx tsc --noEmit` as not applicable without installing an unrelated compiler. Do not repeat the full pass; use only focused checks for any fix.

- [ ] **Step 2: Run local browser QA**

Start the backend with a disposable PostgreSQL database and start Vite. Verify login, all four tabs, search, filters, pagination, user detail, paid order detail, generated report drawer, empty state, 404 state, and expired-token return to login.

- [ ] **Step 3: Commit verification fixes**

```bash
git add server/admin server/database.mjs server/server.mjs src/components/AdminDashboard.jsx src/components/admin src/utils/adminClient.js src/utils/translations.js test/admin
git commit -m "fix: harden admin management workflows"
```

Skip this commit if verification required no changes.

### Task 7: Deploy and verify the live system

**Files:**
- Server: `/opt/zenbazi`
- Service: `/etc/systemd/system/zenbazi.service`
- Nginx static root: `/opt/zenbazi/dist`

- [ ] **Step 1: Push reviewed commits to GitHub**

Run: `git push origin main`

Expected: `main` advances to the final local commit.

- [ ] **Step 2: Create a recoverable server backup**

Create a timestamped archive of `/opt/zenbazi/server`, `/opt/zenbazi/dist`, `package.json`, `package-lock.json`, and the service environment before upload. Do not overwrite the TLS certificates or Nginx virtual-host configuration.

- [ ] **Step 3: Enable PostgreSQL and initialize schema**

Install/enable PostgreSQL only if absent, create a dedicated `zenbazi` database role and database with a generated password, store `DATABASE_URL` and application secrets in a root-readable environment file, attach it to `zenbazi.service`, and run application startup once to execute idempotent migrations.

- [ ] **Step 4: Upload backend and static build**

Upload source/runtime files, run `npm ci --omit=dev`, place the verified `dist` under `/opt/zenbazi/dist`, set directories to be readable by Nginx, run `systemctl daemon-reload`, and restart `zenbazi.service`.

- [ ] **Step 5: Run live canary checks**

Verify:

```text
https://yuandestiny.cn/
https://yuandestiny.cn/#/admin
https://yuandestiny.cn/api/system/meta
```

Confirm HTTPS, frontend assets, admin login, database driver `postgresql`, all four admin tabs, and that unauthenticated admin API calls return 401. Payment creation may remain disabled until the real WeChat and Alipay merchant credentials are supplied; the admin UI must clearly show provider configuration state rather than simulating payment.

- [ ] **Step 6: Report completion**

Provide the live frontend URL, live admin URL, final commit ID, verification results, deployment backup path, and the exact remaining merchant-account fields the user must supply. Never print private keys or passwords in the completion message.
