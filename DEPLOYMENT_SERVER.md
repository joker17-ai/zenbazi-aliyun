# ZenBazi 部署指南 - 39.105.5.85

## 部署信息

| 项目 | 内容 |
|------|------|
| 服务器 IP | 39.105.5.85 |
| SSH 端口 | 22 |
| 登录用户 | root |

---

## 第一步：连接服务器

在您的本地电脑上打开终端或 PowerShell，运行：

```bash
ssh root@39.105.5.85
```

然后输入密码登录。

---

## 第二步：检查服务器

在服务器上运行以下命令检查环境：

```bash
# 创建检查脚本
cat > check-server.sh << 'EOF'
#!/bin/bash
echo "================================================"
echo "  服务器环境检查"
echo "================================================"
echo ""

echo "[1/6] 检查系统..."
if [ -f /etc/os-release ]; then
    . /etc/os-release
    echo "  操作系统: $PRETTY_NAME"
    echo "  内核版本: $(uname -r)"
fi
echo ""

echo "[2/6] 检查资源..."
echo "  CPU 核心数: $(nproc)"
echo "  内存总量: $(free -h | grep Mem | awk '{print $2}')"
echo "  磁盘空间:"
df -h /
echo ""

echo "[3/6] 检查软件..."
check_software() {
    if command -v $1 &> /dev/null; then
        echo "  ✓ $1 已安装: $($1 --version 2>&1 | head -1)"
    else
        echo "  ✗ $1 未安装"
    fi
}
check_software node
check_software npm
check_software nginx
echo ""

echo "[4/6] 检查目录..."
if [ -d "/root/ZenBazi" ]; then
    echo "  ✓ 项目目录存在"
else
    echo "  ✗ 项目目录不存在"
fi
echo ""

echo "================================================"
echo "  检查完成！"
echo "================================================"
EOF

chmod +x check-server.sh
./check-server.sh
```

---

## 第三步：上传项目文件

### 方法 1：使用 scp（推荐）

在您的本地电脑上打开 PowerShell，运行：

```powershell
# 上传整个项目
scp -r d:\ZenBazi root@39.105.5.85:/root/
```

### 方法 2：使用 WinSCP 或 FileZilla

1. 下载并安装 WinSCP 或 FileZilla
2. 连接信息：
   - 主机：39.105.5.85
   - 端口：22
   - 用户名：root
   - 密码：(您的密码)
3. 上传 d:\ZenBazi 整个文件夹到服务器的 /root/ 目录

---

## 第四步：开始部署

在服务器上运行一键部署脚本：

```bash
# 确保在 /root/ZenBazi 目录
cd /root/ZenBazi

# 创建部署脚本
cat > deploy.sh << 'EOF'
#!/bin/bash
echo "================================================"
echo "  ZenBazi 应用部署脚本"
echo "================================================"
echo ""

# 更新系统
echo "[1/7] 更新系统..."
apt update && apt upgrade -y
echo "✓ 系统更新完成"
echo ""

# 安装 Node.js 18
echo "[2/7] 安装 Node.js 18..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    echo "✓ Node.js 安装完成: $(node -v)"
else
    echo "✓ Node.js 已安装: $(node -v)"
fi
echo ""

# 安装 Nginx
echo "[3/7] 安装 Nginx..."
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx
    echo "✓ Nginx 安装完成"
else
    echo "✓ Nginx 已安装"
fi
echo ""

# 安装 PM2
echo "[4/7] 安装 PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    echo "✓ PM2 安装完成"
else
    echo "✓ PM2 已安装"
fi
echo ""

# 安装依赖和构建
echo "[5/7] 安装依赖和构建..."
cd /root/ZenBazi
if [ ! -d "node_modules" ]; then
    echo "  正在安装 npm 依赖..."
    npm install
fi
echo "  正在构建前端..."
npm run build
mkdir -p cloud
echo "✓ 依赖安装和构建完成"
echo ""

# 配置 Nginx
echo "[6/7] 配置 Nginx..."
cat > /etc/nginx/sites-available/zenbazi << 'NGINXEOF'
server {
    listen 80;
    server_name 39.105.5.85;

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
NGINXEOF

ln -sf /etc/nginx/sites-available/zenbazi /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
if [ $? -ne 0 ]; then
    echo "✗ Nginx 配置测试失败"
    exit 1
fi
systemctl restart nginx
echo "✓ Nginx 配置完成"
echo ""

# 启动后端服务
echo "[7/7] 启动后端服务..."
pm2 delete zenbazi-backend 2>/dev/null || true
pm2 start npm --name "zenbazi-backend" -- run server
pm2 save
pm2 startup
echo "✓ 服务启动完成"
echo ""

echo "================================================"
echo "  ✅ 部署完成！"
echo "================================================"
echo ""
echo "  访问地址: http://39.105.5.85"
echo ""
echo "  常用命令:"
echo "    pm2 status           - 查看服务状态"
echo "    pm2 logs zenbazi-backend - 查看日志"
echo "    pm2 restart zenbazi-backend - 重启服务"
echo ""
EOF

chmod +x deploy.sh
./deploy.sh
```

---

## 第五步：验证部署

在浏览器中访问：

```
http://39.105.5.85
```

如果一切正常，您会看到 ZenBazi 应用的界面。

---

## 故障排查

### 如果页面打不开

```bash
# 检查 Nginx 状态
systemctl status nginx

# 检查 PM2 服务
pm2 status

# 查看日志
pm2 logs zenbazi-backend
```

### 如果端口被占用

```bash
# 查看端口占用
netstat -tlnp

# 停止占用端口的进程
pkill -f node
pm2 restart zenbazi-backend
```

---

## 后续步骤（可选）

### 1. 配置域名

如果您有域名 `yuandestiny.com`：

1. 在域名控制台添加 A 记录：
   - 主机：@
   - 值：39.105.5.85

2. 修改 Nginx 配置中的 `server_name`：
   ```nginx
   server_name 39.105.5.85 yuandestiny.com www.yuandestiny.com;
   ```

### 2. 配置 HTTPS

```bash
# 安装 Certbot
apt install -y certbot python3-certbot-nginx

# 获取证书
certbot --nginx -d 39.105.5.85

# 或使用域名
certbot --nginx -d yuandestiny.com -d www.yuandestiny.com
```

---

## 附录：快速参考

| 命令 | 说明 |
|------|------|
| `pm2 status` | 查看服务状态 |
| `pm2 logs zenbazi-backend` | 查看应用日志 |
| `pm2 restart zenbazi-backend` | 重启应用 |
| `systemctl status nginx` | 查看 Nginx 状态 |
| `systemctl restart nginx` | 重启 Nginx |
