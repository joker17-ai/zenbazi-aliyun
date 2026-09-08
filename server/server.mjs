import './loadEnv.mjs';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { WebSocketServer } from 'ws';
import XLSX from 'xlsx';
import { fileURLToPath } from 'node:url';
import { calculateBaZi } from '../src/utils/bazi.js';
import { analyzeNameUnified } from '../src/utils/nameAnalysis.js';
import { enforceEnglishTranslationGate, getBaZiAnalysis } from '../src/utils/ai.js';
import { createStorage } from './storage.mjs';
import { generateHtmlReport } from './reportGenerator.mjs';
import { isSmsEnabled, sendSms } from './sms.mjs';
import { isMailEnabled, sendMail } from './mailer.mjs';
import {
  createDecryptAuditLog,
  ensureDatabase,
  getReportRecord,
  getUserRecordsByMonth,
  isDatabaseEnabled,
  nextSequence as nextDatabaseSequence,
  trackIpAccess,
  updateUserContact,
  upsertReportRecord,
  upsertUserRecord
} from './database.mjs';
import { createJobRecord, createQueueDriver } from './queue.mjs';
import { matchAdminRoute } from './admin/http.mjs';
import { createAdminService } from './admin/service.mjs';
import { matchPaymentRoute, parseFormBody, readBoundedBody } from './payments/http.mjs';
import { createPaymentService } from './payments/service.mjs';
import {
  decryptString,
  encryptString,
  getCurrentMonthKey,
  getDynamicInstruction,
  signAdminToken,
  verifyAdminCredentials,
  verifyAdminToken
} from './security.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DATA_ROOT = path.join(ROOT, process.env.STORAGE_ROOT || 'cloud');
const PORT = Number(process.env.PORT || 8787);
const WORKER_COUNT = Math.max(1, Math.min(os.cpus().length, 4));
const RATE_LIMIT_SUSPENDED = process.env.ZENBAZI_ENABLE_RATE_LIMIT !== 'true';
const RATE_LIMIT_MESSAGE = '欢迎您使用生命时空密码，由于储存空间有限，欢迎您24小时时间再来!';
const IP_LIMITS = {
  window5mMs: 5 * 60 * 1000,
  window24hMs: 24 * 60 * 60 * 1000,
  max5m: 10,
  max24h: 50
};

const storage = createStorage(DATA_ROOT);
const queueDriver = createQueueDriver();
const clients = new Map();
const ipAccessLog = new Map();
const sequenceCache = new Map();
const paymentService = createPaymentService();
const adminService = createAdminService();

// 动态用户计数器 - 用于显示"已有X用户获取了深度解析"
let userAnalysisCount = 10000; // 初始值10000

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '0.0.0.0';
}

function isLocalRequest(req) {
  const clientIp = getClientIp(req);
  const host = String(req.headers.host || '').toLowerCase();
  return clientIp === '127.0.0.1'
    || clientIp === '::1'
    || clientIp === '::ffff:127.0.0.1'
    || host.startsWith('127.0.0.1:')
    || host.startsWith('localhost:');
}

function isDevMode() {
  return process.env.NODE_ENV !== 'production';
}

function estimateBufferZone(payload) {
  const base = JSON.stringify(payload || {}).length;
  const nameWeight = String(payload?.name || '').length * 4;
  const timeWeight = Object.keys(payload || {}).length * 3;
  const score = base + nameWeight + timeWeight;
  if (score < 180) return 1;
  if (score < 320) return 2;
  if (score < 480) return 3;
  if (score < 700) return 4;
  return 5;
}

function normalizeAssessment(payload = {}) {
  return {
    industry: Number(payload.industry ?? 0),
    role: Number(payload.role ?? 0),
    wealth: Number(payload.wealth ?? 0),
    body: Number(payload.body ?? 0),
    status: Number(payload.status ?? 0),
    time: Number(payload.time ?? 0),
    overall: Number(payload.overall ?? 0)
  };
}

function isEncryptedEnvelope(value) {
  if (typeof value !== 'string') {
    return false;
  }
  const trimmed = value.trim();
  if (!trimmed.startsWith('{') || !trimmed.includes('"alg"')) {
    return false;
  }
  try {
    const parsed = JSON.parse(trimmed);
    return parsed?.alg === 'aes-256-gcm' && typeof parsed.data === 'string';
  } catch {
    return false;
  }
}

function isPlaintextArchiveMode() {
  return process.env.ZENBAZI_PLAINTEXT_ARCHIVE === 'true' || isDevMode();
}

function encodeArchiveValue(value, monthKey) {
  if (isPlaintextArchiveMode()) {
    return value ?? '';
  }
  return encryptString(value ?? '', monthKey);
}

function decodeArchiveValue(value) {
  if (value === undefined || value === null || value === '') {
    return '';
  }
  return isEncryptedEnvelope(value) ? decryptString(value) : String(value);
}

function decodeArchiveNumber(value) {
  const decoded = decodeArchiveValue(value);
  const parsed = Number(decoded);
  return Number.isFinite(parsed) ? parsed : 0;
}

function safeAverage(items, getter) {
  return items.length ? Math.round(items.reduce((sum, item) => sum + getter(item), 0) / items.length) : 0;
}

async function applyRateLimit(ip, plan = 'free') {
  if (RATE_LIMIT_SUSPENDED) {
    return { blocked: false };
  }
  if (plan === 'paid') return { blocked: false };
  if (isDatabaseEnabled()) {
    const counters = await trackIpAccess(ip, plan);
    if ((counters?.hits24h || 0) > IP_LIMITS.max24h || (counters?.hits5m || 0) > IP_LIMITS.max5m) {
      return { blocked: true, message: RATE_LIMIT_MESSAGE };
    }
    return { blocked: false };
  }
  const now = Date.now();
  const records = ipAccessLog.get(ip) || [];
  const nextRecords = records.filter((item) => now - item < IP_LIMITS.window24hMs);
  nextRecords.push(now);
  ipAccessLog.set(ip, nextRecords);
  const hits24h = nextRecords.length;
  const hits5m = nextRecords.filter((item) => now - item < IP_LIMITS.window5mMs).length;
  if (hits24h > IP_LIMITS.max24h || hits5m > IP_LIMITS.max5m) {
    return { blocked: true, message: RATE_LIMIT_MESSAGE };
  }
  return { blocked: false };
}

async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Cache-Control': 'no-store, no-cache, must-revalidate, private',
    Pragma: 'no-cache',
    Expires: '0',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Cross-Origin-Resource-Policy': 'same-origin'
  });
  res.end(JSON.stringify(payload));
}

function sendText(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
  res.end(String(payload));
}

function pushJobUpdate(jobId, payload) {
  const targets = clients.get(jobId);
  if (!targets) return;
  const message = JSON.stringify({ jobId, ...payload });
  targets.forEach((socket) => {
    if (socket.readyState === 1) {
      socket.send(message);
    }
  });
}

function workbookKey(monthKey) {
  return path.posix.join('userinfo', `${monthKey}.xlsx`);
}

function analysisKey(monthKey, sequence) {
  return path.posix.join('analysis', monthKey, `${sequence}.ipynb`);
}

async function getWorkbookRows(monthKey) {
  const key = workbookKey(monthKey);
  if (!(await storage.exists(key))) {
    return [];
  }
  const buffer = await storage.getBuffer(key);
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet);
}

async function writeWorkbookRows(monthKey, rows) {
  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'userinfo');
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  await storage.putBuffer(workbookKey(monthKey), buffer);
}

async function getNextSequence(monthKey) {
  if (isDatabaseEnabled()) {
    return nextDatabaseSequence(monthKey);
  }
  if (sequenceCache.has(monthKey)) {
    const next = sequenceCache.get(monthKey) + 1;
    sequenceCache.set(monthKey, next);
    return next;
  }
  const rows = await getWorkbookRows(monthKey);
  const maxSeq = rows.reduce((max, row) => Math.max(max, Number(row.sequence || 0)), 0);
  const next = maxSeq + 1;
  sequenceCache.set(monthKey, next);
  return next;
}

function normalizeBirthSummary(userInfo, baziResult) {
  return `${baziResult?.pillars?.map((pillar) => (typeof pillar === 'object' ? pillar.char : pillar?.char || pillar || '')).reverse().join(' ')} | ${userInfo.birthDate} ${userInfo.birthTime || ''}`.trim();
}

async function upsertUserInfoRecord(record) {
  const monthKey = record.monthKey || getCurrentMonthKey();
  const rows = await getWorkbookRows(monthKey);
  const index = rows.findIndex((row) => Number(row.sequence) === Number(record.sequence));
  const accuracy = normalizeAssessment(record.accuracy);
  const bias = normalizeAssessment(record.bias);
  const nextRow = {
    sequence: record.sequence,
    ip: encodeArchiveValue(record.ip, monthKey),
    plan: encodeArchiveValue(record.plan, monthKey),
    birth_bazi: encodeArchiveValue(record.birthBazi, monthKey),
    name: encodeArchiveValue(record.name, monthKey),
    birth_place: encodeArchiveValue(record.birthPlace, monthKey),
    gender: encodeArchiveValue(record.gender, monthKey),
    report_duration_ms: encodeArchiveValue(record.reportDurationMs, monthKey),
    accuracy_10_1: encodeArchiveValue(accuracy.industry, monthKey),
    accuracy_10_2: encodeArchiveValue(accuracy.role, monthKey),
    accuracy_10_3: encodeArchiveValue(accuracy.wealth, monthKey),
    accuracy_10_4: encodeArchiveValue(accuracy.body, monthKey),
    accuracy_10_5: encodeArchiveValue(accuracy.status, monthKey),
    accuracy_10_6: encodeArchiveValue(accuracy.time, monthKey),
    accuracy_overall: encodeArchiveValue(accuracy.overall, monthKey),
    bias_11_1: encodeArchiveValue(bias.industry, monthKey),
    bias_11_2: encodeArchiveValue(bias.role, monthKey),
    bias_11_3: encodeArchiveValue(bias.wealth, monthKey),
    bias_11_4: encodeArchiveValue(bias.body, monthKey),
    bias_11_5: encodeArchiveValue(bias.status, monthKey),
    bias_11_6: encodeArchiveValue(bias.time, monthKey),
    bias_overall: encodeArchiveValue(bias.overall, monthKey),
    media_source: encodeArchiveValue(record.mediaSource || 'organic', monthKey),
    coupon_balance: encodeArchiveValue(record.couponBalance ?? 0, monthKey),
    session_id: encodeArchiveValue(record.sessionId, monthKey),
    payment_status: encodeArchiveValue(record.paymentStatus || (record.plan === 'paid' ? 'paid' : 'unpaid'), monthKey),
    latest_payment_provider: encodeArchiveValue(record.latestPaymentProvider || '', monthKey)
  };
  if (index >= 0) {
    rows[index] = nextRow;
  } else {
    rows.push(nextRow);
  }
  await writeWorkbookRows(monthKey, rows);
  if (isDatabaseEnabled()) {
    await upsertUserRecord({
      monthKey,
      sequence: record.sequence,
      sessionId: record.sessionId,
      ip: record.ip,
      plan: record.plan,
      birthBazi: record.birthBazi,
      name: record.name,
      birthPlace: record.birthPlace,
      gender: record.gender,
      reportDurationMs: record.reportDurationMs,
      accuracy,
      bias,
      mediaSource: record.mediaSource,
      couponBalance: record.couponBalance,
      paymentStatus: record.paymentStatus,
      latestPaymentProvider: record.latestPaymentProvider,
      phone: record.phone,
      email: record.email
    });
  }
}

function buildNotebook(report, payload) {
  const userInfo = payload.userInfo || {};
  const baziResult = payload.baziResult || {};
  const namingResult = payload.namingResult || {};
  const basics = [
    `- 姓名：${userInfo.name || '未填写'}`,
    `- 序号：${payload.sequence || userInfo.sequence || ''}`,
    `- 月份文件：${payload.monthKey || getCurrentMonthKey()}`,
    `- 性别：${userInfo.gender || '未填写'}`,
    `- 出生时间：${userInfo.birthDate || ''} ${userInfo.birthTime || ''}`.trim(),
    `- 八字：${payload.birthBazi || ''}`,
    `- 出生地：${payload.birthPlace || ''}`,
    `- 方案：${userInfo.plan || 'free'}`
  ].join('\n');
  const namingSummary = [
    `- 姓名：${namingResult.fullName || userInfo.name || '未填写'}`,
    `- 五格总评：${namingResult.overallScore ?? namingResult.totalScore ?? 'N/A'}`,
    `- 三才配置：${namingResult.sanCai?.result || namingResult.sanCai?.element || 'N/A'}`,
    `- 五行倾向：${namingResult.suggestedElement || namingResult.dayMasterElement || 'N/A'}`
  ].join('\n');

  return {
    nbformat: 4,
    nbformat_minor: 5,
    metadata: {
      kernelspec: {
        display_name: 'ZenBazi Secure Report',
        language: 'markdown',
        name: 'zenbazi-secure'
      },
      language_info: {
        name: 'markdown'
      },
      payload
    },
    cells: [
      {
        cell_type: 'markdown',
        metadata: {},
        source: [
          '# 生命时空密码分析归档\n',
          '\n',
          '## 访问者基本信息\n',
          `${basics}\n`,
          '\n',
          '## 命盘摘要\n',
          `${baziResult.zenMessage || payload.zenMessage || '无'}\n`,
          '\n',
          '## 报告一：生命时空密码解析报告\n',
          `${report}\n`,
          '\n',
          '## 报告二：智能禅语与姓名分析摘要\n',
          `${payload.zenMessage || baziResult.zenMessage || '无'}\n`,
          '\n',
          `${namingSummary}\n`
        ]
      }
    ]
  };
}

async function writeEncryptedNotebook(monthKey, sequence, report, payload) {
  const notebook = buildNotebook(report, payload);
  const body = isPlaintextArchiveMode()
    ? JSON.stringify(notebook, null, 2)
    : encryptString(JSON.stringify(notebook), monthKey);
  const notebookKey = analysisKey(monthKey, sequence);
  await storage.putText(notebookKey, body);
  return notebookKey;
}

async function readDecryptedNotebook(sequence, monthKey = getCurrentMonthKey()) {
  const record = isDatabaseEnabled() ? await getReportRecord(monthKey, sequence) : null;
  const key = record?.notebookKey || analysisKey(monthKey, sequence);
  const body = await storage.getText(key);
  return JSON.parse(isEncryptedEnvelope(body) ? decryptString(body) : body);
}

function decryptRow(row) {
  const number = (field) => decodeArchiveNumber(row[field]);
  return {
    sequence: Number(row.sequence),
    ip: decodeArchiveValue(row.ip),
    plan: decodeArchiveValue(row.plan),
    birthBazi: decodeArchiveValue(row.birth_bazi),
    name: decodeArchiveValue(row.name),
    birthPlace: decodeArchiveValue(row.birth_place),
    gender: decodeArchiveValue(row.gender),
    reportDurationMs: number('report_duration_ms'),
    accuracy: {
      industry: number('accuracy_10_1'),
      role: number('accuracy_10_2'),
      wealth: number('accuracy_10_3'),
      body: number('accuracy_10_4'),
      status: number('accuracy_10_5'),
      time: number('accuracy_10_6'),
      overall: number('accuracy_overall') || number('accuracy_10_6')
    },
    bias: {
      industry: number('bias_11_1'),
      role: number('bias_11_2'),
      wealth: number('bias_11_3'),
      body: number('bias_11_4'),
      status: number('bias_11_5'),
      time: number('bias_11_6'),
      overall: number('bias_overall') || number('bias_11_6')
    },
    mediaSource: decodeArchiveValue(row.media_source),
    couponBalance: number('coupon_balance'),
    sessionId: decodeArchiveValue(row.session_id),
    paymentStatus: row.payment_status ? decodeArchiveValue(row.payment_status) : 'unpaid',
    latestPaymentProvider: row.latest_payment_provider ? decodeArchiveValue(row.latest_payment_provider) : ''
  };
}

function emptyAssessment() {
  return {
    industry: 0,
    role: 0,
    wealth: 0,
    body: 0,
    status: 0,
    time: 0,
    overall: 0
  };
}

function safeDecryptRow(row) {
  try {
    return decryptRow(row);
  } catch (error) {
    return {
      sequence: Number(row.sequence || 0),
      ip: '',
      plan: 'archived',
      birthBazi: '',
      name: '[历史归档记录]',
      birthPlace: '',
      gender: '',
      reportDurationMs: 0,
      accuracy: emptyAssessment(),
      bias: emptyAssessment(),
      mediaSource: 'legacy-archive',
      couponBalance: 0,
      sessionId: `legacy-archive-${Number(row.sequence || 0)}`,
      paymentStatus: 'archived',
      latestPaymentProvider: '',
      decryptError: error.message
    };
  }
}

function decodeWorkbookRows(rows) {
  return rows.map(safeDecryptRow).filter((item) => Number.isFinite(item.sequence) && item.sequence > 0);
}

async function buildAdminMetrics(monthKey = getCurrentMonthKey()) {
  const decrypted = isDatabaseEnabled()
    ? await getUserRecordsByMonth(monthKey)
    : decodeWorkbookRows(await getWorkbookRows(monthKey));

  return {
    monthKey,
    totalRecords: decrypted.length,
    paidUsers: decrypted.filter((item) => item.plan === 'paid').length,
    freeUsers: decrypted.filter((item) => item.plan !== 'paid').length,
    totalCoupons: decrypted.reduce((sum, item) => sum + item.couponBalance, 0),
    averageReportDurationMs: safeAverage(decrypted, (item) => item.reportDurationMs),
    feedbackAccuracy: {
      industry: safeAverage(decrypted, (item) => item.accuracy.industry),
      role: safeAverage(decrypted, (item) => item.accuracy.role),
      wealth: safeAverage(decrypted, (item) => item.accuracy.wealth),
      body: safeAverage(decrypted, (item) => item.accuracy.body),
      status: safeAverage(decrypted, (item) => item.accuracy.status),
      overall: safeAverage(decrypted, (item) => item.accuracy.overall)
    },
    latestRecords: decrypted.sort((a, b) => b.sequence - a.sequence).slice(0, 12).map((item) => ({
      sequence: item.sequence,
      ip: item.ip,
      name: item.name,
      plan: item.plan,
      birthBazi: item.birthBazi,
      birthPlace: item.birthPlace,
      gender: item.gender,
      couponBalance: item.couponBalance,
      mediaSource: item.mediaSource,
      reportDurationMs: item.reportDurationMs,
      accuracyOverall: item.accuracy.overall
    }))
  };
}

async function buildAdminMetricsDebug(monthKey = getCurrentMonthKey()) {
  const key = workbookKey(monthKey);
  const exists = await storage.exists(key);
  const rawRows = exists ? await getWorkbookRows(monthKey) : [];
  const decrypted = decodeWorkbookRows(rawRows);

  return {
    monthKey,
    workbookKey: key,
    workbookExists: exists,
    rawRowCount: rawRows.length,
    decodedRowCount: decrypted.length,
    sampleSequences: rawRows.slice(0, 5).map((row) => Number(row.sequence || 0)),
    metrics: {
      totalRecords: decrypted.length,
      paidUsers: decrypted.filter((item) => item.plan === 'paid').length,
      freeUsers: decrypted.filter((item) => item.plan !== 'paid').length,
      totalCoupons: decrypted.reduce((sum, item) => sum + item.couponBalance, 0),
      averageReportDurationMs: safeAverage(decrypted, (item) => item.reportDurationMs),
      latestRecords: decrypted.sort((a, b) => b.sequence - a.sequence).slice(0, 12)
    }
  };
}

async function processChartJob(job) {
  const { payload, ip, plan } = job;
  const startedAt = Date.now();
  const monthKey = payload.monthKey || getCurrentMonthKey();
  const userInfo = {
    ...payload,
    plan,
    ip,
    monthKey,
    isEnglish: payload.lang === 'en',
    lang: payload.lang || 'zh-CN'
  };
  const baziResult = calculateBaZi(userInfo);
  const fullName = userInfo.name || '';
  const surname = fullName.charAt(0) || '';
  const givenName = fullName.slice(1) || '';
  const namingResult = analyzeNameUnified({
    surname,
    givenName,
    surnameStrokes: parseInt(userInfo.surnameStrokes, 10) || 0,
    givenNameStrokes: parseInt(userInfo.givenNameStrokes, 10) || 0,
    dayMasterElement: baziResult.dayMasterElement,
    language: userInfo.isEnglish ? 'en' : 'zh'
  });
  namingResult.fullName = fullName;
  const sequence = payload.sequence || await getNextSequence(monthKey);
  const sessionId = payload.sessionId || `${sequence}-${Date.now()}`;
  const couponBalance = Number(payload.couponBalance || 0);
  await upsertUserInfoRecord({
    monthKey,
    sequence,
    sessionId,
    ip,
    plan,
    birthBazi: normalizeBirthSummary(userInfo, baziResult),
    name: fullName,
    birthPlace: userInfo.isOverseas ? userInfo.worldCountry : userInfo.chinaAddress,
    gender: userInfo.gender,
    reportDurationMs: Date.now() - startedAt,
    accuracy: {},
    bias: {},
    mediaSource: userInfo.mediaSource || 'organic',
    couponBalance,
    paymentStatus: 'unpaid'
  });
  return {
    monthKey,
    sessionId,
    sequence,
    couponBalance,
    plan,
    baziResult,
    namingResult,
    userInfo: {
      ...userInfo,
      sessionId,
      sequence,
      couponBalance,
      paymentStatus: 'unpaid'
    }
  };
}

async function processReportJob(job) {
  const { payload } = job;
  const startedAt = Date.now();
  const report = await getBaZiAnalysis(payload.userInfo, payload.baziResult, payload.namingResult);
  const monthKey = payload.userInfo.monthKey || getCurrentMonthKey();
  const sequence = payload.userInfo.sequence;
  const sessionId = payload.userInfo.sessionId;
  const notebookKey = await writeEncryptedNotebook(monthKey, sequence, report, {
    monthKey,
    sequence,
    sessionId,
    generatedAt: new Date().toISOString(),
    userInfo: payload.userInfo,
    baziResult: payload.baziResult,
    namingResult: payload.namingResult,
    birthBazi: normalizeBirthSummary(payload.userInfo, payload.baziResult),
    birthPlace: payload.userInfo.isOverseas ? payload.userInfo.worldCountry : payload.userInfo.chinaAddress,
    zenMessage: payload.baziResult?.zenMessage || ''
  });
  await upsertUserInfoRecord({
    monthKey,
    sequence,
    sessionId,
    ip: payload.userInfo.ip || job.ip,
    plan: payload.userInfo.plan || job.plan,
    birthBazi: normalizeBirthSummary(payload.userInfo, payload.baziResult),
    name: payload.userInfo.name,
    birthPlace: payload.userInfo.isOverseas ? payload.userInfo.worldCountry : payload.userInfo.chinaAddress,
    gender: payload.userInfo.gender,
    reportDurationMs: Date.now() - startedAt,
    accuracy: payload.userInfo.accuracy || {},
    bias: payload.userInfo.bias || {},
    mediaSource: payload.userInfo.mediaSource || 'organic',
    couponBalance: payload.userInfo.couponBalance ?? 0,
    paymentStatus: payload.userInfo.paymentStatus || (payload.userInfo.plan === 'paid' ? 'paid' : 'unpaid'),
    latestPaymentProvider: payload.userInfo.latestPaymentProvider || '',
    phone: payload.userInfo.phone,
    email: payload.userInfo.email
  });
  if (isDatabaseEnabled()) {
    await upsertReportRecord({
      monthKey,
      sequence,
      sessionId,
      reportTitle: '生命时空密码解析报告',
      zenTitle: '智能禅语与姓名分析摘要',
      report,
      zenMessage: payload.baziResult?.zenMessage || '',
      notebookKey
    });
  }
  return { report };
}

async function processFeedbackJob(job) {
  const { payload } = job;
  const couponBalance = Number(payload.couponBalance || 0) + 10;
  const dimensions = payload.dimensions || {};
  const ratedValues = Object.values(dimensions).map((item) => Number(item || 0)).filter((item) => Number.isFinite(item));
  const accuracy = {
    industry: Number(dimensions.industry ?? 0),
    role: Number(dimensions.role ?? 0),
    wealth: Number(dimensions.wealth ?? 0),
    body: Number(dimensions.body ?? 0),
    status: Number(dimensions.status ?? 0),
    time: Number(dimensions.time ?? 0),
    overall: Math.round(ratedValues.reduce((sum, item) => sum + item, 0) / Math.max(ratedValues.length, 1))
  };
  const bias = {
    industry: 100 - accuracy.industry,
    role: 100 - accuracy.role,
    wealth: 100 - accuracy.wealth,
    body: 100 - accuracy.body,
    status: 100 - accuracy.status,
    time: 100 - accuracy.time,
    overall: 100 - accuracy.overall
  };
  await upsertUserInfoRecord({
    monthKey: payload.monthKey || getCurrentMonthKey(),
    sequence: payload.sequence,
    sessionId: payload.sessionId,
    ip: payload.ip || job.ip,
    plan: payload.plan || job.plan,
    birthBazi: payload.birthBazi,
    name: payload.name,
    birthPlace: payload.birthPlace,
    gender: payload.gender,
    reportDurationMs: payload.reportDurationMs || 0,
    accuracy,
    bias,
    mediaSource: payload.mediaSource || 'organic',
    couponBalance,
    paymentStatus: payload.paymentStatus || (payload.plan === 'paid' ? 'paid' : 'unpaid'),
    latestPaymentProvider: payload.latestPaymentProvider || ''
  });
  return { couponBalance, accuracy, bias };
}

async function processTranslateJob(job) {
  const { payload } = job;
  const texts = payload.texts || {};
  const translated = {};

  for (const [key, value] of Object.entries(texts)) {
    const content = String(value || '');
    translated[key] = payload.targetLang === 'en'
      ? await enforceEnglishTranslationGate(content)
      : content;
  }

  return {
    targetLang: payload.targetLang || 'en',
    texts: translated
  };
}

async function processJob(job) {
  if (job.type === 'chart') return processChartJob(job);
  if (job.type === 'report') return processReportJob(job);
  if (job.type === 'feedback') return processFeedbackJob(job);
  if (job.type === 'translate') return processTranslateJob(job);
  throw new Error(`Unknown job type: ${job.type}`);
}

function extractBearerToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : '';
}

function requireAdmin(req) {
  if (isDevMode() || isLocalRequest(req)) {
    return { sub: 'local-dev-admin', role: 'admin', bypass: true };
  }
  const token = extractBearerToken(req);
  if (!token) {
    throw new Error('Unauthorized');
  }
  return verifyAdminToken(token);
}

async function enqueueJob(type, payload, req) {
  const ip = getClientIp(req);
  const plan = payload.plan || 'free';
  const limit = await applyRateLimit(ip, plan);
  if (limit.blocked) {
    throw new Error(limit.message);
  }

  const job = createJobRecord(type, payload, {
    ip,
    plan,
    bufferZone: estimateBufferZone(payload)
  });
  const stored = await queueDriver.enqueue(job);
  pushJobUpdate(stored.id, { status: 'queued', position: 1, bufferZone: stored.bufferZone });
  await queueDriver.start(processJob, pushJobUpdate);
  return stored;
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    sendJson(res, 200, { ok: true });
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    const paymentRoute = matchPaymentRoute(req.method, url.pathname);
    if (paymentRoute?.action === 'config') {
      sendJson(res, 200, paymentService.getConfigStatus());
      return;
    }
    if (paymentRoute?.action === 'create') {
      const payload = await readJsonBody(req);
      sendJson(res, 201, await paymentService.createOrder(payload));
      return;
    }
    if (paymentRoute?.action === 'status') {
      sendJson(res, 200, await paymentService.getOrder({
        orderId: paymentRoute.orderId,
        token: url.searchParams.get('token')
      }));
      return;
    }
    if (paymentRoute?.action === 'notify') {
      const rawBody = await readBoundedBody(req);
      if (paymentRoute.provider === 'wechat') {
        await paymentService.handleNotification('wechat', { headers: req.headers, body: rawBody });
        sendJson(res, 200, { code: 'SUCCESS', message: '成功' });
      } else {
        await paymentService.handleNotification('alipay', { params: parseFormBody(rawBody), body: rawBody });
        sendText(res, 200, 'success');
      }
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/jobs/chart') {
      const payload = await readJsonBody(req);
      const job = await enqueueJob('chart', payload, req);
      sendJson(res, 202, { jobId: job.id, status: job.status, bufferZone: job.bufferZone });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/jobs/report') {
      const payload = await readJsonBody(req);
      const job = await enqueueJob('report', payload, req);
      sendJson(res, 202, { jobId: job.id, status: job.status, bufferZone: job.bufferZone });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/jobs/feedback') {
      const payload = await readJsonBody(req);
      const job = await enqueueJob('feedback', payload, req);
      sendJson(res, 202, { jobId: job.id, status: job.status, bufferZone: job.bufferZone });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/jobs/payment') {
      sendJson(res, 410, {
        error: 'The simulated payment endpoint has been disabled. Use /api/payments/orders.'
      });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/jobs/translate') {
      const payload = await readJsonBody(req);
      const job = await enqueueJob('translate', payload, req);
      sendJson(res, 202, { jobId: job.id, status: job.status, bufferZone: job.bufferZone });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/personalized/order') {
      const payload = await readJsonBody(req);
      const { email, phone, amount = 2000, currency = 'CNY', lang = 'zh-CN' } = payload;
      const orderId = `PS-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const order = { orderId, email, phone, amount, currency, lang, createdAt: new Date().toISOString(), status: 'manual-confirm' };

      // 持久化订单到本地文件（数据库禁用时也可用）
      try {
        const dataDir = path.join(os.tmpdir(), 'zenbazi-personalized');
        fs.mkdirSync(dataDir, { recursive: true });
        const file = path.join(dataDir, 'orders.json');
        let list = [];
        if (fs.existsSync(file)) {
          list = JSON.parse(fs.readFileSync(file, 'utf8') || '[]');
        }
        list.push(order);
        fs.writeFileSync(file, JSON.stringify(list, null, 2));
      } catch (e) {
        console.error('订单持久化失败:', e.message);
      }
      console.log('📦 个性化服务订单:', JSON.stringify(order));

      // 触动程序：尝试发送邮件 + 短信（均优雅降级）
      const subject = lang === 'en' ? 'Payment Received — Life Space-Time Code' : '资金已收到 — 生命时空密码';
      const mailText = lang === 'en'
        ? `We have received your payment (¥${amount}). Please reply to this email with your detailed situation (birth info / question), and we will process it as soon as possible. Order: ${orderId}`
        : `我们已收到您的付款（¥${amount}）。请您将详细情况（出生信息/咨询问题）回复至本邮箱，我们将尽快为您处理。订单号：${orderId}`;
      const mailHtml = `<div style="font-family:sans-serif;line-height:1.7"><p>${lang === 'en' ? 'We have received your payment' : '我们已收到您的付款'}（<b>¥${amount}</b>）。</p><p>${lang === 'en' ? 'Please reply to this email with your detailed situation (birth info / question), and we will process it as soon as possible.' : '请您将详细情况（出生信息/咨询问题）回复至本邮箱，我们将尽快为您处理。'}</p><p>${lang === 'en' ? 'Order' : '订单号'}：${orderId}</p></div>`;

      const mailResult = email
        ? await sendMail({ to: email, subject, text: mailText, html: mailHtml })
        : { success: false, message: '未提供邮箱' };

      // 短信使用独立支付确认模板（env ALIYUN_SMS_PAYMENT_TEMPLATE_CODE），未配置则跳过
      const paymentTpl = process.env.ALIYUN_SMS_PAYMENT_TEMPLATE_CODE;
      const smsResult = phone && paymentTpl
        ? await sendSms(phone, { amount: String(amount), email: 'btswws@163.com' }, paymentTpl)
        : { success: false, message: phone ? '支付确认短信模板未配置（ALIYUN_SMS_PAYMENT_TEMPLATE_CODE）' : '未提供电话' };

      sendJson(res, 200, { success: true, orderId, email: mailResult, sms: smsResult });
      return;
    }

    if (req.method === 'GET' && url.pathname.startsWith('/api/jobs/')) {
      const jobId = url.pathname.split('/').pop();
      const job = await queueDriver.getJob(jobId);
      if (!job) {
        sendJson(res, 404, { error: 'Job not found' });
        return;
      }
      sendJson(res, 200, {
        jobId: job.id,
        status: job.status,
        result: job.result,
        error: job.error,
        bufferZone: job.bufferZone
      });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/admin/login') {
      const payload = await readJsonBody(req);
      if (isDevMode()) {
        sendJson(res, 200, { token: signAdminToken(payload.username || 'local-dev-admin'), bypass: true });
        return;
      }
      const ok = verifyAdminCredentials(payload.username, payload.password);
      if (!ok) {
        sendJson(res, 401, { error: 'Invalid admin credentials' });
        return;
      }
      sendJson(res, 200, { token: signAdminToken(payload.username) });
      return;
    }

    const adminRoute = matchAdminRoute(req.method, url.pathname);
    if (adminRoute) {
      const admin = requireAdmin(req);
      if (adminRoute.action === 'overview') {
        sendJson(res, 200, await adminService.getOverview(url.searchParams));
        return;
      }
      if (adminRoute.action === 'users') {
        sendJson(res, 200, await adminService.listUsers(url.searchParams));
        return;
      }
      if (adminRoute.action === 'user') {
        sendJson(res, 200, await adminService.getUser(adminRoute.id));
        return;
      }
      if (adminRoute.action === 'payments') {
        sendJson(res, 200, await adminService.listPayments(url.searchParams));
        return;
      }
      if (adminRoute.action === 'payment') {
        sendJson(res, 200, await adminService.getPayment(adminRoute.id));
        return;
      }
      if (adminRoute.action === 'reports') {
        sendJson(res, 200, await adminService.listReports(url.searchParams));
        return;
      }
      if (adminRoute.action === 'report') {
        const report = await adminService.getReport(adminRoute.id);
        await createDecryptAuditLog({
          targetType: 'report_record',
          targetKey: report.id,
          monthKey: report.monthKey,
          operatorName: admin.sub || 'admin',
          dynamicInstruction: getDynamicInstruction(report.monthKey)
        });
        sendJson(res, 200, report);
        return;
      }
    }

    if (req.method === 'GET' && url.pathname === '/api/admin/metrics') {
      if (!isDevMode()) {
        requireAdmin(req);
      }
      const monthKey = url.searchParams.get('month') || getCurrentMonthKey();
      sendJson(res, 200, await buildAdminMetrics(monthKey));
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/dev/admin-metrics' && isDevMode() && isLocalRequest(req)) {
      const monthKey = url.searchParams.get('month') || getCurrentMonthKey();
      try {
        sendJson(res, 200, await buildAdminMetricsDebug(monthKey));
      } catch (error) {
        sendJson(res, 200, { monthKey, error: error.message, stack: String(error.stack || '') });
      }
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/admin/decrypt') {
      const admin = isDevMode() ? { sub: 'local-dev-admin', role: 'admin', bypass: true } : requireAdmin(req);
      const payload = await readJsonBody(req);
      const monthKey = payload.monthKey || getCurrentMonthKey();
      const notebook = await readDecryptedNotebook(payload.sequence, monthKey);
      if (isDatabaseEnabled()) {
        await createDecryptAuditLog({
          targetType: 'report_notebook',
          targetKey: `${monthKey}/${payload.sequence}`,
          monthKey,
          operatorName: admin.sub || 'admin',
          dynamicInstruction: getDynamicInstruction(monthKey)
        });
      }
      sendJson(res, 200, { sequence: payload.sequence, monthKey, notebook, dynamicInstruction: getDynamicInstruction(monthKey) });
      return;
    }

    if (req.method === 'GET' && url.pathname === '/api/system/meta') {
      sendJson(res, 200, {
        platformMatrix: ['Android', 'iOS', 'iPadOS', 'KaiOS', 'HarmonyOS Next', 'HyperOS', 'BlueOS', 'Pantanal', 'Windows 10', 'Windows 11', 'Windows 12'],
        socketMode: 'mirror-readonly',
        workerCount: WORKER_COUNT,
        fifo: true,
        databaseDriver: isDatabaseEnabled() ? 'postgresql' : 'disabled',
        queueDriver: process.env.REDIS_URL ? 'redis' : 'memory',
        storageDriver: process.env.STORAGE_DRIVER === 'oss' ? 'oss' : (process.env.STORAGE_DRIVER === 's3' ? 's3' : 'local-encrypted'),
        sourceMapInProduction: false
      });
      return;
    }

    // 获取并递增用户计数器
    if (req.method === 'GET' && url.pathname === '/api/user/count') {
      userAnalysisCount++;
      sendJson(res, 200, { count: userAnalysisCount });
      return;
    }

    if (req.method === 'POST' && url.pathname === '/api/report/generate') {
      const payload = await readJsonBody(req);
      console.log('📝 收到报告生成请求:', {
        sequence: payload.userInfo?.sequence,
        name: payload.userInfo?.name,
        phone: payload.phone
      });

      const createdAt = new Date().toISOString();
      const html = generateHtmlReport(payload, payload.lang || 'zh-CN');

      const monthKey = payload.userInfo?.monthKey || getCurrentMonthKey();
      const sequence = payload.userInfo?.sequence || Date.now();
      const reportKey = `reports/${monthKey}/${sequence}-report.html`;

      await storage.putText(reportKey, html);
      if (isDatabaseEnabled()) {
        await updateUserContact(payload.userInfo?.sessionId || payload.sessionId, {
          phone: payload.phone,
          email: payload.email
        });
      }
      console.log('✅ HTML报告已保存:', reportKey);

      let signedUrl = null;
      if (process.env.STORAGE_DRIVER === 'oss' && typeof storage.getSignedUrl === 'function') {
        try {
          signedUrl = await storage.getSignedUrl(reportKey, 604800);
          console.log('🔗 签名URL生成成功');
        } catch (ossError) {
          console.warn('⚠️ OSS签名URL生成失败，将使用本地模式:', ossError.message);
        }
      }

      let smsResult = null;
      if (payload.phone && signedUrl && isSmsEnabled()) {
        try {
          smsResult = await sendSms(payload.phone, { url: signedUrl });
        } catch (smsError) {
          console.warn('⚠️ 短信发送失败:', smsError.message);
          smsResult = { success: false, message: smsError.message };
        }
      }

      sendJson(res, 200, {
        success: true,
        reportKey,
        signedUrl,
        createdAt,
        phone: payload.phone || null,
        smsSent: smsResult?.success || false,
        smsMessage: smsResult?.message,
        message: signedUrl ? '报告已生成，签名链接已返回' : '报告已保存'
      });
      return;
    }

    sendJson(res, 404, { error: 'Not found' });
  } catch (error) {
    const status = Number(error.status) || (error.message === RATE_LIMIT_MESSAGE ? 429 : error.message === 'Unauthorized' ? 401 : 500);
    sendJson(res, status, { error: error.message, code: error.code || 'INTERNAL_ERROR' });
  }
});

const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (socket) => {
  socket.on('message', async (message) => {
    try {
      const payload = JSON.parse(message.toString());
      if (payload.type !== 'subscribe' || !payload.jobId) return;
      const current = clients.get(payload.jobId) || new Set();
      current.add(socket);
      clients.set(payload.jobId, current);
      const job = await queueDriver.getJob(payload.jobId);
      if (job) {
        socket.send(JSON.stringify({
          jobId: payload.jobId,
          status: job.status,
          result: job.result,
          error: job.error,
          bufferZone: job.bufferZone
        }));
      }
      socket.on('close', () => {
        const group = clients.get(payload.jobId);
        if (!group) return;
        group.delete(socket);
        if (!group.size) clients.delete(payload.jobId);
      });
    } catch {
      socket.close();
    }
  });
});

server.on('upgrade', (req, socket, head) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname !== '/ws') {
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  });
});

await ensureDatabase();
await storage.ensure();
await queueDriver.start(processJob, pushJobUpdate);
server.listen(PORT, () => {
  process.stdout.write(`ZenBazi cloud brain listening on http://localhost:${PORT}\n`);
  process.stdout.write(`Database mode: ${isDatabaseEnabled() ? 'postgresql' : 'disabled'}\n`);
  process.stdout.write(`Dynamic admin instruction for ${getCurrentMonthKey()}: ${getDynamicInstruction(getCurrentMonthKey())}\n`);
});
