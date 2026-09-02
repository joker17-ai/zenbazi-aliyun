import path from 'node:path';
import { copyFile, mkdir, readdir } from 'node:fs/promises';
import XLSX from 'xlsx';
import { decryptString } from '../server/security.mjs';

const ROOT = 'D:/ZenBazi/cloud/userinfo';
const BACKUP_ROOT = path.join(ROOT, '_legacy_backups');
const RUN_STAMP = new Date().toISOString().replace(/[:.]/g, '-');
const TEXT_FIELDS = [
  'ip',
  'plan',
  'birth_bazi',
  'name',
  'birth_place',
  'gender',
  'media_source',
  'session_id',
  'payment_status',
  'latest_payment_provider'
];
const NUMBER_FIELDS = [
  'report_duration_ms',
  'accuracy_10_1',
  'accuracy_10_2',
  'accuracy_10_3',
  'accuracy_10_4',
  'accuracy_10_5',
  'accuracy_10_6',
  'accuracy_overall',
  'bias_11_1',
  'bias_11_2',
  'bias_11_3',
  'bias_11_4',
  'bias_11_5',
  'bias_11_6',
  'bias_overall',
  'coupon_balance'
];
const KNOWN_FIELDS = ['sequence', ...TEXT_FIELDS, ...NUMBER_FIELDS];

function isEncryptedEnvelope(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed.startsWith('{') || !trimmed.includes('"alg"')) return false;
  try {
    const parsed = JSON.parse(trimmed);
    return parsed?.alg === 'aes-256-gcm' && typeof parsed.data === 'string';
  } catch {
    return false;
  }
}

function decodeValue(value) {
  if (value === undefined || value === null || value === '') return '';
  return isEncryptedEnvelope(value) ? decryptString(value) : value;
}

function decodeNumber(value) {
  const parsed = Number(decodeValue(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeTextField(value, fallback, issues, field) {
  if (!isEncryptedEnvelope(value)) {
    return value === undefined || value === null ? fallback : value;
  }
  try {
    return decodeValue(value);
  } catch (error) {
    issues.push(`${field}: ${error.message}`);
    return fallback;
  }
}

function normalizeNumberField(value, fallback, issues, field) {
  if (!isEncryptedEnvelope(value)) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  try {
    return decodeNumber(value);
  } catch (error) {
    issues.push(`${field}: ${error.message}`);
    return fallback;
  }
}

function normalizeRow(row, monthKey) {
  const sequence = Number(row.sequence || 0);
  const issues = [];
  const next = {
    sequence
  };

  for (const field of TEXT_FIELDS) {
    const fallback = field === 'plan'
      ? 'archived'
      : field === 'name'
        ? '[历史归档记录]'
        : field === 'session_id'
          ? `legacy-archive-${monthKey}-${sequence}`
          : field === 'payment_status'
            ? 'archived'
            : '';
    next[field] = normalizeTextField(row[field], fallback, issues, field);
  }

  for (const field of NUMBER_FIELDS) {
    next[field] = normalizeNumberField(row[field], 0, issues, field);
  }

  return { next, issues };
}

function buildSheetRows(rows, monthKey, fileIssues) {
  return rows.map((row) => {
    const { next, issues } = normalizeRow(row, monthKey);
    if (issues.length > 0) {
      fileIssues.push({
        sequence: next.sequence,
        issues
      });
    }
    return next;
  }).filter((row) => row.sequence > 0);
}

const files = (await readdir(ROOT)).filter((file) => file.endsWith('.xlsx'));
await mkdir(path.join(BACKUP_ROOT, RUN_STAMP), { recursive: true });

for (const file of files) {
  const filePath = path.join(ROOT, file);
  const monthKey = path.basename(file, '.xlsx');
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);
  const fileIssues = [];
  const normalized = buildSheetRows(rows, monthKey, fileIssues);
  const nextWorkbook = XLSX.utils.book_new();
  const nextSheet = XLSX.utils.json_to_sheet(normalized, {
    header: KNOWN_FIELDS
  });
  XLSX.utils.book_append_sheet(nextWorkbook, nextSheet, 'userinfo');
  await copyFile(filePath, path.join(BACKUP_ROOT, RUN_STAMP, file));
  XLSX.writeFile(nextWorkbook, filePath);
  console.log(`Migrated ${file}: ${normalized.length} rows`);
  if (fileIssues.length > 0) {
    console.log(`  Sanitized unreadable rows: ${fileIssues.length}`);
    for (const issue of fileIssues) {
      console.log(`  - sequence ${issue.sequence}: ${issue.issues.join('; ')}`);
    }
  }
}
