# ZenBazi 部署检查清单
**日期**: 2026-05-31

---

## ✅ 部署前检查清单

### 1. 本地配置确认
- [ ] `.env.local` 中 `STORAGE_DRIVER=local` ✓
- [ ] 已成功运行 `npm run build` ✓
- [ ] `dist` 目录已生成 ✓

### 2. 阿里云服务器准备
- [ ] 已购买阿里云服务器 (ECS/轻量应用服务器)
- [ ] 服务器操作系统: Ubuntu 20.04+ 或 CentOS 7+
- [ ] 已记录服务器公网 IP
- [ ] 可以通过 SSH 连接到服务器

### 3. 域名准备
- [ ] 已拥有域名: yuandestiny.com
- [ ] 域名已备案 (如果服务器在中国大陆)
- [ ] 准备配置 DNS 解析

---

## 🚀 部署阶段

### 阶段 1: 服务器环境配置
- [ ] 更新系统: `apt update && apt upgrade -y`
- [ ] 安装 Node.js 18+
- [ ] 安装 Nginx
- [ ] 安装 PM2: `npm install -g pm2`

### 阶段 2: 上传项目
- [ ] 上传项目到服务器 `/root/ZenBazi`
- [ ] 在服务器上运行 `npm install`
- [ ] 在服务器上运行 `npm run build`

### 阶段 3: 配置服务
- [ ] 配置 Nginx 反向代理
- [ ] 启动后端: `pm2 start npm --name "zenbazi-backend" -- run server`
- [ ] 配置 PM2 开机自启
- [ ] 配置域名 DNS 解析

### 阶段 4: SSL 配置 (可选但推荐)
- [ ] 安装 Certbot
- [ ] 获取并配置 HTTPS 证书

---

## 🎉 部署完成检查

- [ ] 可以访问 http://yuandestiny.com
- [ ] 可以访问 https://yuandestiny.com (如果配置了SSL)
- [ ] 前端页面正常显示
- [ ] 可以使用八字分析功能
- [ ] 数据正常保存 (在服务器的 `cloud/` 目录)

---

## 📁 重要文件

| 文件 | 用途 |
|------|------|
| `DEPLOYMENT.md` | 详细的部署指南 |
| `.env.local` | 环境配置 (确认 STORAGE_DRIVER=local) |
| `dist/` | 构建后的前端文件 |
| `server/server.mjs` | 后端服务入口 |

---

## 💡 快速提示

### 如果不使用阿里云 OSS:
- ✅ 已配置 `STORAGE_DRIVER=local`
- 数据存储在服务器的 `cloud/` 目录
- 不需要开通 OSS 服务

### 数据备份:
- 定期备份服务器上的 `cloud/` 目录
- 下载到本地电脑保存

---

## 📞 需要帮助?

如果遇到问题:
1. 查看 `DEPLOYMENT.md` 详细指南
2. 检查服务器日志: `pm2 logs zenbazi-backend`
3. 检查 Nginx 日志: `/var/log/nginx/error.log`
