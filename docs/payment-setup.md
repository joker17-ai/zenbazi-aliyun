# 统一收银台配置

网站只显示微信和支付宝。电脑使用订单二维码；手机浏览器使用微信 H5 / 支付宝手机网站支付；微信内使用公众号 JSAPI，支付宝提示到外部浏览器打开。

## 填写一个文件

复制 `deploy/payment.env.example` 为 `payment.env`，填写真实值，上传到服务器 `/opt/zenbazi/payment.env`。不要覆盖数据库配置或原来的 `.env.local`。该文件不可提交 GitHub。上传后执行 `chmod 600 /opt/zenbazi/payment.env` 和 `systemctl restart zenbazi` 才会加载。

私钥、公钥以 PEM 格式填写一整行，用字面的 `\n` 表示换行。微信 API v3 密钥为 32 字节；序列号是商户证书序列号；支付公钥 ID 与微信支付公钥必须匹配。公众号 AppSecret 不是 API v3 密钥。

## 平台端设置

- 微信：开通 Native、H5、JSAPI，将公众号 AppID 与商户号关联。公众号需要网页授权能力。
- 微信 H5 支付域名：`yuandestiny.cn`。
- 公众号网页授权域名：`yuandestiny.cn`；按平台要求上传校验文件。
- JSAPI 支付授权目录：`https://yuandestiny.cn/`。
- 微信回调：`https://yuandestiny.cn/api/payments/wechat/notify`。
- 公众号授权回调由服务端使用：`https://yuandestiny.cn/api/payments/wechat/callback`。
- 支付宝：开通当面付扫码与手机网站支付，配置应用公钥；服务端填写应用私钥和支付宝公钥。
- 支付宝异步通知：`https://yuandestiny.cn/api/payments/alipay/notify`。
- 两种支付返回首页：`https://yuandestiny.cn/?checkout=resume`。

当前统一商品价为 68 元人民币，优惠以服务端计算为准。浏览器保存订单凭证用于本机恢复，保留七天；清理浏览器数据或换设备不会自动恢复订单。

## 上线验收

代码测试不代表商户开通成功。填写配置后，需要分别在电脑、手机浏览器、真实微信内确认下单与签名、支付取消、支付成功后自动开报告，以及后台的订单和报告关联。未经实际商户验收，不得宣称已可正式收款。支付完成状态只认签名通知或服务端查单，不认跳转返回或浏览器按钮。
