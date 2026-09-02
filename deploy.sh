#!/bin/bash
# ZenBazi 一键部署脚本
# 请在阿里云服务器上以 root 用户执行

echo "================================================"
echo "  ZenBazi 应用部署脚本"
echo "================================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 步骤 1: 更新系统
echo -e "${YELLOW}[1/7] 更新系统...${NC}"
apt update && apt upgrade -y
if [ $? -ne 0 ]; then
    echo -e "${RED}系统更新失败，继续执行...${NC}"
else
    echo -e "${GREEN}✓ 系统更新完成${NC}"
fi
echo ""

# 步骤 2: 安装 Node.js 18
echo -e "${YELLOW}[2/7] 安装 Node.js 18...${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
    echo -e "${GREEN}✓ Node.js 安装完成: $(node -v)${NC}"
else
    echo -e "${GREEN}✓ Node.js 已安装: $(node -v)${NC}"
fi
echo ""

# 步骤 3: 安装 Nginx
echo -e "${YELLOW}[3/7] 安装 Nginx...${NC}"
if ! command -v nginx &> /dev/null; then
    apt install -y nginx
    systemctl start nginx
    systemctl enable nginx
    echo -e "${GREEN}✓ Nginx 安装完成${NC}"
else
    echo -e "${GREEN}✓ Nginx 已安装${NC}"
fi
echo ""

# 步骤 4: 安装 PM2
echo -e "${YELLOW}[4/7] 安装 PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    echo -e "${GREEN}✓ PM2 安装完成${NC}"
else
    echo -e "${GREEN}✓ PM2 已安装${NC}"
fi
echo ""

# 步骤 5: 创建项目目录
echo -e "${YELLOW}[5/7] 准备项目目录...${NC}"
cd /root
if [ ! -d "ZenBazi" ]; then
    echo "✗ ZenBazi 目录不存在，请先上传项目文件到 /root/ZenBazi"
    echo ""
    echo "请使用以下方法上传项目："
    echo "  方法 1: 使用 scp 从本地上传"
    echo "    scp -r d:/ZenBazi root@39.105.5.85:/root/"
    echo ""
    echo "  方法 2: 使用 WinSCP 或 FileZilla 等工具"
    echo ""
    exit 1
fi

cd /root/ZenBazi
echo -e "${GREEN}✓ 项目目录准备好了${NC}"
echo ""

# 步骤 6: 安装依赖和构建
echo -e "${YELLOW}[6/7] 安装依赖和构建...${NC}"
if [ ! -d "node_modules" ]; then
    echo "  正在安装 npm 依赖..."
    npm install
fi

echo "  正在构建前端..."
npm run build

# 确保 cloud 目录存在
mkdir -p cloud

echo -e "${GREEN}✓ 依赖安装和构建完成${NC}"
echo ""

# 步骤 7: 配置 Nginx
echo -e "${YELLOW}[7/7] 配置 Nginx...${NC}"

# 创建 Nginx 配置文件
cat > /etc/nginx/sites-available/zenbazi << 'EOF'
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
EOF

# 创建符号链接
ln -sf /etc/nginx/sites-available/zenbazi /etc/nginx/sites-enabled/

# 删除默认站点（避免冲突）
rm -f /etc/nginx/sites-enabled/default

# 测试 Nginx 配置
nginx -t
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Nginx 配置测试失败，请检查配置${NC}"
    exit 1
fi

# 重启 Nginx
systemctl restart nginx
echo -e "${GREEN}✓ Nginx 配置完成${NC}"
echo ""

# 步骤 8: 启动后端服务
echo -e "${YELLOW}[8/8] 启动后端服务...${NC}"

# 停止旧的服务（如果有）
pm2 delete zenbazi-backend 2>/dev/null || true

# 启动新服务
cd /root/ZenBazi
pm2 start npm --name "zenbazi-backend" -- run server

# 保存 PM2 配置
pm2 save
pm2 startup

echo ""
echo -e "${GREEN}================================================"
echo "  ✅ 部署完成！"
echo "================================================"
echo ""
echo "  访问地址:"
echo "    http://39.105.5.85"
echo ""
echo "  常用命令:"
echo "    pm2 status           - 查看服务状态"
echo "    pm2 logs zenbazi-backend - 查看日志"
echo "    pm2 restart zenbazi-backend - 重启服务"
echo ""
echo "  下一步:"
echo "    1. 访问 http://39.105.5.85 测试应用"
echo "    2. 配置域名解析（如果需要）"
echo "    3. 申请 SSL 证书（如果需要 HTTPS）"
echo ""
echo "===============================================${NC}"
