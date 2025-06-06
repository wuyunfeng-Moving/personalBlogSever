#!/bin/bash

# 个人博客系统 - 健康检查脚本

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
LOG_FILE="/var/log/blog/health_check.log"
ALERT_EMAIL="admin@yourdomain.com"
API_URL="http://localhost:8000/api/v1/posts/"
FRONTEND_URL="http://localhost:3000"

# 确保日志目录存在
mkdir -p $(dirname "$LOG_FILE")

# 日志函数
log_message() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "$timestamp [$level] $message" | tee -a "$LOG_FILE"
}

log_info() {
    log_message "INFO" "${GREEN}✓${NC} $1"
}

log_warn() {
    log_message "WARN" "${YELLOW}⚠${NC} $1"
}

log_error() {
    log_message "ERROR" "${RED}✗${NC} $1"
}

log_section() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

# 检查服务状态
check_services() {
    log_section "检查系统服务状态"
    
    services=("blog-backend" "nginx" "postgresql" "redis-server")
    
    for service in "${services[@]}"; do
        if systemctl is-active --quiet "$service"; then
            log_info "$service 服务运行正常"
        else
            log_error "$service 服务未运行"
            # 尝试重启服务
            if [[ "$1" == "--auto-fix" ]]; then
                log_info "尝试重启 $service 服务..."
                sudo systemctl start "$service" && log_info "$service 服务重启成功" || log_error "$service 服务重启失败"
            fi
        fi
    done
}

# 检查端口状态
check_ports() {
    log_section "检查端口状态"
    
    ports=("80:HTTP" "443:HTTPS" "8000:Django" "5432:PostgreSQL" "6379:Redis")
    
    for port_info in "${ports[@]}"; do
        port="${port_info%%:*}"
        service="${port_info##*:}"
        
        if netstat -tuln | grep -q ":$port "; then
            log_info "$service 端口 $port 开放"
        else
            log_warn "$service 端口 $port 未开放或未监听"
        fi
    done
}

# 检查磁盘空间
check_disk_space() {
    log_section "检查磁盘空间"
    
    # 检查根分区和常用分区
    df -h | grep -E "/(|var|home|tmp)$" | while read filesystem size used avail use_percent mounted; do
        use_numeric=$(echo "$use_percent" | sed 's/%//g')
        
        if [[ $use_numeric -ge 90 ]]; then
            log_error "磁盘使用率过高: $mounted ($use_percent)"
        elif [[ $use_numeric -ge 80 ]]; then
            log_warn "磁盘使用率较高: $mounted ($use_percent)"
        else
            log_info "磁盘空间正常: $mounted ($use_percent)"
        fi
    done
}

# 检查内存使用率
check_memory() {
    log_section "检查内存使用率"
    
    mem_info=$(free | grep Mem)
    total=$(echo $mem_info | awk '{print $2}')
    used=$(echo $mem_info | awk '{print $3}')
    usage_percent=$(awk "BEGIN {printf \"%.1f\", $used/$total * 100}")
    
    if (( $(echo "$usage_percent >= 90" | bc -l) )); then
        log_error "内存使用率过高: ${usage_percent}%"
    elif (( $(echo "$usage_percent >= 80" | bc -l) )); then
        log_warn "内存使用率较高: ${usage_percent}%"
    else
        log_info "内存使用率正常: ${usage_percent}%"
    fi
}

# 检查 CPU 使用率
check_cpu() {
    log_section "检查 CPU 使用率"
    
    cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    cpu_numeric=$(echo "$cpu_usage" | sed 's/us,//g')
    
    if (( $(echo "$cpu_numeric >= 80" | bc -l) )); then
        log_error "CPU 使用率过高: ${cpu_numeric}%"
    elif (( $(echo "$cpu_numeric >= 60" | bc -l) )); then
        log_warn "CPU 使用率较高: ${cpu_numeric}%"
    else
        log_info "CPU 使用率正常: ${cpu_numeric}%"
    fi
}

# 检查数据库连接
check_database() {
    log_section "检查数据库连接"
    
    if sudo -u postgres psql -d blog_db -c '\q' >/dev/null 2>&1; then
        log_info "数据库连接正常"
        
        # 检查数据库大小
        db_size=$(sudo -u postgres psql -d blog_db -t -c "SELECT pg_size_pretty(pg_database_size('blog_db'));" | xargs)
        log_info "数据库大小: $db_size"
        
        # 检查活跃连接数
        active_connections=$(sudo -u postgres psql -d blog_db -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" | xargs)
        log_info "活跃数据库连接数: $active_connections"
    else
        log_error "数据库连接失败"
    fi
}

# 检查 API 响应
check_api() {
    log_section "检查 API 响应"
    
    # 检查 API 响应时间和状态码
    response=$(curl -o /dev/null -s -w "%{http_code}:%{time_total}" "$API_URL" 2>/dev/null)
    
    if [[ $? -eq 0 ]]; then
        http_code="${response%%:*}"
        response_time="${response##*:}"
        
        if [[ "$http_code" == "200" ]]; then
            log_info "API 响应正常 (HTTP $http_code)"
            
            # 检查响应时间
            if (( $(echo "$response_time > 3.0" | bc -l) )); then
                log_warn "API 响应时间较慢: ${response_time}s"
            else
                log_info "API 响应时间: ${response_time}s"
            fi
        else
            log_error "API 响应异常 (HTTP $http_code)"
        fi
    else
        log_error "无法连接到 API 服务"
    fi
}

# 检查 SSL 证书
check_ssl() {
    log_section "检查 SSL 证书"
    
    # 读取域名配置
    domain=$(grep -r "server_name" /etc/nginx/sites-enabled/ | head -1 | awk '{print $3}' | sed 's/;//g')
    
    if [[ -n "$domain" && "$domain" != "localhost" ]]; then
        # 检查证书过期时间
        cert_info=$(echo | openssl s_client -servername "$domain" -connect "$domain":443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
        
        if [[ $? -eq 0 ]]; then
            expiry_date=$(echo "$cert_info" | grep "notAfter" | cut -d= -f2)
            expiry_timestamp=$(date -d "$expiry_date" +%s)
            current_timestamp=$(date +%s)
            days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
            
            if [[ $days_until_expiry -lt 30 ]]; then
                log_warn "SSL 证书将在 $days_until_expiry 天后过期"
            else
                log_info "SSL 证书有效，$days_until_expiry 天后过期"
            fi
        else
            log_error "无法获取 SSL 证书信息"
        fi
    else
        log_info "跳过 SSL 检查 (本地环境或无域名配置)"
    fi
}

# 检查日志错误
check_logs() {
    log_section "检查系统日志"
    
    # 检查 Django 应用日志中的错误
    if journalctl -u blog-backend --since "1 hour ago" | grep -i error >/dev/null; then
        error_count=$(journalctl -u blog-backend --since "1 hour ago" | grep -i error | wc -l)
        log_warn "Django 服务在过去1小时内有 $error_count 个错误"
    else
        log_info "Django 服务日志正常"
    fi
    
    # 检查 Nginx 错误日志
    if [[ -f /var/log/nginx/error.log ]]; then
        recent_errors=$(tail -100 /var/log/nginx/error.log | grep "$(date +'%Y/%m/%d %H')" | wc -l)
        if [[ $recent_errors -gt 10 ]]; then
            log_warn "Nginx 在过去1小时内有 $recent_errors 个错误"
        else
            log_info "Nginx 错误日志正常"
        fi
    fi
}

# 检查备份状态
check_backups() {
    log_section "检查备份状态"
    
    backup_dir="/var/www/blog/backup"
    
    if [[ -d "$backup_dir" ]]; then
        # 检查最近的备份
        latest_backup=$(find "$backup_dir" -name "*backup*" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2-)
        
        if [[ -n "$latest_backup" ]]; then
            backup_date=$(stat -c %y "$latest_backup" | cut -d' ' -f1)
            log_info "最新备份: $backup_date"
            
            # 检查备份是否超过 24 小时
            backup_timestamp=$(stat -c %Y "$latest_backup")
            current_timestamp=$(date +%s)
            hours_since_backup=$(( (current_timestamp - backup_timestamp) / 3600 ))
            
            if [[ $hours_since_backup -gt 24 ]]; then
                log_warn "备份已超过 24 小时 ($hours_since_backup 小时前)"
            fi
        else
            log_warn "未找到备份文件"
        fi
    else
        log_warn "备份目录不存在"
    fi
}

# 性能统计
show_performance_stats() {
    log_section "性能统计"
    
    # 系统负载
    load_avg=$(uptime | awk -F'load average:' '{print $2}' | xargs)
    log_info "系统负载: $load_avg"
    
    # 运行时间
    uptime_info=$(uptime -p)
    log_info "系统运行时间: $uptime_info"
    
    # 网络连接数
    connection_count=$(netstat -an | grep ESTABLISHED | wc -l)
    log_info "活跃网络连接数: $connection_count"
    
    # Django 进程数
    django_processes=$(pgrep -f "gunicorn.*wsgi" | wc -l)
    log_info "Django 工作进程数: $django_processes"
}

# 发送警报邮件
send_alert() {
    local subject="$1"
    local body="$2"
    
    if command -v mail >/dev/null 2>&1; then
        echo "$body" | mail -s "$subject" "$ALERT_EMAIL"
        log_info "警报邮件已发送到 $ALERT_EMAIL"
    else
        log_warn "邮件系统未配置，无法发送警报"
    fi
}

# 生成报告
generate_report() {
    log_section "生成健康检查报告"
    
    local report_file="/var/log/blog/health_report_$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "个人博客系统健康检查报告"
        echo "生成时间: $(date)"
        echo "=================================="
        echo
        
        # 复制最近的日志内容
        tail -100 "$LOG_FILE"
        
        echo
        echo "=================================="
        echo "系统信息:"
        echo "  操作系统: $(lsb_release -d | cut -f2)"
        echo "  内核版本: $(uname -r)"
        echo "  服务器时间: $(date)"
        echo "  时区: $(timedatectl | grep "Time zone" | awk '{print $3}')"
        
    } > "$report_file"
    
    log_info "健康检查报告已生成: $report_file"
}

# 快速修复常见问题
quick_fix() {
    log_section "执行快速修复"
    
    # 清理日志文件
    if [[ -f /var/log/nginx/access.log ]] && [[ $(stat -c%s /var/log/nginx/access.log) -gt 1073741824 ]]; then
        log_info "清理 Nginx 访问日志..."
        sudo truncate -s 0 /var/log/nginx/access.log
    fi
    
    # 清理 Django 日志
    find /var/log -name "*.log" -size +100M -exec truncate -s 0 {} \; 2>/dev/null || true
    
    # 重启有问题的服务
    for service in blog-backend nginx; do
        if ! systemctl is-active --quiet "$service"; then
            log_info "重启 $service 服务..."
            sudo systemctl restart "$service"
        fi
    done
    
    log_info "快速修复完成"
}

# 显示使用帮助
show_help() {
    echo "个人博客系统健康检查脚本"
    echo
    echo "用法: $0 [选项]"
    echo
    echo "选项:"
    echo "  --auto-fix     自动修复发现的问题"
    echo "  --report       生成详细报告"
    echo "  --quick-fix    执行快速修复"
    echo "  --help         显示此帮助信息"
    echo
    echo "示例:"
    echo "  $0                    # 执行基本健康检查"
    echo "  $0 --auto-fix         # 检查并自动修复问题"
    echo "  $0 --report           # 生成详细报告"
    echo "  $0 --quick-fix        # 执行快速修复"
}

# 主函数
main() {
    echo -e "${BLUE}个人博客系统健康检查${NC}"
    echo "检查时间: $(date)"
    echo "========================================"
    
    case "${1:-}" in
        --help)
            show_help
            exit 0
            ;;
        --quick-fix)
            quick_fix
            exit 0
            ;;
        --report)
            GENERATE_REPORT=true
            ;;
        --auto-fix)
            AUTO_FIX=true
            ;;
    esac
    
    # 执行所有检查
    check_services "$1"
    check_ports
    check_disk_space
    check_memory
    check_cpu
    check_database
    check_api
    check_ssl
    check_logs
    check_backups
    show_performance_stats
    
    # 生成报告
    if [[ "${GENERATE_REPORT:-}" == "true" ]]; then
        generate_report
    fi
    
    echo
    log_section "健康检查完成"
    log_info "详细日志保存在: $LOG_FILE"
    
    # 检查是否有错误需要警报
    if grep -q "ERROR" "$LOG_FILE" && [[ -n "$ALERT_EMAIL" ]]; then
        error_count=$(grep "ERROR" "$LOG_FILE" | wc -l)
        send_alert "博客系统健康检查警报" "发现 $error_count 个错误，请检查系统状态。"
    fi
}

# 运行主函数
main "$@" 