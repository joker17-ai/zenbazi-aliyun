import * as XLSX from 'xlsx';

const API_ROOT = import.meta.env?.DEV ? 'http://127.0.0.1:8787' : '';
const DEV_ADMIN_SECRET = import.meta.env?.VITE_ZENBAZI_ADMIN_SECRET || 'zenbazi-cloud-brain';
const aesKeyCache = new Map();

function hasLocalAdminBypass() {
  return Boolean(import.meta.env?.DEV);
}

function getToken() {
  return localStorage.getItem('zenbazi_admin_token') || '';
}

function createEmptyMetrics(monthKey) {
  return {
    monthKey,
    totalRecords: 0,
    paidUsers: 0,
    freeUsers: 0,
    totalCoupons: 0,
    averageReportDurationMs: 0,
    feedbackAccuracy: {
      industry: 0,
      role: 0,
      wealth: 0,
      body: 0,
      status: 0,
      overall: 0
    },
    latestRecords: []
  };
}

function isEncryptedField(value) {
  return (
    typeof value === 'string'
    && value.includes('"alg"')
    && value.includes('"aes-256-gcm"')
  );
}

function base64ToBytes(value) {
  const binary = window.atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function getWorkbookAesKey(monthKey) {
  if (aesKeyCache.has(monthKey)) {
    return aesKeyCache.get(monthKey);
  }
  const keyMaterial = new TextEncoder().encode(`${DEV_ADMIN_SECRET}:${monthKey}:aes-256-gcm`);
  const digest = await window.crypto.subtle.digest('SHA-256', keyMaterial);
  const key = await window.crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['decrypt']);
  aesKeyCache.set(monthKey, key);
  return key;
}

async function decryptWorkbookField(value) {
  if (!isEncryptedField(value)) {
    return value;
  }
  try {
    const envelope = JSON.parse(value);
    const key = await getWorkbookAesKey(envelope.monthKey);
    const iv = base64ToBytes(envelope.iv);
    const data = base64ToBytes(envelope.data);
    const tag = base64ToBytes(envelope.tag);
    const payload = new Uint8Array(data.length + tag.length);
    payload.set(data, 0);
    payload.set(tag, data.length);
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      payload
    );
    return new TextDecoder().decode(decrypted);
  } catch {
    return '';
  }
}

async function loadWorkbookMetrics(monthKey) {
  const workbookUrl = `${window.location.origin}/cloud/userinfo/${monthKey}.xlsx`;
  const response = await fetch(workbookUrl, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`Workbook not found: ${monthKey}`);
  }
  const buffer = await response.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);

  const textValue = (value, fallback = '-') => {
    if (value === undefined || value === null || value === '') {
      return fallback;
    }
    return String(value);
  };
  const numberValue = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  const decodedRows = await Promise.all(rows.map(async (row) => ({
    ...row,
    ip: await decryptWorkbookField(row.ip),
    name: await decryptWorkbookField(row.name),
    plan: await decryptWorkbookField(row.plan),
    birth_bazi: await decryptWorkbookField(row.birth_bazi),
    birth_place: await decryptWorkbookField(row.birth_place),
    gender: await decryptWorkbookField(row.gender),
    coupon_balance: await decryptWorkbookField(row.coupon_balance),
    media_source: await decryptWorkbookField(row.media_source),
    report_duration_ms: await decryptWorkbookField(row.report_duration_ms),
    accuracy_overall: await decryptWorkbookField(row.accuracy_overall)
  })));

  const normalizedRows = decodedRows
    .map((row) => ({
      sequence: Number(row.sequence || 0),
      ip: textValue(row.ip),
      name: textValue(row.name),
      plan: textValue(row.plan),
      birthBazi: textValue(row.birth_bazi),
      birthPlace: textValue(row.birth_place),
      gender: textValue(row.gender),
      couponBalance: textValue(row.coupon_balance),
      mediaSource: textValue(row.media_source),
      reportDurationMs: textValue(row.report_duration_ms),
      accuracyOverall: textValue(row.accuracy_overall)
    }))
    .filter((row) => Number.isFinite(row.sequence) && row.sequence > 0)
    .sort((a, b) => b.sequence - a.sequence);

  const latestRecords = normalizedRows
    .slice(0, 12)
    .map((row) => ({ ...row }));

  return {
    monthKey,
    totalRecords: rows.length,
    paidUsers: normalizedRows.filter((row) => row.plan === 'paid').length,
    freeUsers: normalizedRows.filter((row) => row.plan !== 'paid').length,
    totalCoupons: decodedRows.reduce((sum, row) => sum + numberValue(row.coupon_balance), 0),
    averageReportDurationMs: normalizedRows.length
      ? Math.round(decodedRows.reduce((sum, row) => sum + numberValue(row.report_duration_ms), 0) / normalizedRows.length)
      : 0,
    feedbackAccuracy: {
      industry: 0,
      role: 0,
      wealth: 0,
      body: 0,
      status: 0,
      overall: 0
    },
    latestRecords
  };
}

export function setToken(token) {
  if (token) {
    localStorage.setItem('zenbazi_admin_token', token);
  } else {
    localStorage.removeItem('zenbazi_admin_token');
  }
}

async function adminFetch(path, options = {}) {
  const response = await fetch(`${API_ROOT}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: getToken() ? `Bearer ${getToken()}` : '',
      ...(options.headers || {})
    }
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}

export async function loginAdmin(credentials) {
  if (hasLocalAdminBypass()) {
    setToken('local-dev-admin');
    return { token: 'local-dev-admin', bypass: true };
  }
  const data = await adminFetch('/api/admin/login', {
    method: 'POST',
    body: JSON.stringify(credentials)
  });
  setToken(data.token);
  return data;
}

export async function getAdminMetrics(monthKey) {
  try {
    if (hasLocalAdminBypass()) {
      try {
        return await adminFetch(`/api/admin/metrics?month=${monthKey}`);
      } catch {
        // Fallback to the dev debug endpoint when the standard metrics route is stale.
      }

      try {
        const debugData = await adminFetch(`/api/dev/admin-metrics?month=${monthKey}`);
        if (debugData?.metrics) {
          return {
            monthKey: debugData.monthKey,
            totalRecords: debugData.metrics.totalRecords,
            paidUsers: debugData.metrics.paidUsers,
            freeUsers: debugData.metrics.freeUsers,
            totalCoupons: debugData.metrics.totalCoupons,
            averageReportDurationMs: debugData.metrics.averageReportDurationMs,
            feedbackAccuracy: {
              industry: 0,
              role: 0,
              wealth: 0,
              body: 0,
              status: 0,
              overall: 0
            },
            latestRecords: debugData.metrics.latestRecords || [],
            debug: debugData
          };
        }
      } catch {
        // Final fallback keeps the dashboard usable even if the backend is unavailable.
      }
      return await loadWorkbookMetrics(monthKey);
    }
    return await adminFetch(`/api/admin/metrics?month=${monthKey}`);
  } catch (error) {
    if (hasLocalAdminBypass()) {
      return createEmptyMetrics(monthKey);
    }
    throw error;
  }
}

export async function decryptAdminReport(sequence) {
  try {
    return await adminFetch('/api/admin/decrypt', {
      method: 'POST',
      body: JSON.stringify({ sequence })
    });
  } catch (error) {
    if (hasLocalAdminBypass()) {
      return {
        sequence,
        notebook: {
          message: '当前为本机开发模式，后台解密接口尚未联通。',
          hint: '后续把管理接口真实打通后，这里会显示 Notebook 报告内容。'
        }
      };
    }
    throw error;
  }
}

export function logoutAdmin() {
  setToken('');
}

export function hasAdminToken() {
  return hasLocalAdminBypass() || Boolean(getToken());
}
