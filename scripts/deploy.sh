#!/bin/bash

# 个人博客系统 - 生产环境部署脚本

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置变量
PROJECT_NAME="personal-blog"
DEPLOY_USER="www-data"
DEPLOY_PATH="/var/www/blog"
DOMAIN_NAME=""
DB_PASSWORD=""
SECRET_KEY=""

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为 root 用户
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_error "请不要使用 root 用户运行此脚本"
        exit 1
    fi
}

# 获取用户输入
get_user_input() {
    echo "=== 个人博客系统部署配置 ==="
    echo
    
    read -p "请输入域名 (例: example.com): " DOMAIN_NAME
    if [[ -z "$DOMAIN_NAME" ]]; then
        log_error "域名不能为空"
        exit 1
    fi
    
    read -s -p "请输入数据库密码: " DB_PASSWORD
    echo
    if [[ -z "$DB_PASSWORD" ]]; then
        log_error "数据库密码不能为空"
        exit 1
    fi
    
    SECRET_KEY=$(openssl rand -base64 32)
    log_info "已生成 Django SECRET_KEY"
    
    echo
    echo "配置确认:"
    echo "  域名: $DOMAIN_NAME"
    echo "  部署路径: $DEPLOY_PATH"
    echo
    read -p "是否继续部署? (y/n): " confirm
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        log_warn "部署已取消"
        exit 0
    fi
}

# 安装系统依赖
install_dependencies() {
    log_info "安装系统依赖..."
    
    # 更新包列表
    sudo apt update
    
    # 安装基础依赖
    sudo apt install -y \
        python3 \
        python3-venv \
        python3-pip \
        nodejs \
        npm \
        postgresql \
        postgresql-contrib \
        nginx \
        redis-server \
        git \
        curl \
        certbot \
        python3-certbot-nginx \
        build-essential \
        libpq-dev
    
    log_info "系统依赖安装完成"
}

# 配置数据库
setup_database() {
    log_info "配置 PostgreSQL 数据库..."
    
    # 启动并启用 PostgreSQL
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    
    # 创建数据库和用户
    sudo -u postgres psql << EOF
CREATE DATABASE blog_db;
CREATE USER blog_user WITH PASSWORD '$DB_PASSWORD';
ALTER ROLE blog_user SET client_encoding TO 'utf8';
ALTER ROLE blog_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE blog_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE blog_db TO blog_user;
\q
EOF
    
    log_info "数据库配置完成"
}

# 部署应用代码
deploy_application() {
    log_info "部署应用代码..."
    
    # 创建部署目录
    sudo mkdir -p $DEPLOY_PATH
    sudo chown $USER:$USER $DEPLOY_PATH
    
    # 克隆或更新代码
    if [[ -d "$DEPLOY_PATH/.git" ]]; then
        cd $DEPLOY_PATH
        git pull origin main
    else
        git clone . $DEPLOY_PATH
        cd $DEPLOY_PATH
    fi
    
    log_info "代码部署完成"
}

# 配置后端
setup_backend() {
    log_info "配置 Django 后端..."
    
    cd $DEPLOY_PATH/recipeServerPython
    
    # 创建虚拟环境
    python3 -m venv venv
    source venv/bin/activate
    
    # 安装依赖
    pip install -r requirements.txt
    pip install gunicorn psycopg2-binary
    
    # 创建生产环境配置
    cat > .env << EOF
DEBUG=False
SECRET_KEY=$SECRET_KEY
DATABASE_URL=postgresql://blog_user:$DB_PASSWORD@localhost:5432/blog_db
REDIS_URL=redis://localhost:6379/0
ALLOWED_HOSTS=$DOMAIN_NAME,www.$DOMAIN_NAME
STATIC_ROOT=$DEPLOY_PATH/static/
MEDIA_ROOT=$DEPLOY_PATH/media/
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
EOF
    
    # 数据库迁移
    python manage.py migrate
    
    # 收集静态文件
    python manage.py collectstatic --noinput
    
    # 创建超级用户
    echo "创建管理员用户:"
    python manage.py createsuperuser
    
    log_info "后端配置完成"
}

# 配置前端
setup_frontend() {
    log_info "配置 React 前端..."
    
    cd $DEPLOY_PATH/recipeServerWeb
    
    # 安装依赖
    npm ci --only=production
    
    # 创建生产环境配置
    cat > .env.production << EOF
VITE_API_BASE_URL=https://$DOMAIN_NAME/api/v1
VITE_APP_TITLE=我的个人博客
VITE_APP_DESCRIPTION=分享技术心得与生活感悟
EOF
    
    # 构建生产版本
    npm run build
    
    log_info "前端配置完成"
}

# 配置 Gunicorn 服务
setup_gunicorn() {
    log_info "配置 Gunicorn 服务..."
    
    # 创建 Gunicorn 配置
    cat > $DEPLOY_PATH/recipeServerPython/gunicorn.conf.py << EOF
bind = "127.0.0.1:8000"
workers = 3
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
timeout = 30
keepalive = 5
preload_app = True
user = "$DEPLOY_USER"
group = "$DEPLOY_USER"
EOF
    
    # 创建 systemd 服务文件
    sudo cat > /etc/systemd/system/blog-backend.service << EOF
[Unit]
Description=Blog Backend (Gunicorn)
After=network.target

[Service]
User=$DEPLOY_USER
Group=$DEPLOY_USER
WorkingDirectory=$DEPLOY_PATH/recipeServerPython
Environment="PATH=$DEPLOY_PATH/recipeServerPython/venv/bin"
ExecStart=$DEPLOY_PATH/recipeServerPython/venv/bin/gunicorn --config gunicorn.conf.py config.wsgi:application
ExecReload=/bin/kill -s HUP \$MAINPID
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF
    
    # 启动服务
    sudo systemctl daemon-reload
    sudo systemctl enable blog-backend
    sudo systemctl start blog-backend
    
    log_info "Gunicorn 服务配置完成"
}

# 配置 Nginx
setup_nginx() {
    log_info "配置 Nginx..."
    
    # 创建 Nginx 配置文件
    sudo cat > /etc/nginx/sites-available/blog << EOF
server {
    listen 80;
    server_name $DOMAIN_NAME www.$DOMAIN_NAME;
    
    # 临时配置，用于获取 SSL 证书
    location / {
        root $DEPLOY_PATH/recipeServerWeb/dist;
        try_files \$uri \$uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location /static/ {
        alias $DEPLOY_PATH/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location /media/ {
        alias $DEPLOY_PATH/media/;
        expires 1y;
        add_header Cache-Control "public";
    }
}
EOF
    
    # 启用站点
    sudo ln -sf /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # 测试配置
    sudo nginx -t
    
    # 重启 Nginx
    sudo systemctl restart nginx
    
    log_info "Nginx 配置完成"
}

# 获取 SSL 证书
setup_ssl() {
    log_info "获取 SSL 证书..."
    
    # 获取 Let's Encrypt 证书
    sudo certbot --nginx -d $DOMAIN_NAME -d www.$DOMAIN_NAME --non-interactive --agree-tos --email admin@$DOMAIN_NAME
    
    # 设置自动续期
    echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
    
    log_info "SSL 证书配置完成"
}

# 设置文件权限
setup_permissions() {
    log_info "设置文件权限..."
    
    # 更改文件所有者
    sudo chown -R $DEPLOY_USER:$DEPLOY_USER $DEPLOY_PATH
    
    # 设置适当的权限
    sudo find $DEPLOY_PATH -type d -exec chmod 755 {} \;
    sudo find $DEPLOY_PATH -type f -exec chmod 644 {} \;
    
    # 可执行文件权限
    sudo chmod +x $DEPLOY_PATH/recipeServerPython/manage.py
    
    log_info "文件权限设置完成"
}

# 创建备份脚本
create_backup_script() {
    log_info "创建备份脚本..."
    
    cat > $DEPLOY_PATH/scripts/backup.sh << EOF
#!/bin/bash

BACKUP_DIR="$DEPLOY_PATH/backup"
DATE=\$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p \$BACKUP_DIR

# 备份数据库
pg_dump -h localhost -U blog_user -d blog_db > \$BACKUP_DIR/db_backup_\$DATE.sql

# 备份媒体文件
tar -czf \$BACKUP_DIR/media_backup_\$DATE.tar.gz -C $DEPLOY_PATH media/

# 清理旧备份 (保留最近 7 天)
find \$BACKUP_DIR -name "*backup*" -mtime +7 -delete

echo "备份完成: \$DATE"
EOF
    
    chmod +x $DEPLOY_PATH/scripts/backup.sh
    
    # 添加到 crontab (每天凌晨 2 点备份)
    echo "0 2 * * * $DEPLOY_PATH/scripts/backup.sh" | crontab -
    
    log_info "备份脚本创建完成"
}

# 验证部署
verify_deployment() {
    log_info "验证部署..."
    
    # 检查服务状态
    if sudo systemctl is-active --quiet blog-backend; then
        log_info "✓ Django 服务运行正常"
    else
        log_error "✗ Django 服务未运行"
    fi
    
    if sudo systemctl is-active --quiet nginx; then
        log_info "✓ Nginx 服务运行正常"
    else
        log_error "✗ Nginx 服务未运行"
    fi
    
    if sudo systemctl is-active --quiet postgresql; then
        log_info "✓ PostgreSQL 服务运行正常"
    else
        log_error "✗ PostgreSQL 服务未运行"
    fi
    
    # 测试 API 接口
    if curl -f -s "http://localhost:8000/api/v1/posts/" > /dev/null; then
        log_info "✓ API 接口响应正常"
    else
        log_warn "✗ API 接口可能存在问题"
    fi
    
    log_info "部署验证完成"
}

# 显示部署结果
show_deployment_info() {
    echo
    echo "🎉 部署完成!"
    echo
    echo "📋 部署信息:"
    echo "  网站地址: https://$DOMAIN_NAME"
    echo "  管理后台: https://$DOMAIN_NAME/admin"
    echo "  API 文档: https://$DOMAIN_NAME/api/v1"
    echo
    echo "🔧 管理命令:"
    echo "  查看后端日志: sudo journalctl -u blog-backend -f"
    echo "  查看 Nginx 日志: sudo tail -f /var/log/nginx/error.log"
    echo "  重启后端服务: sudo systemctl restart blog-backend"
    echo "  重新加载 Nginx: sudo systemctl reload nginx"
    echo
    echo "📁 重要路径:"
    echo "  项目目录: $DEPLOY_PATH"
    echo "  备份目录: $DEPLOY_PATH/backup"
    echo "  日志目录: /var/log"
    echo
    echo "⚠️  记住:"
    echo "  - 定期备份数据"
    echo "  - 监控系统资源使用情况"
    echo "  - 保持系统和依赖更新"
    echo
}

# 主函数
main() {
    echo "=== 个人博客系统生产环境部署 ==="
    echo
    
    check_root
    get_user_input
    install_dependencies
    setup_database
    deploy_application
    setup_backend
    setup_frontend
    setup_gunicorn
    setup_nginx
    setup_ssl
    setup_permissions
    create_backup_script
    verify_deployment
    show_deployment_info
}

# 错误处理
trap 'log_error "部署过程中发生错误，请检查日志"; exit 1' ERR

# 运行主函数
main "$@" 