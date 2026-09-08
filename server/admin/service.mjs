import {
  getAdminOverview,
  getAdminPaymentById,
  getAdminReportById,
  getAdminUserById,
  isDatabaseEnabled,
  listAdminPayments,
  listAdminReports,
  listAdminUsers
} from '../database.mjs';

const defaultRepository = {
  getOverview: getAdminOverview,
  listUsers: listAdminUsers,
  getUser: getAdminUserById,
  listPayments: listAdminPayments,
  getPayment: getAdminPaymentById,
  listReports: listAdminReports,
  getReport: getAdminReportById
};

function valueFrom(input, name) {
  if (typeof input?.get === 'function') return input.get(name);
  return input?.[name];
}

function boundedInteger(value, fallback, min, max) {
  const parsed = Number.parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function cleanFilter(value, maxLength = 128) {
  return String(value || '').trim().slice(0, maxLength);
}

export function normalizeAdminQuery(input = {}) {
  const page = boundedInteger(valueFrom(input, 'page'), 1, 1, 1_000_000);
  const pageSize = boundedInteger(valueFrom(input, 'pageSize'), 20, 1, 100);
  const requestedMonth = cleanFilter(valueFrom(input, 'month'), 6);
  const monthKey = /^\d{6}$/.test(requestedMonth) ? requestedMonth : '';
  return {
    page,
    pageSize,
    limit: pageSize,
    offset: (page - 1) * pageSize,
    monthKey,
    status: cleanFilter(valueFrom(input, 'status'), 32),
    provider: cleanFilter(valueFrom(input, 'provider'), 32),
    query: cleanFilter(valueFrom(input, 'query'))
  };
}

export function maskPhone(value) {
  const phone = String(value || '');
  if (phone.length < 7) return phone ? `${phone.slice(0, 2)}***` : '';
  return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
}

export function maskEmail(value) {
  const email = String(value || '');
  const at = email.indexOf('@');
  if (at <= 0) return email ? `${email.slice(0, 1)}***` : '';
  return `${email.slice(0, 1)}***${email.slice(at)}`;
}

export function maskSession(value) {
  const sessionId = String(value || '');
  if (sessionId.length <= 8) return sessionId;
  return `${sessionId.slice(0, 4)}…${sessionId.slice(-4)}`;
}

function maskListItem(item, kind) {
  const masked = { ...item, sessionId: maskSession(item.sessionId) };
  if (kind === 'user') {
    masked.phone = maskPhone(item.phone);
    masked.email = maskEmail(item.email);
  }
  if (kind === 'payment') {
    masked.userPhone = maskPhone(item.userPhone);
  }
  return masked;
}

function adminError(message, status, code) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

export function createAdminService({ repository = defaultRepository, databaseEnabled = isDatabaseEnabled } = {}) {
  const requireDatabase = () => {
    if (!databaseEnabled()) {
      throw adminError('后台数据库尚未启用', 503, 'DATABASE_REQUIRED');
    }
  };

  const list = async (kind, method, input) => {
    requireDatabase();
    const query = normalizeAdminQuery(input);
    const result = await method(query);
    return {
      items: (result.items || []).map((item) => maskListItem(item, kind)),
      page: query.page,
      pageSize: query.pageSize,
      total: Number(result.total || 0)
    };
  };

  const detail = async (label, method, id) => {
    requireDatabase();
    const record = await method(id);
    if (!record) throw adminError(`${label}不存在`, 404, 'ADMIN_RECORD_NOT_FOUND');
    return record;
  };

  return {
    async getOverview(input) {
      requireDatabase();
      const query = normalizeAdminQuery(input);
      const [summary, recentPayments, recentReports] = await Promise.all([
        repository.getOverview(query.monthKey),
        repository.listPayments({ ...query, limit: 5, offset: 0 }),
        repository.listReports({ ...query, limit: 5, offset: 0 })
      ]);
      return {
        ...summary,
        monthKey: query.monthKey,
        recentPayments: (recentPayments.items || []).map((item) => maskListItem(item, 'payment')),
        recentReports: (recentReports.items || []).map((item) => maskListItem(item, 'report'))
      };
    },
    listUsers: (input) => list('user', repository.listUsers, input),
    getUser: (id) => detail('用户', repository.getUser, id),
    listPayments: (input) => list('payment', repository.listPayments, input),
    getPayment: (id) => detail('付款订单', repository.getPayment, id),
    listReports: (input) => list('report', repository.listReports, input),
    getReport: (id) => detail('生成内容', repository.getReport, id)
  };
}
