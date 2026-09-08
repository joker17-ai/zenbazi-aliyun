import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('admin client exports every management operation with encoded queries and ids', async () => {
  const source = await readFile(new URL('../../src/utils/adminClient.js', import.meta.url), 'utf8');
  for (const name of [
    'getAdminOverview',
    'listAdminUsers',
    'getAdminUser',
    'listAdminPayments',
    'getAdminPayment',
    'listAdminReports',
    'getAdminReport'
  ]) {
    assert.match(source, new RegExp(`export async function ${name}\\b`));
  }
  assert.match(source, /new URLSearchParams\(\)/);
  assert.match(source, /encodeURIComponent\(id\)/);
});

test('admin client preserves HTTP status on API errors', async () => {
  const source = await readFile(new URL('../../src/utils/adminClient.js', import.meta.url), 'utf8');
  assert.match(source, /error\.status = response\.status/);
});
