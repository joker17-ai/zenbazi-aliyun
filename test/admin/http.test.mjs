import test from 'node:test';
import assert from 'node:assert/strict';
import { matchAdminRoute } from '../../server/admin/http.mjs';

test('matches only the new read-only admin routes', () => {
  assert.deepEqual(matchAdminRoute('GET', '/api/admin/overview'), { action: 'overview' });
  assert.deepEqual(matchAdminRoute('GET', '/api/admin/users'), { action: 'users' });
  assert.deepEqual(matchAdminRoute('GET', '/api/admin/users/user%201'), { action: 'user', id: 'user 1' });
  assert.deepEqual(matchAdminRoute('GET', '/api/admin/payments'), { action: 'payments' });
  assert.deepEqual(matchAdminRoute('GET', '/api/admin/payments/ZB1'), { action: 'payment', id: 'ZB1' });
  assert.deepEqual(matchAdminRoute('GET', '/api/admin/reports'), { action: 'reports' });
  assert.deepEqual(matchAdminRoute('GET', '/api/admin/reports/R1'), { action: 'report', id: 'R1' });
});

test('does not capture compatibility or mutation routes', () => {
  assert.equal(matchAdminRoute('POST', '/api/admin/login'), null);
  assert.equal(matchAdminRoute('GET', '/api/admin/metrics'), null);
  assert.equal(matchAdminRoute('POST', '/api/admin/decrypt'), null);
  assert.equal(matchAdminRoute('DELETE', '/api/admin/users/u1'), null);
  assert.equal(matchAdminRoute('GET', '/api/admin/users/u1/extra'), null);
});
