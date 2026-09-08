import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('admin dashboard provides four management tabs without manual sequence decryption', async () => {
  const source = await readFile(new URL('../../src/components/AdminDashboard.jsx', import.meta.url), 'utf8');
  for (const tab of ['overview', 'users', 'payments', 'reports']) {
    assert.match(source, new RegExp(`id: '${tab}'`));
  }
  assert.doesNotMatch(source, /decryptAdminReport/);
  assert.doesNotMatch(source, /setSequence/);
});

test('admin rows provide one-click generated content viewing', async () => {
  const users = await readFile(new URL('../../src/components/admin/AdminUsers.jsx', import.meta.url), 'utf8');
  const payments = await readFile(new URL('../../src/components/admin/AdminPayments.jsx', import.meta.url), 'utf8');
  const reports = await readFile(new URL('../../src/components/admin/AdminReports.jsx', import.meta.url), 'utf8');
  assert.match(users, /查看生成内容/);
  assert.match(payments, /查看生成内容/);
  assert.match(reports, /getAdminReport/);
});
