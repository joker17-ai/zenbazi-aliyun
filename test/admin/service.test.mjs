import test from 'node:test';
import assert from 'node:assert/strict';
import { createAdminService, normalizeAdminQuery } from '../../server/admin/service.mjs';

function repository() {
  return {
    async getOverview() { return { totalUsers: 1, paidUsers: 1, pendingPayments: 0, revenueMinor: 6800, generatedReports: 1, failedReports: 0 }; },
    async listUsers() {
      return {
        total: 1,
        items: [{ id: 'u1', name: '张三', phone: '13800138000', email: 'user@example.com', sessionId: 'session-123456', paymentStatus: 'paid' }]
      };
    },
    async getUser(id) { return id === 'u1' ? { id, phone: '13800138000', sessionId: 'session-123456' } : null; },
    async listPayments() { return { items: [{ id: 'p1', userPhone: '13800138000', sessionId: 'session-123456' }], total: 1 }; },
    async getPayment(id) { return id === 'p1' ? { id } : null; },
    async listReports() { return { items: [{ id: 'r1', sessionId: 'session-123456' }], total: 1 }; },
    async getReport(id) { return id === 'r1' ? { id, report: '报告正文' } : null; }
  };
}

test('normalizes bounded admin pagination and filters', () => {
  assert.deepEqual(normalizeAdminQuery(new URLSearchParams('page=2&pageSize=500&month=202609&status=paid&provider=wechat&query=%E5%BC%A0%E4%B8%89')), {
    page: 2,
    pageSize: 100,
    limit: 100,
    offset: 100,
    monthKey: '202609',
    status: 'paid',
    provider: 'wechat',
    query: '张三'
  });
});

test('user list masks contact and session identifiers', async () => {
  const service = createAdminService({ repository: repository(), databaseEnabled: () => true });
  const result = await service.listUsers({ page: 1, pageSize: 20 });
  assert.equal(result.items[0].phone, '138****8000');
  assert.equal(result.items[0].email, 'u***@example.com');
  assert.equal(result.items[0].sessionId, 'sess…3456');
  assert.equal(result.page, 1);
  assert.equal(result.pageSize, 20);
  assert.equal(result.total, 1);
});

test('details keep permitted full contact fields', async () => {
  const service = createAdminService({ repository: repository(), databaseEnabled: () => true });
  const user = await service.getUser('u1');
  assert.equal(user.phone, '13800138000');
  assert.equal(user.sessionId, 'session-123456');
});

test('missing details return a 404 domain error', async () => {
  const service = createAdminService({ repository: repository(), databaseEnabled: () => true });
  await assert.rejects(
    () => service.getReport('missing'),
    (error) => error.status === 404 && error.code === 'ADMIN_RECORD_NOT_FOUND'
  );
});

test('admin data fails clearly when PostgreSQL is disabled', async () => {
  const service = createAdminService({ repository: repository(), databaseEnabled: () => false });
  await assert.rejects(
    () => service.listPayments({}),
    (error) => error.status === 503 && error.code === 'DATABASE_REQUIRED'
  );
});
