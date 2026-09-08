# ZenBazi (禅意八字)

一个基于 React + Tailwind CSS 的极简主义八字排盘 Web 应用。

## 功能

- **Japandi 风格界面**：融合日式极简与北欧设计的视觉体验。
- **八字排盘**：输入出生信息，自动计算年柱、月柱、日柱、时柱。
- **响应式设计**：适配各种设备屏幕。

## 技术栈

- React
- Tailwind CSS
- lunar-javascript (排盘核心库)
- lucide-react (图标库)
- Vite

## 快速开始

请确保您的环境中已安装 [Node.js](https://nodejs.org/) (推荐 v18+)。

1.  **安装依赖**

    ```bash
    npm install
    ```

2.  **启动开发服务器**

    ```bash
    npm run dev
    ```

    同时另开一个终端启动本地后端：

    ```bash
    npm run server
    ```

3.  **打开应用**

    在浏览器中访问终端显示的地址（通常是 `http://localhost:5173`）。

## 构建

构建生产环境版本：

```bash
npm run build
```

## 云端一致调试

### 1. 环境变量文件

项目后端现在会按以下顺序读取配置：

1.  Cloud Toolkit 或系统环境变量
2.  项目根目录 `.env.local`
3.  项目根目录 `.env`

可先复制模板：

```bash
copy .env.example .env.local
```

然后按你的云资源填写。

### 2. 当前项目需要的云资源

- **PostgreSQL**：作为用户记录、报告元数据、支付订单的主数据库
- **Redis**：用于任务队列，与线上队列模式对齐
- **对象存储**：当前代码使用 S3 协议客户端访问对象存储
- **AI 密钥**：用于八字深度报告与英文翻译
- **管理后台口令**：用于 `/api/admin/*` 接口
- **支付商户密钥**：用于微信支付、支付宝、Stripe、PayPal

### 3. 关键环境变量

- `DATABASE_URL`：PostgreSQL 连接串

## 微信支付与支付宝直连

后端提供以下支付接口：

- `GET /api/payments/config`：检查数据库及支付渠道是否完成配置（不返回密钥）
- `POST /api/payments/orders`：创建微信 Native 或支付宝扫码订单
- `GET /api/payments/orders/:orderId?token=...`：安全查询并同步订单状态
- `POST /api/payments/wechat/notify`：微信支付 API v3 回调
- `POST /api/payments/alipay/notify`：支付宝异步通知

生产环境必须先配置 PostgreSQL、`PAYMENT_CALLBACK_BASE_URL` 和 `PAYMENT_TOKEN_SECRET`。微信还需要 APPID、商户号、API v3 密钥、商户私钥、商户证书序列号、微信支付公钥及对应公钥 ID；支付宝需要应用 ID、支付宝商户 UID、应用私钥及支付宝公钥。完整变量名见 `.env.example`。

旧接口 `POST /api/jobs/payment` 不再模拟支付成功。只有通过微信或支付宝签名验证，并且商户号、应用 ID、订单号、币种和金额与数据库订单完全一致时，后端才会将订单设为已支付并解锁权益。密钥只应写入服务器 `.env.local`，不得提交到 Git。
- `PGHOST` / `PGPORT` / `PGDATABASE` / `PGUSER` / `PGPASSWORD`
- `REDIS_URL`：云 Redis 连接串
- `REDIS_QUEUE_NAME`：队列名称
- `STORAGE_DRIVER`：`local` 或 `s3`
- `S3_BUCKET` / `S3_ENDPOINT` / `S3_REGION`
- `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY`
- `DEEPSEEK_API_KEY`
- `ZENBAZI_ADMIN_SECRET`
- `ZENBAZI_ADMIN_JWT_SECRET`
- `ZENBAZI_ADMIN_USER`
- `ZENBAZI_ADMIN_PASSWORD`
- `WECHAT_PAY_*`
- `ALIPAY_*`
- `STRIPE_*`
- `PAYPAL_*`

### 4. Cloud Toolkit 接入建议

如果你要做“端云互联”，建议按下面顺序准备：

1.  在 IDE 中配置阿里云账号和目标云资源访问权限
2.  先连通 PostgreSQL，再验证 Redis，再验证对象存储
3.  补 AI 密钥和支付商户密钥
4.  保持前端继续本地运行，只让后端读取云资源配置
5.  优先通过环境变量注入密钥，不要把真实密钥写进仓库

### 5. 注意事项

- 当前对象存储层使用的是 **S3 协议客户端**，如果你要直接接阿里云 OSS，需要确认你的接入方式是否提供 S3 兼容能力；否则需要额外做 OSS 适配。
- 后端启动时会自动尝试初始化 PostgreSQL 表结构；未配置数据库时会退回文件模式。
- 当前支付链路已经有数据库订单模型，但第三方支付网关仍需要你提供真实商户参数后再完成正式联调。
- 不配置 `REDIS_URL` 时，项目会退回本地内存队列。
- 不配置 `STORAGE_DRIVER=s3` 时，项目会继续使用本地加密存储目录 `cloud/`。
