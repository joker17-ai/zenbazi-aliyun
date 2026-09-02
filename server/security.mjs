import crypto from 'node:crypto';

const ADMIN_SECRET = process.env.ZENBAZI_ADMIN_SECRET || 'zenbazi-cloud-brain';
const ADMIN_JWT_SECRET = process.env.ZENBAZI_ADMIN_JWT_SECRET || `${ADMIN_SECRET}-jwt`;
const ADMIN_USER = process.env.ZENBAZI_ADMIN_USER || 'admin';
const ADMIN_PASSWORD = process.env.ZENBAZI_ADMIN_PASSWORD || '6962222';
const TOKEN_VERSION = 'v1';

function encodeBase64Url(value) {
  return Buffer.from(value, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function decodeBase64Url(value) {
  const normalized = value
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=');
  return Buffer.from(normalized, 'base64').toString('utf8');
}

function signTokenPayload(payload) {
  return crypto.createHmac('sha256', ADMIN_JWT_SECRET).update(payload).digest('base64url');
}

export function getCurrentMonthKey(date = new Date()) {
  return `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function getDynamicInstruction(monthKey) {
  return crypto.createHash('sha256').update(`${ADMIN_SECRET}:${monthKey}`).digest('hex').slice(0, 24);
}

export function hashLookupValue(value, namespace = 'lookup') {
  return crypto
    .createHmac('sha256', `${ADMIN_SECRET}:${namespace}`)
    .update(String(value || ''))
    .digest('hex');
}

export function getAesKey(monthKey) {
  return crypto.createHash('sha256').update(`${ADMIN_SECRET}:${monthKey}:aes-256-gcm`).digest();
}

export function encryptString(value, monthKey = getCurrentMonthKey()) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getAesKey(monthKey), iv);
  const encrypted = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();

  return JSON.stringify({
    alg: 'aes-256-gcm',
    monthKey,
    iv: iv.toString('base64'),
    tag: tag.toString('base64'),
    data: encrypted.toString('base64')
  });
}

export function decryptString(value) {
  const envelope = typeof value === 'string' ? JSON.parse(value) : value;
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getAesKey(envelope.monthKey),
    Buffer.from(envelope.iv, 'base64')
  );
  decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(envelope.data, 'base64')),
    decipher.final()
  ]);
  return decrypted.toString('utf8');
}

export function signAdminToken(username = ADMIN_USER) {
  const payload = {
    sub: username,
    role: 'admin',
    exp: Date.now() + 12 * 60 * 60 * 1000
  };
  const encoded = encodeBase64Url(JSON.stringify(payload));
  const signature = signTokenPayload(`${TOKEN_VERSION}.${encoded}`);
  return `${TOKEN_VERSION}.${encoded}.${signature}`;
}

export function verifyAdminCredentials(username, password) {
  return username === ADMIN_USER && password === ADMIN_PASSWORD;
}

export function verifyAdminToken(token) {
  const [version, encoded, signature] = String(token || '').split('.');
  if (!version || !encoded || !signature || version !== TOKEN_VERSION) {
    throw new Error('Unauthorized');
  }
  const expected = signTokenPayload(`${version}.${encoded}`);
  if (signature !== expected) {
    throw new Error('Unauthorized');
  }
  const payload = JSON.parse(decodeBase64Url(encoded));
  if (!payload.exp || payload.exp < Date.now()) {
    throw new Error('Unauthorized');
  }
  return payload;
}
