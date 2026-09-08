import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('debug admin metrics are restricted to local development', async () => {
  const source = await readFile(new URL('../../server/server.mjs', import.meta.url), 'utf8');
  assert.match(
    source,
    /req\.method === 'GET' && url\.pathname === '\/api\/dev\/admin-metrics' && isDevMode\(\) && isLocalRequest\(req\)/
  );
});
