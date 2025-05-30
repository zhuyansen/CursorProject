#!/bin/bash

LOG_DIR="/home/deploy/logs"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# 创建日志目录
mkdir -p $LOG_DIR

# 检查应用是否运行
check_app_status() {
    if ! pm2 list | grep -q "brickrecipes-ai.*online"; then
        echo "[$DATE] 应用异常，尝试重启..." >> $LOG_DIR/restart.log
        pm2 restart brickrecipes-ai
        
        # 等待重启完成
        sleep 10
        
        # 再次检查
        if pm2 list | grep -q "brickrecipes-ai.*online"; then
            echo "[$DATE] 应用重启成功" >> $LOG_DIR/restart.log
        else
            echo "[$DATE] 应用重启失败！需要人工干预" >> $LOG_DIR/restart.log
        fi
    fi
}

# 检查磁盘空间
check_disk_usage() {
    DISK_USAGE=$(df /home | tail -1 | awk '{print $5}' | sed 's/%//')
    if [ $DISK_USAGE -gt 80 ]; then
        echo "[$DATE] 磁盘空间不足：${DISK_USAGE}%" >> $LOG_DIR/disk-warning.log
    fi
}

# 检查内存使用
check_memory_usage() {
    MEMORY_USAGE=$(free | grep '^Mem' | awk '{printf "%.0f", $3/$2 * 100.0}')
    if [ $MEMORY_USAGE -gt 90 ]; then
        echo "[$DATE] 内存使用过高：${MEMORY_USAGE}%" >> $LOG_DIR/memory-warning.log
    fi
}

# 检查 SSL 证书到期时间
check_ssl_certificate() {
    CERT_EXPIRY=$(echo | openssl s_client -servername brickrecipes.ai -connect brickrecipes.ai:443 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
    CERT_EXPIRY_EPOCH=$(date -d "$CERT_EXPIRY" +%s)
    CURRENT_EPOCH=$(date +%s)
    DAYS_UNTIL_EXPIRY=$(( ($CERT_EXPIRY_EPOCH - $CURRENT_EPOCH) / 86400 ))
    
    if [ $DAYS_UNTIL_EXPIRY -lt 30 ]; then
        echo "[$DATE] SSL证书将在 $DAYS_UNTIL_EXPIRY 天后过期！" >> $LOG_DIR/ssl-warning.log
    fi
}

# 检查网站可访问性
check_website_accessibility() {
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://brickrecipes.ai)
    if [ "$HTTP_STATUS" != "200" ]; then
        echo "[$DATE] 网站无法访问，HTTP状态码: $HTTP_STATUS" >> $LOG_DIR/accessibility.log
        
        # 尝试重启 nginx
        sudo systemctl restart nginx
        echo "[$DATE] 已重启 Nginx 服务" >> $LOG_DIR/accessibility.log
    fi
}

# 清理日志文件（保留最近30天）
cleanup_logs() {
    find $LOG_DIR -name "*.log" -mtime +30 -delete 2>/dev/null || true
}

# 执行所有检查
echo "[$DATE] 开始系统健康检查..." >> $LOG_DIR/monitor.log

check_app_status
check_disk_usage
check_memory_usage
check_ssl_certificate
check_website_accessibility
cleanup_logs

echo "[$DATE] 系统健康检查完成" >> $LOG_DIR/monitor.log 