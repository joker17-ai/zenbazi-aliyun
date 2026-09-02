import './loadEnv.mjs';
import { readFile, writeFile } from 'node:fs/promises';
import crypto from 'node:crypto';
import path from 'node:path';

const [, , sourceFile, command] = process.argv;
const ADMIN_SECRET = process.env.ZENBAZI_ADMIN_SECRET || 'zenbazi-cloud-brain';

if (!sourceFile || !command) {
  process.stderr.write('Usage: node server/admin-decrypt.mjs <encrypted.ipynb> <dynamic-command>\n');
  process.exit(1);
}

function getAesKey(monthKey) {
  return crypto.createHash('sha256').update(`${ADMIN_SECRET}:${monthKey}:aes-256-gcm`).digest();
}

function getDynamicInstruction(monthKey) {
  return crypto.createHash('sha256').update(`${ADMIN_SECRET}:${monthKey}`).digest('hex').slice(0, 24);
}

function decryptEnvelope(envelope) {
  if (command !== getDynamicInstruction(envelope.monthKey)) {
    throw new Error('Dynamic instruction is invalid for this month');
  }
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getAesKey(envelope.monthKey),
    Buffer.from(envelope.iv, 'base64')
  );
  decipher.setAuthTag(Buffer.from(envelope.tag, 'base64'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(envelope.data, 'base64')),
    decipher.final()
  ]);
  return decrypted.toString('utf8');
}

const raw = await readFile(sourceFile, 'utf8');
const envelope = JSON.parse(raw);
const output = decryptEnvelope(envelope);
const outputPath = path.join(path.dirname(sourceFile), `${path.basename(sourceFile, '.ipynb')}.decrypted.ipynb`);
await writeFile(outputPath, output, 'utf8');
process.stdout.write(`Decrypted notebook written to ${outputPath}\n`);
