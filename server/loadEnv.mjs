import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
function normalizeValue(raw) {
  let value = raw.trim();
  if (!value) return '';

  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }

  return value
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t');
}

const externallyProvidedKeys = new Set(Object.keys(process.env));

function loadEnvFile(fileName) {
  const filePath = path.join(ROOT, fileName);
  if (!existsSync(filePath)) return;

  const content = readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    if (externallyProvidedKeys.has(key)) continue;
    process.env[key] = normalizeValue(rawValue);
  }
}

loadEnvFile('.env');
loadEnvFile('.env.local');

console.log('🔧 环境变量加载结果:');
console.log('  STORAGE_DRIVER:', process.env.STORAGE_DRIVER);
console.log('  OSS_BUCKET:', process.env.OSS_BUCKET);
console.log('  OSS_ACCESS_KEY_ID:', process.env.OSS_ACCESS_KEY_ID ? '已配置' : '未配置');
console.log('  OSS_ACCESS_KEY_SECRET:', process.env.OSS_ACCESS_KEY_SECRET ? '已配置' : '未配置');
