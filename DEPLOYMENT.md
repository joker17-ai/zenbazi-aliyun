# ZenBazi 部署指南
**日期**: 2026-05-31
**目标**: 将程序部署到阿里云服务器，通过 yuandestiny.com 访问

---

## 📋 部署架构

```
用户浏览器 → https://yuandestiny.com → 阿里云服务器 (ECS)
                                      ↓
                              程序运行 + 数据存储
                              (在同一台服务器)
```

---

## ✅ 前置条件

### 1. 阿里云服务器
- 类型: 轻量应用服务器 或 ECS
- 操作系统: Ubuntu 20.04+ 或 CentOS 7+
- 规格建议: 2核4G 起步

### 2. 域名
- 域名: yuandestiny.com
- 需要已备案（如果服务器在中国大陆）

### 3. 本地文件准备
- 完整的项目代码 (d:\ZenBazi)
- 已构建的前端文件 (dist 目录)

---

## 🚀 部署步骤

### 步骤 1: 准备阿里云服务器

1. **购买或登录阿里云服务器**
   - 访问: https://ecs.console.aliyun.com/
   - 记录服务器的 IP 地址

2. **连接服务器** (使用 SSH)
   - Windows: 使用 PuTTY 或 PowerShell
   - Mac/Linux: 使用终端
   ```bash
   ssh root@您的服务器IP
   ```

3. **安装必要软件**
   ```bash
   # 更新系统
   apt update && apt upgrade -y
   
   # 安装 Node.js (v18+)
   curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
   apt install -y nodejs
   
   # 安装 Nginx (反向代理)
   apt install -y nginx
   
   # 安装 Git (可选)
   apt install -y git
   ```

---

### 步骤 2: 上传项目文件到服务器

#### 方法 A: 使用 SCP/SFTP 上传 (推荐)

**Windows 用户**:
- 使用 WinSCP 或 FileZilla
- 连接到服务器 IP
- 将整个 `ZenBazi` 文件夹上传到 `/root/` 或 `/home/` 目录

**Mac/Linux 用户**:
```bash
scp -r d:/ZenBazi root@您的服务器IP:/root/
```

#### 方法 B: 使用 Git

```bash
# 在服务器上
cd /root
git clone <您的项目仓库地址> ZenBazi
```

---

### 步骤 3: 在服务器上配置项目

```bash
# 进入项目目录
cd /root/ZenBazi

# 安装依赖
npm install

# 确保使用本地存储
# 检查 .env.local 文件内容:
# STORAGE_DRIVER=local

# 构建前端
npm run build

# 创建数据存储目录
mkdir -p cloud
```

---

### 步骤 4: 配置 Nginx

创建 Nginx 配置文件:

```bash
nano /etc/nginx/sites-available/zenbazi
```

复制以下内容:

```nginx
server {
    listen 80;
    server_name yuandestiny.com www.yuandestiny.com;

    # 前端静态文件
    location / {
        root /root/ZenBazi/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api {
        proxy_pass http://127.0.0.1:8787;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 文件大小限制
    client_max_body_size 20M;
}
```

启用配置:

```bash
# 创建符号链接
ln -s /etc/nginx/sites-available/zenbazi /etc/nginx/sites-enabled/

# 测试配置
nginx -t

# 重启 Nginx
systemctl restart nginx
```

---

### 步骤 5: 使用 PM2 管理后端进程

```bash
# 安装 PM2
npm install -g pm2

# 进入项目目录
cd /root/ZenBazi

# 启动后端服务
pm2 start npm --name "zenbazi-backend" -- run server

# 查看状态
pm2 status

# 设置开机自启
pm2 startup
pm2 save
```

---

### 步骤 6: 配置域名

1. **登录域名管理控制台**
   - 如果在阿里云: https://dns.console.aliyun.com/

2. **添加 DNS 解析记录**
   - 记录类型: A
   - 主机记录: @ 或 www
   - 记录值: 您的阿里云服务器 IP
   - TTL: 10分钟

---

### 步骤 7: 配置 SSL 证书 (HTTPS)

使用 Certbot 自动配置:

```bash
# 安装 Certbot
apt install -y certbot python3-certbot-nginx

# 获取证书并配置
certbot --nginx -d yuandestiny.com -d www.yuandestiny.com

# 按照提示输入邮箱等信息
```

---

## 🔧 环境配置确认

### 服务器上的 .env.local 文件

确保服务器上的 `.env.local` 包含以下内容:

```env
# Runtime
PORT=8787
STORAGE_ROOT=cloud
ZENBAZI_ENABLE_RATE_LIMIT=false

# Database - 不使用 PostgreSQL
DATABASE_URL=
PGHOST=
PGPASSWORD=

# Admin - 请修改为强密码
ZENBAZI_ADMIN_SECRET=请修改为长随机字符串
ZENBAZI_ADMIN_JWT_SECRET=请修改为另一个长随机字符串
ZENBAZI_ADMIN_USER=admin
ZENBAZI_ADMIN_PASSWORD=请修改为强密码

# Storage - 使用本地存储 (重要!)
STORAGE_DRIVER=local

# Queue - 内存队列
REDIS_URL=
```

---

## 📂 数据存储

### 存储位置
- 所有数据存储在服务器上的 `/root/ZenBazi/cloud` 目录
- 不需要 OSS，不需要其他云存储服务

### 数据备份建议
```bash
# 定期备份数据
tar -czf zenbazi-backup-$(date +%Y%m%d).tar.gz /root/ZenBazi/cloud
```

---

## 🚦 访问确认

完成所有步骤后:

1. **测试后端 API**
   ```
   http://yuandestiny.com/api
   ```

2. **测试前端**
   ```
   http://yuandestiny.com
   ```

3. **测试 HTTPS**
   ```
   https://yuandestiny.com
   ```

---

## 🛠️ 常用管理命令

### PM2 进程管理
```bash
pm2 status              # 查看状态
pm2 logs zenbazi-backend # 查看日志
pm2 restart zenbazi-backend # 重启
pm2 stop zenbazi-backend    # 停止
pm2 start zenbazi-backend   # 启动
```

### Nginx 管理
```bash
nginx -t                # 测试配置
systemctl restart nginx # 重启
systemctl status nginx  # 查看状态
```

---

## 🔍 故障排查

### 端口检查
```bash
# 检查端口是否被占用
netstat -tlnp | grep 8787
netstat -tlnp | grep 80
```

### 防火墙配置
```bash
# 如果使用 ufw
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp
ufw enable

# 如果使用 firewalld
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload
```

---

## 📞 下一步

需要我:
1. 提供更详细的某个步骤的说明？
2. 帮您检查项目代码是否有需要修改的地方？
3. 提供完整的部署脚本？
