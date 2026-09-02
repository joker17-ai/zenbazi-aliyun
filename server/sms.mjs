// 阿里云短信服务模块
import crypto from 'crypto';
import { URLSearchParams } from 'url';

const isSmsEnabled = () => {
  return !!(
    process.env.ALIYUN_ACCESS_KEY_ID &&
    process.env.ALIYUN_ACCESS_KEY_SECRET &&
    process.env.ALIYUN_SMS_SIGN_NAME &&
    process.env.ALIYUN_SMS_TEMPLATE_CODE
  );
};

// 阿里云短信API签名
function generateSignature(params, accessKeySecret) {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
  
  const stringToSign = `GET&%2F&${encodeURIComponent(sortedParams)}`;
  const hmac = crypto.createHmac('sha1', `${accessKeySecret}&`);
  hmac.update(stringToSign);
  return hmac.digest('base64');
}

// 发送短信。templateCodeOverride 可指定其它已审核模板（如支付确认模板）
async function sendSms(phoneNumber, templateParam, templateCodeOverride) {
  const templateCode = templateCodeOverride || process.env.ALIYUN_SMS_TEMPLATE_CODE;
  if (!isSmsEnabled() || !templateCode) {
    console.warn('⚠️  阿里云短信服务未配置，跳过短信发送');
    return { success: false, message: '短信服务未配置' };
  }

  const accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID;
  const accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET;
  const signName = process.env.ALIYUN_SMS_SIGN_NAME;

  const params = {
    Action: 'SendSms',
    Version: '2017-05-25',
    PhoneNumbers: phoneNumber,
    SignName: signName,
    TemplateCode: templateCode,
    TemplateParam: JSON.stringify(templateParam),
    Format: 'JSON',
    SignatureMethod: 'HMAC-SHA1',
    SignatureVersion: '1.0',
    SignatureNonce: crypto.randomUUID(),
    Timestamp: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
    AccessKeyId: accessKeyId,
  };

  params.Signature = generateSignature(params, accessKeySecret);

  try {
    const url = `https://dysmsapi.aliyuncs.com/?${new URLSearchParams(params).toString()}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();
    
    if (result.Code === 'OK') {
      console.log(`✅ 短信发送成功: ${phoneNumber}`);
      return { success: true, message: '短信发送成功', requestId: result.RequestId };
    } else {
      console.error(`❌ 短信发送失败: ${result.Code} - ${result.Message}`);
      return { success: false, message: result.Message, code: result.Code };
    }
  } catch (error) {
    console.error('❌ 短信发送异常:', error.message);
    return { success: false, message: error.message };
  }
}

export {
  isSmsEnabled,
  sendSms,
};
