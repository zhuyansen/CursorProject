# BrickRecipes.ai 服务器部署指南

## 1. 服务器环境准备

### 1.1 服务器要求
- Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- 至少 2GB RAM，2 CPU核心
- 至少 20GB 存储空间
- Root 或 sudo 权限

### 1.2 安装基础依赖

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 安装基础工具
sudo apt install -y curl wget git unzip

# 安装 Node.js 18+ (推荐使用 NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装 pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh -
source ~/.bashrc

# 安装 PM2 (进程管理器)
npm install -g pm2

# 安装 Nginx (反向代理)
sudo apt install -y nginx

# 安装 UFW 防火墙
sudo ufw enable
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
```

## 2. 域名和 SSL 配置

### 2.1 域名 DNS 配置
确保 `brickrecipes.ai` 和 `www.brickrecipes.ai` 的 A 记录指向您的服务器 IP

### 2.2 安装 Certbot (Let's Encrypt SSL)
```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d brickrecipes.ai -d www.brickrecipes.ai
```

## 3. 项目部署

### 3.1 创建部署用户
```bash
# 创建专用部署用户
sudo adduser --system --group --shell /bin/bash deploy
sudo usermod -aG sudo deploy

# 切换到部署用户
sudo su - deploy
```

### 3.2 克隆项目代码
```bash
# 在部署用户家目录创建项目目录
cd /home/deploy
git clone <YOUR_REPOSITORY_URL> brick-recipes
cd brick-recipes

# 安装依赖
pnpm install
```

### 3.3 环境变量配置
```bash
# 复制环境变量文件
cp .env.example .env.local

# 编辑环境变量 (使用您喜欢的编辑器)
nano .env.local
```

**重要环境变量配置：**
```bash
# 应用URL (已在您的.env.local中正确配置)
NEXT_PUBLIC_APP_URL=https://brickrecipes.ai

# 数据库配置 (保持现有配置)
REDIS_HOST=128.1.47.79
REDIS_PORT=26740
REDIS_PASSWORD=dLmHMtPwjktyYnLt

MONGODB_URI=mongodb://jason:Chatbot520@128.1.47.79:27017/videotorecipe
MONGODB_DB=videotorecipe

# Supabase配置 (保持现有配置)
NEXT_PUBLIC_SUPABASE_URL=https://bqkzeajvxcsrlmxxizye.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Stripe配置 (已配置为生产环境密钥)
STRIPE_SECRET_KEY=***REMOVED***
STRIPE_WEBHOOK_SECRET=***REMOVED***

# 生产环境特定配置
NODE_ENV=production
```

### 3.4 构建项目
```bash
# 构建生产版本
pnpm build

# 验证构建成功
ls -la .next/
```

## 4. Nginx 反向代理配置

### 4.1 创建 Nginx 配置文件
```bash
sudo nano /etc/nginx/sites-available/brickrecipes.ai
```

**Nginx 配置内容：**
```nginx
# Redirect www to non-www
server {
    listen 80;
    listen 443 ssl http2;
    server_name www.brickrecipes.ai;
    
    ssl_certificate /etc/letsencrypt/live/brickrecipes.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/brickrecipes.ai/privkey.pem;
    
    return 301 https://brickrecipes.ai$request_uri;
}

# Main server block
server {
    listen 80;
    server_name brickrecipes.ai;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name brickrecipes.ai;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/brickrecipes.ai/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/brickrecipes.ai/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # 增加超时时间
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 静态文件缓存
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 60m;
        add_header Cache-Control "public, max-age=3600, immutable";
    }

    # API 路由特殊处理
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # API 路由更长的超时时间
        proxy_connect_timeout 120s;
        proxy_send_timeout 120s;
        proxy_read_timeout 120s;
    }
}
```

### 4.2 启用配置
```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/brickrecipes.ai /etc/nginx/sites-enabled/

# 删除默认配置
sudo rm /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

## 5. PM2 进程管理配置

### 5.1 创建 PM2 配置文件
```bash
# 在项目根目录创建 PM2 配置
nano ecosystem.config.js
```

**PM2 配置内容：**
```javascript
module.exports = {
  apps: [
    {
      name: 'brickrecipes-ai',
      script: 'npm',
      args: 'start',
      cwd: '/home/deploy/brick-recipes',
      instances: 'max', // 使用所有 CPU 核心
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: '/home/deploy/logs/brickrecipes-error.log',
      out_file: '/home/deploy/logs/brickrecipes-out.log',
      log_file: '/home/deploy/logs/brickrecipes-combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024'
    }
  ]
};
```

### 5.2 启动应用
```bash
# 创建日志目录
mkdir -p /home/deploy/logs

# 启动应用
pm2 start ecosystem.config.js --env production

# 保存 PM2 配置
pm2 save

# 设置开机自启动
pm2 startup

# 查看应用状态
pm2 status
pm2 logs brickrecipes-ai
```

## 6. 部署脚本自动化

### 6.1 创建部署脚本
```bash
nano /home/deploy/deploy.sh
```

**部署脚本内容：**
```bash
#!/bin/bash

set -e

PROJECT_DIR="/home/deploy/brick-recipes"
BACKUP_DIR="/home/deploy/backups"

echo "🚀 开始部署 BrickRecipes.ai..."

# 创建备份目录
mkdir -p $BACKUP_DIR

# 备份当前版本
if [ -d "$PROJECT_DIR/.next" ]; then
    echo "📦 备份当前版本..."
    cp -r $PROJECT_DIR/.next $BACKUP_DIR/.next-$(date +%Y%m%d-%H%M%S)
fi

# 进入项目目录
cd $PROJECT_DIR

# 拉取最新代码
echo "📥 拉取最新代码..."
git pull origin main

# 安装依赖
echo "📚 安装依赖..."
pnpm install

# 构建项目
echo "🔨 构建项目..."
pnpm build

# 重启应用
echo "🔄 重启应用..."
pm2 restart brickrecipes-ai

# 等待应用启动
sleep 5

# 检查应用状态
echo "✅ 检查应用状态..."
pm2 status

echo "🎉 部署完成！"
echo "🌐 网站地址: https://brickrecipes.ai"
```

### 6.2 设置脚本权限
```bash
chmod +x /home/deploy/deploy.sh
```

## 7. 监控和维护

### 7.1 设置日志轮转
```bash
sudo nano /etc/logrotate.d/brickrecipes
```

```bash
/home/deploy/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    notifempty
    create 644 deploy deploy
    postrotate
        pm2 reload brickrecipes-ai
    endscript
}
```

### 7.2 监控脚本
```bash
nano /home/deploy/monitor.sh
```

```bash
#!/bin/bash

# 检查应用是否运行
if ! pm2 list | grep -q "brickrecipes-ai.*online"; then
    echo "应用异常，尝试重启..."
    pm2 restart brickrecipes-ai
    
    # 发送通知 (可配置邮件或短信)
    echo "BrickRecipes.ai 应用在 $(date) 重启" >> /home/deploy/logs/restart.log
fi

# 检查磁盘空间
DISK_USAGE=$(df /home | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "磁盘空间不足：${DISK_USAGE}%" >> /home/deploy/logs/disk-warning.log
fi
```

### 7.3 设置定时任务
```bash
crontab -e
```

```bash
# 每5分钟检查应用状态
*/5 * * * * /home/deploy/monitor.sh

# 每天凌晨2点自动重启应用 (可选)
0 2 * * * /usr/bin/pm2 restart brickrecipes-ai

# 每周清理日志
0 3 * * 0 /usr/sbin/logrotate /etc/logrotate.d/brickrecipes
```

## 8. 首次部署步骤

```bash
# 1. 按照上述步骤配置服务器环境
# 2. 克隆代码并配置环境变量
# 3. 构建和启动应用
cd /home/deploy/brick-recipes
pnpm install
pnpm build
pm2 start ecosystem.config.js --env production
pm2 save

# 4. 配置并启动 Nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# 5. 获取 SSL 证书
sudo certbot --nginx -d brickrecipes.ai -d www.brickrecipes.ai

# 6. 验证部署
curl -I https://brickrecipes.ai
```

## 9. 故障排查

### 9.1 常见问题
- **503 错误**: 检查 PM2 应用状态 `pm2 status`
- **SSL 错误**: 检查证书 `sudo certbot certificates`
- **构建失败**: 检查依赖和环境变量
- **数据库连接**: 检查 Redis 和 MongoDB 连接

### 9.2 日志查看
```bash
# PM2 应用日志
pm2 logs brickrecipes-ai

# Nginx 日志
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# 系统日志
journalctl -u nginx -f
```

## 10. 更新部署

```bash
# 使用部署脚本
/home/deploy/deploy.sh

# 或手动更新
cd /home/deploy/brick-recipes
git pull
pnpm install
pnpm build
pm2 restart brickrecipes-ai
```

---

🎉 **部署完成后，您的网站将在 https://brickrecipes.ai 上线！**

记得定期：
- 更新 SSL 证书 (`sudo certbot renew`)
- 备份数据库和应用数据
- 监控服务器性能和应用状态
- 更新依赖包和安全补丁 