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
