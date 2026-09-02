# Cloud Toolkit 云端一致调试清单

## 目标

让本地 `Vite + Node` 调试环境尽量贴近线上运行方式：

- 前端继续本地运行
- 后端继续本地运行
- 队列切到云 Redis
- 存储切到云对象存储
- AI 与后台口令使用云环境密钥

## 本项目当前云依赖映射

### 1. PostgreSQL 主数据库

- 代码位置：`server/database.mjs`
- 用途：用户记录、报告元数据、支付订单、支付回调、解密审计、访问限流日志
- 默认模式：未配置时禁用，继续使用文件归档

推荐准备：

- PostgreSQL 连接串
- 数据库账号
- SSL 策略
- 连接池上限

示例：

```env
DATABASE_URL=postgresql://postgres:password@db-host:5432/zenbazi
PGSSL=true
PGPOOL_MAX=10
```

### 2. 任务队列

- 代码位置：`server/queue.mjs`
- 默认模式：本地内存队列
- 云端一致模式：配置 `REDIS_URL`

推荐准备：

- Redis 实例地址
- Redis 端口
- Redis 密码
- 白名单 / 安全组

示例：

```env
REDIS_URL=redis://:password@redis-host:6379/0
REDIS_QUEUE_NAME=zenbazi
```

### 3. 对象存储

- 代码位置：`server/storage.mjs`
- 默认模式：本地 `cloud/` 目录
- 云端一致模式：配置 `STORAGE_DRIVER=s3`

推荐准备：

- Bucket 名称
- Endpoint
- Region
- AccessKeyId
- AccessKeySecret
- Prefix

示例：

```env
STORAGE_DRIVER=s3
S3_BUCKET=your-bucket
S3_PREFIX=zenbazi-secure
S3_REGION=auto
S3_ENDPOINT=https://your-s3-compatible-endpoint
S3_FORCE_PATH_STYLE=false
S3_ACCESS_KEY_ID=your-access-key-id
S3_SECRET_ACCESS_KEY=your-access-key-secret
```

说明：

- 当前代码使用 S3 客户端协议访问对象存储
- 如果你使用阿里云 OSS，需要确认你的接入链路是否提供 S3 兼容能力

### 4. AI 服务

- 代码位置：`src/utils/ai.js`
- 用途：深度报告、英文翻译

示例：

```env
DEEPSEEK_API_KEY=your-deepseek-api-key
```

### 5. 管理后台

- 代码位置：`server/security.mjs`
- 用途：后台登录、数据解密、令牌签名

示例：

```env
ZENBAZI_ADMIN_SECRET=replace-with-a-long-random-secret
ZENBAZI_ADMIN_JWT_SECRET=replace-with-a-second-long-random-secret
ZENBAZI_ADMIN_USER=admin
ZENBAZI_ADMIN_PASSWORD=change-me
```

### 6. 支付网关

- 代码位置：`server/server.mjs`
- 当前状态：已补数据库订单模型与回调记录模型
- 正式上线前仍需配置真实商户密钥

示例：

```env
WECHAT_PAY_APP_ID=
WECHAT_PAY_MCH_ID=
WECHAT_PAY_API_V3_KEY=
WECHAT_PAY_PRIVATE_KEY=
WECHAT_PAY_SERIAL_NO=

ALIPAY_APP_ID=
ALIPAY_PRIVATE_KEY=
ALIPAY_PUBLIC_KEY=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_WEBHOOK_ID=
```

## Cloud Toolkit 配置建议

### 1. AccessKey

建议准备一个最小权限的 RAM 子账号，只授予：

- Redis 访问所需权限
- 对象存储访问所需权限
- PostgreSQL 访问权限
- 必要的 ECS / 端云互联权限

不要使用主账号长期调试。

### 2. 网络

需要确认：

- 你的本地机器或 IDE 代理链路能访问云 Redis
- 对象存储 Endpoint 可从本地访问
- 若 Redis 只开放 VPC，需要通过 Cloud Toolkit、SSH 隧道或跳板机转发

### 3. 环境变量注入策略

推荐优先级：

1. Cloud Toolkit 注入 IDE 运行配置
2. 本地 `.env.local`
3. 仓库内 `.env.example` 仅做模板

## 本地启动命令

```bash
npm run server
```

```bash
npm run dev
```

## 验证顺序

1. 访问 `http://127.0.0.1:8787/api/system/meta`
2. 确认 `databaseDriver` 是否从 `disabled` 变成 `postgresql`
3. 确认 `queueDriver` 是否从 `memory` 变成 `redis`
4. 确认 `storageDriver` 是否从 `local-encrypted` 变成 `s3`
5. 在前端提交一次排盘，检查任务是否成功完成
6. 再验证管理员接口、AI 报告能力和支付订单落库

## 当前已完成的项目侧准备

- 后端已支持自动读取 `.env` / `.env.local`
- 后端已支持 PostgreSQL 自动建表与数据入口加密
- 已提供 `.env.example`
- 已将 `.env*` 加入忽略规则，避免真实密钥提交到仓库
