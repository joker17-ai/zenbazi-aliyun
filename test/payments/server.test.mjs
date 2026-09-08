import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('production server contains no simulated payment executor', async () => {
  const source = await readFile(new URL('../../server/server.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /processPaymentJob/);
  assert.doesNotMatch(source, /simulated:\s*true/);
});
