import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

test('injected server environment variables override local env files', () => {
  const output = execFileSync(process.execPath, [
    '--input-type=module',
    '-e',
    "await import('./server/loadEnv.mjs'); process.stdout.write('PORT_RESULT=' + process.env.PORT)"
  ], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: '18787' },
    encoding: 'utf8'
  });
  assert.match(output, /PORT_RESULT=18787$/);
});
