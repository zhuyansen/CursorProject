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

# 清理旧备份 (保留最近7天)
echo "🧹 清理旧备份..."
find $BACKUP_DIR -name ".next-*" -mtime +7 -exec rm -rf {} \; 2>/dev/null || true

echo "📊 PM2 监控:"
echo "   查看日志: pm2 logs brickrecipes-ai"
echo "   查看状态: pm2 status"
echo "   重启应用: pm2 restart brickrecipes-ai" 