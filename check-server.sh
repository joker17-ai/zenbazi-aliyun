#!/bin/bash
# 服务器环境检查脚本

echo "================================================"
echo "  服务器环境检查"
echo "================================================"
echo ""

# 检查系统
echo "[1/6] 检查系统..."
if [ -f /etc/os-release ]; then
    . /etc/os-release
    echo "  操作系统: $PRETTY_NAME"
    echo "  内核版本: $(uname -r)"
else
    echo "  无法识别操作系统"
fi
echo ""

# 检查 CPU 和内存
echo "[2/6] 检查资源..."
echo "  CPU 核心数: $(nproc)"
echo "  内存总量: $(free -h | grep Mem | awk '{print $2}')"
echo "  内存可用: $(free -h | grep Mem | awk '{print $7}')"
echo "  磁盘空间:"
df -h /
echo ""

# 检查网络
echo "[3/6] 检查网络..."
echo "  主机名: $(hostname)"
echo "  公网 IP: $(curl -s ifconfig.me 2>/dev/null || echo '获取失败')"
echo ""

# 检查已安装软件
echo "[4/6] 检查软件..."

check_software() {
    if command -v $1 &> /dev/null; then
        echo "  ✓ $1 已安装: $($1 --version 2>&1 | head -1)"
        return 0
    else
        echo "  ✗ $1 未安装"
        return 1
    fi
}

check_software node
check_software npm
check_software nginx
check_software git
echo ""

# 检查端口
echo "[5/6] 检查端口..."
for port in 80 443 8787; do
    if nc -z 127.0.0.1 $port 2>/dev/null; then
        echo "  ✓ 端口 $port 已开启"
    else
        echo "  ✗ 端口 $port 未开启"
    fi
done
echo ""

# 检查目录
echo "[6/6] 检查项目..."
if [ -d "/root/ZenBazi" ]; then
    echo "  ✓ 项目目录存在: /root/ZenBazi"
    if [ -f "/root/ZenBazi/package.json" ]; then
        echo "  ✓ package.json 存在"
    fi
else
    echo "  ✗ 项目目录不存在"
fi
echo ""

echo "================================================"
echo "  检查完成！"
echo "================================================"
echo ""
echo "  根据检查结果，您可以："
echo "  1. 如果软件未安装，请先运行部署脚本"
echo "  2. 如果项目不存在，请先上传项目文件"
echo ""
