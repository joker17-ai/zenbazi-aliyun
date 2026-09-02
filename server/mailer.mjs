import nodemailer from 'nodemailer';

const isMailEnabled = () => {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
};

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 465,
    secure: (Number(process.env.SMTP_PORT) || 465) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transporter;
}

async function sendMail({ to, subject, text, html }) {
  if (!isMailEnabled()) {
    console.warn('⚠️  邮件服务未配置（SMTP_HOST/PORT/USER/PASS），跳过邮件发送');
    return { success: false, message: '邮件服务未配置' };
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  try {
    const info = await getTransporter().sendMail({ from, to, subject, text, html });
    console.log(`✅ 邮件发送成功: ${to} (messageId=${info.messageId})`);
    return { success: true, message: '邮件发送成功', messageId: info.messageId };
  } catch (error) {
    console.error('❌ 邮件发送失败:', error.message);
    return { success: false, message: error.message };
  }
}

export { isMailEnabled, sendMail };
