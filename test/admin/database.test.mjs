import test from 'node:test';
import assert from 'node:assert/strict';
import {
  mapAdminPaymentRow,
  mapAdminReportRow,
  mapAdminUserRow,
  normalizeContact
} from '../../server/database.mjs';
import { encryptString } from '../../server/security.mjs';

function encrypted(value) {
  return encryptString(value, '202609');
}

test('admin user rows expose decrypted business fields without payment secrets', () => {
  const user = mapAdminUserRow({
    id: 'user-1',
    month_key: '202609',
    sequence: 7,
    session_id: 'session-1',
    ip_cipher: encrypted('127.0.0.1'),
    plan: 'paid',
    birth_bazi_cipher: encrypted('甲子 乙丑'),
    name_cipher: encrypted('张三'),
    birth_place_cipher: encrypted('北京'),
    gender_cipher: encrypted('男'),
    phone_cipher: encrypted('13800138000'),
    email_cipher: encrypted('USER@example.com'),
    payment_status: 'paid',
    latest_payment_provider: 'wechat',
    coupon_balance: 2,
    report_id: 'report-1',
    created_at: new Date('2026-09-01T00:00:00Z'),
    updated_at: new Date('2026-09-02T00:00:00Z')
  });
  assert.equal(user.name, '张三');
  assert.equal(user.phone, '13800138000');
  assert.equal(user.email, 'USER@example.com');
  assert.equal(user.paymentStatus, 'paid');
  assert.equal(user.reportId, 'report-1');
  assert.equal(Object.hasOwn(user, 'requestPayload'), false);
});

test('admin payment rows include user and report linkage without encrypted payloads', () => {
  const order = mapAdminPaymentRow({
    id: 'ZB1',
    month_key: '202609',
    sequence: 7,
    session_id: 'session-1',
    provider: 'alipay',
    status: 'paid',
    currency: 'CNY',
    amount_minor: 6800,
    coupon_used_minor: 0,
    payable_minor: 6800,
    gateway_order_no: 'ALI-1',
    user_id: 'user-1',
    user_name_cipher: encrypted('张三'),
    report_id: 'report-1',
    created_at: new Date('2026-09-01T00:00:00Z'),
    paid_at: new Date('2026-09-01T00:01:00Z'),
    updated_at: new Date('2026-09-01T00:01:00Z')
  });
  assert.equal(order.userName, '张三');
  assert.equal(order.reportId, 'report-1');
  assert.equal(order.payableMinor, 6800);
  assert.equal(Object.hasOwn(order, 'requestCipher'), false);
  assert.equal(Object.hasOwn(order, 'responsePayload'), false);
});

test('admin report rows return readable generated content', () => {
  const report = mapAdminReportRow({
    id: 'report-1',
    month_key: '202609',
    sequence: 7,
    session_id: 'session-1',
    report_title: '生命报告',
    zen_title: '今日禅语',
    report_cipher: encrypted('完整报告正文'),
    zen_cipher: encrypted('保持清醒'),
    generation_status: 'generated',
    generation_error: null,
    user_id: 'user-1',
    user_name_cipher: encrypted('张三'),
    payment_status: 'paid',
    payment_order_id: 'ZB1',
    created_at: new Date('2026-09-01T00:02:00Z'),
    updated_at: new Date('2026-09-01T00:02:00Z')
  });
  assert.equal(report.userName, '张三');
  assert.equal(report.report, '完整报告正文');
  assert.equal(report.zenMessage, '保持清醒');
  assert.equal(report.paymentOrderId, 'ZB1');
});

test('contact normalization supports exact hashed search', () => {
  assert.deepEqual(normalizeContact({ phone: ' 138-0013-8000 ', email: ' USER@Example.COM ' }), {
    phone: '13800138000',
    email: 'user@example.com'
  });
});
