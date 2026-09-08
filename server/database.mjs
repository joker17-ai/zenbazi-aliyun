import crypto from 'node:crypto';
import { Pool } from 'pg';
import { decryptString, encryptString, getCurrentMonthKey, hashLookupValue } from './security.mjs';

const DEFAULT_ACCURACY = {
  body: 0,
  industry: 0,
  role: 0,
  wealth: 0,
  status: 0,
  time: 0,
  overall: 0
};

let pool = null;
let initialized = false;

function hasDatabaseConfig() {
  return Boolean(process.env.DATABASE_URL || process.env.PGHOST || process.env.POSTGRES_URL);
}

function getSslConfig() {
  if (process.env.PGSSLMODE === 'disable') {
    return undefined;
  }
  if (process.env.PGSSL === 'true' || process.env.DATABASE_SSL === 'true') {
    return { rejectUnauthorized: false };
  }
  return undefined;
}

function getPool() {
  if (!hasDatabaseConfig()) return null;
  if (!pool) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL || undefined;
    pool = new Pool(connectionString ? {
      connectionString,
      ssl: getSslConfig()
    } : {
      host: process.env.PGHOST,
      port: Number(process.env.PGPORT || 5432),
      database: process.env.PGDATABASE,
      user: process.env.PGUSER,
      password: process.env.PGPASSWORD,
      ssl: getSslConfig(),
      max: Number(process.env.PGPOOL_MAX || 10)
    });
  }
  return pool;
}

function normalizeAssessment(payload = {}) {
  const next = { ...DEFAULT_ACCURACY };
  for (const key of Object.keys(DEFAULT_ACCURACY)) {
    if (payload[key] == null || payload[key] === '') continue;
    const numeric = Number(payload[key]);
    next[key] = Number.isFinite(numeric) ? numeric : 0;
  }
  return next;
}

function parseEncryptedJson(value, fallback = {}) {
  try {
    return JSON.parse(decryptString(value));
  } catch {
    return fallback;
  }
}

async function runStatements(client, statements) {
  for (const statement of statements) {
    await client.query(statement);
  }
}

export function isDatabaseEnabled() {
  return hasDatabaseConfig();
}

export async function ensureDatabase() {
  const activePool = getPool();
  if (!activePool || initialized) return;

  const client = await activePool.connect();
  try {
    await runStatements(client, [
      `
      CREATE TABLE IF NOT EXISTS sequence_counters (
        month_key TEXT PRIMARY KEY,
        last_sequence INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
      `,
      `
      CREATE TABLE IF NOT EXISTS user_records (
        id TEXT PRIMARY KEY,
        month_key TEXT NOT NULL,
        sequence INTEGER NOT NULL,
        session_id TEXT NOT NULL UNIQUE,
        ip_cipher TEXT NOT NULL,
        ip_hash TEXT NOT NULL,
        plan TEXT NOT NULL,
        birth_bazi_cipher TEXT NOT NULL,
        name_cipher TEXT NOT NULL,
        name_hash TEXT NOT NULL,
        birth_place_cipher TEXT NOT NULL,
        gender_cipher TEXT NOT NULL,
        report_duration_ms INTEGER NOT NULL DEFAULT 0,
        accuracy_cipher TEXT NOT NULL,
        bias_cipher TEXT NOT NULL,
        media_source TEXT NOT NULL DEFAULT 'organic',
        coupon_balance INTEGER NOT NULL DEFAULT 0,
        payment_status TEXT NOT NULL DEFAULT 'unpaid',
        latest_payment_provider TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (month_key, sequence)
      )
      `,
      `
      CREATE INDEX IF NOT EXISTS idx_user_records_month_sequence
      ON user_records (month_key, sequence DESC)
      `,
      `
      CREATE INDEX IF NOT EXISTS idx_user_records_ip_hash
      ON user_records (ip_hash)
      `,
      `
      CREATE TABLE IF NOT EXISTS report_records (
        id TEXT PRIMARY KEY,
        month_key TEXT NOT NULL,
        sequence INTEGER NOT NULL,
        session_id TEXT NOT NULL,
        report_title TEXT NOT NULL,
        zen_title TEXT NOT NULL,
        report_cipher TEXT NOT NULL,
        zen_cipher TEXT NOT NULL,
        notebook_key TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (month_key, sequence)
      )
      `,
      `
      CREATE TABLE IF NOT EXISTS payment_orders (
        id TEXT PRIMARY KEY,
        month_key TEXT NOT NULL,
        sequence INTEGER,
        session_id TEXT,
        provider TEXT NOT NULL,
        channel TEXT NOT NULL,
        status TEXT NOT NULL,
        currency TEXT NOT NULL,
        amount_minor INTEGER NOT NULL,
        coupon_used_minor INTEGER NOT NULL DEFAULT 0,
        payable_minor INTEGER NOT NULL,
        plan_after_success TEXT NOT NULL DEFAULT 'paid',
        gateway_order_no TEXT,
        request_cipher TEXT NOT NULL,
        response_cipher TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
      `,
      `
      CREATE INDEX IF NOT EXISTS idx_payment_orders_session_id
      ON payment_orders (session_id, created_at DESC)
      `,
      `
      CREATE TABLE IF NOT EXISTS payment_callbacks (
        id TEXT PRIMARY KEY,
        payment_order_id TEXT NOT NULL REFERENCES payment_orders(id) ON DELETE CASCADE,
        provider TEXT NOT NULL,
        callback_status TEXT NOT NULL,
        payload_cipher TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
      `,
      `
      CREATE TABLE IF NOT EXISTS decrypt_audit_logs (
        id TEXT PRIMARY KEY,
        target_type TEXT NOT NULL,
        target_key TEXT NOT NULL,
        month_key TEXT NOT NULL,
        operator_name TEXT NOT NULL,
        dynamic_instruction TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
      `,
      `
      CREATE TABLE IF NOT EXISTS ip_access_events (
        id TEXT PRIMARY KEY,
        ip_hash TEXT NOT NULL,
        plan TEXT NOT NULL,
        visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
      `,
      `
      CREATE INDEX IF NOT EXISTS idx_ip_access_events_hash_time
      ON ip_access_events (ip_hash, visited_at DESC)
      `
    ]);
    initialized = true;
  } finally {
    client.release();
  }
}

export async function nextSequence(monthKey = getCurrentMonthKey()) {
  const activePool = getPool();
  if (!activePool) return null;

  const result = await activePool.query(`
    INSERT INTO sequence_counters (month_key, last_sequence, updated_at)
    VALUES ($1, 1, NOW())
    ON CONFLICT (month_key)
    DO UPDATE SET
      last_sequence = sequence_counters.last_sequence + 1,
      updated_at = NOW()
    RETURNING last_sequence
  `, [monthKey]);
  return Number(result.rows[0]?.last_sequence || 1);
}

export async function trackIpAccess(ip, plan = 'free') {
  const activePool = getPool();
  if (!activePool) return null;
  const ipHash = hashLookupValue(ip, 'ip');

  const countResult = await activePool.query(`
    SELECT
      COUNT(*) FILTER (WHERE visited_at >= NOW() - INTERVAL '5 minutes')::INT AS hits_5m,
      COUNT(*) FILTER (WHERE visited_at >= NOW() - INTERVAL '24 hours')::INT AS hits_24h
    FROM ip_access_events
    WHERE ip_hash = $1
      AND visited_at >= NOW() - INTERVAL '24 hours'
  `, [ipHash]);

  const row = countResult.rows[0] || {};
  const hits5m = Number(row.hits_5m || 0);
  const hits24h = Number(row.hits_24h || 0);

  await activePool.query(`
    INSERT INTO ip_access_events (id, ip_hash, plan, visited_at)
    VALUES ($1, $2, $3, NOW())
  `, [crypto.randomUUID(), ipHash, plan]);

  return {
    ipHash,
    hits5m: hits5m + 1,
    hits24h: hits24h + 1
  };
}

export async function upsertUserRecord(record) {
  const activePool = getPool();
  if (!activePool) return null;

  const monthKey = record.monthKey || getCurrentMonthKey();
  const accuracy = normalizeAssessment(record.accuracy);
  const bias = normalizeAssessment(record.bias);
  const ipHash = hashLookupValue(record.ip, 'ip');
  const nameHash = hashLookupValue(record.name, 'name');

  const params = [
    record.id || crypto.randomUUID(),
    monthKey,
    Number(record.sequence),
    record.sessionId,
    encryptString(record.ip, monthKey),
    ipHash,
    record.plan || 'free',
    encryptString(record.birthBazi || '', monthKey),
    encryptString(record.name || '', monthKey),
    nameHash,
    encryptString(record.birthPlace || '', monthKey),
    encryptString(record.gender || '', monthKey),
    Number(record.reportDurationMs || 0),
    encryptString(JSON.stringify(accuracy), monthKey),
    encryptString(JSON.stringify(bias), monthKey),
    record.mediaSource || 'organic',
    Number(record.couponBalance ?? 0),
    record.paymentStatus || (record.plan === 'paid' ? 'paid' : 'unpaid'),
    record.latestPaymentProvider || null
  ];

  const result = await activePool.query(`
    INSERT INTO user_records (
      id,
      month_key,
      sequence,
      session_id,
      ip_cipher,
      ip_hash,
      plan,
      birth_bazi_cipher,
      name_cipher,
      name_hash,
      birth_place_cipher,
      gender_cipher,
      report_duration_ms,
      accuracy_cipher,
      bias_cipher,
      media_source,
      coupon_balance,
      payment_status,
      latest_payment_provider,
      created_at,
      updated_at
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,NOW(),NOW()
    )
    ON CONFLICT (session_id) DO UPDATE SET
      month_key = EXCLUDED.month_key,
      sequence = EXCLUDED.sequence,
      ip_cipher = EXCLUDED.ip_cipher,
      ip_hash = EXCLUDED.ip_hash,
      plan = EXCLUDED.plan,
      birth_bazi_cipher = EXCLUDED.birth_bazi_cipher,
      name_cipher = EXCLUDED.name_cipher,
      name_hash = EXCLUDED.name_hash,
      birth_place_cipher = EXCLUDED.birth_place_cipher,
      gender_cipher = EXCLUDED.gender_cipher,
      report_duration_ms = EXCLUDED.report_duration_ms,
      accuracy_cipher = EXCLUDED.accuracy_cipher,
      bias_cipher = EXCLUDED.bias_cipher,
      media_source = EXCLUDED.media_source,
      coupon_balance = EXCLUDED.coupon_balance,
      payment_status = EXCLUDED.payment_status,
      latest_payment_provider = EXCLUDED.latest_payment_provider,
      updated_at = NOW()
    RETURNING id, month_key, sequence, session_id, plan, media_source, coupon_balance, payment_status, latest_payment_provider
  `, params);

  return result.rows[0] || null;
}

export async function getUserRecordsByMonth(monthKey = getCurrentMonthKey()) {
  const activePool = getPool();
  if (!activePool) return [];

  const result = await activePool.query(`
    SELECT *
    FROM user_records
    WHERE month_key = $1
    ORDER BY sequence DESC
  `, [monthKey]);

  return result.rows.map((row) => ({
    id: row.id,
    monthKey: row.month_key,
    sequence: Number(row.sequence),
    sessionId: row.session_id,
    plan: row.plan,
    birthBazi: decryptString(row.birth_bazi_cipher),
    name: decryptString(row.name_cipher),
    birthPlace: decryptString(row.birth_place_cipher),
    gender: decryptString(row.gender_cipher),
    reportDurationMs: Number(row.report_duration_ms || 0),
    accuracy: parseEncryptedJson(row.accuracy_cipher, { ...DEFAULT_ACCURACY }),
    bias: parseEncryptedJson(row.bias_cipher, { ...DEFAULT_ACCURACY }),
    mediaSource: row.media_source,
    couponBalance: Number(row.coupon_balance || 0),
    paymentStatus: row.payment_status,
    latestPaymentProvider: row.latest_payment_provider,
    createdAt: row.created_at
  }));
}

export async function getUserRecordBySessionId(sessionId) {
  const activePool = getPool();
  if (!activePool || !sessionId) return null;

  const result = await activePool.query(`
    SELECT id, month_key, sequence, session_id, plan, coupon_balance, payment_status, latest_payment_provider
    FROM user_records
    WHERE session_id = $1
    LIMIT 1
  `, [sessionId]);
  const row = result.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    monthKey: row.month_key,
    sequence: Number(row.sequence),
    sessionId: row.session_id,
    plan: row.plan,
    couponBalance: Number(row.coupon_balance || 0),
    paymentStatus: row.payment_status,
    latestPaymentProvider: row.latest_payment_provider
  };
}

export async function upsertReportRecord(record) {
  const activePool = getPool();
  if (!activePool) return null;
  const monthKey = record.monthKey || getCurrentMonthKey();

  const result = await activePool.query(`
    INSERT INTO report_records (
      id,
      month_key,
      sequence,
      session_id,
      report_title,
      zen_title,
      report_cipher,
      zen_cipher,
      notebook_key,
      created_at,
      updated_at
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW()
    )
    ON CONFLICT (month_key, sequence) DO UPDATE SET
      session_id = EXCLUDED.session_id,
      report_title = EXCLUDED.report_title,
      zen_title = EXCLUDED.zen_title,
      report_cipher = EXCLUDED.report_cipher,
      zen_cipher = EXCLUDED.zen_cipher,
      notebook_key = EXCLUDED.notebook_key,
      updated_at = NOW()
    RETURNING id, notebook_key
  `, [
    record.id || crypto.randomUUID(),
    monthKey,
    Number(record.sequence),
    record.sessionId,
    record.reportTitle || '生命时空密码解析报告',
    record.zenTitle || '智能禅语',
    encryptString(record.report || '', monthKey),
    encryptString(record.zenMessage || '', monthKey),
    record.notebookKey
  ]);

  return result.rows[0] || null;
}

export async function getReportRecord(monthKey, sequence) {
  const activePool = getPool();
  if (!activePool) return null;

  const result = await activePool.query(`
    SELECT *
    FROM report_records
    WHERE month_key = $1 AND sequence = $2
    LIMIT 1
  `, [monthKey, Number(sequence)]);

  const row = result.rows[0];
  if (!row) return null;

  return {
    id: row.id,
    monthKey: row.month_key,
    sequence: Number(row.sequence),
    sessionId: row.session_id,
    reportTitle: row.report_title,
    zenTitle: row.zen_title,
    report: decryptString(row.report_cipher),
    zenMessage: decryptString(row.zen_cipher),
    notebookKey: row.notebook_key
  };
}

export async function createPaymentOrder(order) {
  const activePool = getPool();
  if (!activePool) return null;

  const monthKey = order.monthKey || getCurrentMonthKey();
  const provider = order.provider || 'wechat';
  const channel = order.channel || (provider === 'wechat' || provider === 'alipay' ? 'domestic' : 'global');
  const result = await activePool.query(`
    INSERT INTO payment_orders (
      id,
      month_key,
      sequence,
      session_id,
      provider,
      channel,
      status,
      currency,
      amount_minor,
      coupon_used_minor,
      payable_minor,
      plan_after_success,
      gateway_order_no,
      request_cipher,
      response_cipher,
      created_at,
      updated_at
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW(),NOW()
    )
    RETURNING *
  `, [
    order.id || crypto.randomUUID(),
    monthKey,
    Number(order.sequence || 0) || null,
    order.sessionId || null,
    provider,
    channel,
    order.status || 'pending',
    order.currency || 'CNY',
    Number(order.amountMinor || 0),
    Number(order.couponUsedMinor || 0),
    Number(order.payableMinor || 0),
    order.planAfterSuccess || 'paid',
    order.gatewayOrderNo || null,
    encryptString(JSON.stringify(order.requestPayload || {}), monthKey),
    order.responsePayload ? encryptString(JSON.stringify(order.responsePayload), monthKey) : null
  ]);

  return mapPaymentOrderRecord(result.rows[0]);
}

export async function updatePaymentOrder(orderId, patch = {}) {
  const activePool = getPool();
  if (!activePool) return null;

  const currentResult = await activePool.query(`
    SELECT *
    FROM payment_orders
    WHERE id = $1
    LIMIT 1
  `, [orderId]);
  const current = currentResult.rows[0];
  if (!current) return null;

  const monthKey = current.month_key;
  const responseCipher = patch.responsePayload
    ? encryptString(JSON.stringify(patch.responsePayload), monthKey)
    : current.response_cipher;

  const result = await activePool.query(`
    UPDATE payment_orders
    SET
      status = $2,
      gateway_order_no = COALESCE($3, gateway_order_no),
      response_cipher = $4,
      updated_at = NOW()
    WHERE id = $1
    RETURNING *
  `, [
    orderId,
    patch.status || current.status,
    patch.gatewayOrderNo || null,
    responseCipher
  ]);
  return mapPaymentOrderRecord(result.rows[0]);
}

export function mapPaymentOrderRecord(row) {
  if (!row) return null;
  return {
    id: row.id,
    monthKey: row.month_key,
    sequence: row.sequence == null ? null : Number(row.sequence),
    sessionId: row.session_id,
    provider: row.provider,
    channel: row.channel,
    status: row.status,
    currency: row.currency,
    amountMinor: Number(row.amount_minor || 0),
    couponUsedMinor: Number(row.coupon_used_minor || 0),
    payableMinor: Number(row.payable_minor || 0),
    planAfterSuccess: row.plan_after_success,
    gatewayOrderNo: row.gateway_order_no,
    requestPayload: parseEncryptedJson(row.request_cipher, {}),
    responsePayload: row.response_cipher ? parseEncryptedJson(row.response_cipher, {}) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export async function getPaymentOrderById(orderId) {
  const activePool = getPool();
  if (!activePool || !orderId) return null;
  const result = await activePool.query('SELECT * FROM payment_orders WHERE id = $1 LIMIT 1', [orderId]);
  return mapPaymentOrderRecord(result.rows[0]);
}

export async function completePaymentOrder(orderId, paymentResult) {
  const activePool = getPool();
  if (!activePool) return null;
  const client = await activePool.connect();
  try {
    await client.query('BEGIN');
    const selected = await client.query('SELECT * FROM payment_orders WHERE id = $1 FOR UPDATE', [orderId]);
    const current = mapPaymentOrderRecord(selected.rows[0]);
    if (!current) {
      await client.query('ROLLBACK');
      return null;
    }
    if (current.status === 'paid') {
      await client.query('COMMIT');
      return { order: current, completed: false };
    }
    if (current.provider !== paymentResult.provider
      || current.currency !== paymentResult.currency
      || current.payableMinor !== Number(paymentResult.amountMinor)) {
      throw new Error('Payment result does not match the stored order');
    }

    const responseCipher = encryptString(JSON.stringify(paymentResult.raw || {}), current.monthKey);
    const updated = await client.query(`
      UPDATE payment_orders
      SET status = 'paid', gateway_order_no = $2, response_cipher = $3, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [orderId, paymentResult.gatewayOrderNo || null, responseCipher]);

    const entitlementUpdate = await client.query(`
      UPDATE user_records
      SET
        plan = $2,
        coupon_balance = GREATEST(0, coupon_balance - $3),
        payment_status = 'paid',
        latest_payment_provider = $4,
        updated_at = NOW()
      WHERE session_id = $1
    `, [current.sessionId, current.planAfterSuccess || 'paid', Math.round(current.couponUsedMinor / 100), current.provider]);
    assertPaymentUserUpdated(entitlementUpdate.rowCount);

    await client.query('COMMIT');
    return { order: mapPaymentOrderRecord(updated.rows[0]), completed: true };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export function assertPaymentUserUpdated(rowCount) {
  if (Number(rowCount) !== 1) {
    throw new Error('Payment completed without a matching user record');
  }
}

export async function appendPaymentCallback(callback) {
  const activePool = getPool();
  if (!activePool) return null;
  const monthKey = callback.monthKey || getCurrentMonthKey();

  const result = await activePool.query(`
    INSERT INTO payment_callbacks (
      id,
      payment_order_id,
      provider,
      callback_status,
      payload_cipher,
      created_at
    ) VALUES (
      $1,$2,$3,$4,$5,NOW()
    )
    RETURNING id
  `, [
    callback.id || crypto.randomUUID(),
    callback.paymentOrderId,
    callback.provider,
    callback.callbackStatus || 'received',
    encryptString(JSON.stringify(callback.payload || {}), monthKey)
  ]);

  return result.rows[0] || null;
}

export async function createDecryptAuditLog(entry) {
  const activePool = getPool();
  if (!activePool) return null;

  const result = await activePool.query(`
    INSERT INTO decrypt_audit_logs (
      id,
      target_type,
      target_key,
      month_key,
      operator_name,
      dynamic_instruction,
      created_at
    ) VALUES (
      $1,$2,$3,$4,$5,$6,NOW()
    )
    RETURNING id
  `, [
    entry.id || crypto.randomUUID(),
    entry.targetType,
    entry.targetKey,
    entry.monthKey || getCurrentMonthKey(),
    entry.operatorName || 'admin',
    entry.dynamicInstruction
  ]);

  return result.rows[0] || null;
}
