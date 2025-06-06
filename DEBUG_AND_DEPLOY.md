# 个人博客系统 - 调试与部署指南

## 目录
- [开发环境调试](#开发环境调试)
- [生产环境部署](#生产环境部署)
- [Docker 部署](#docker-部署)
- [故障排除](#故障排除)
- [性能优化](#性能优化)
- [监控与日志](#监控与日志)

---

## 开发环境调试

### 1. 后端调试 (Django)

#### 1.1 环境准备
```bash
cd recipeServerPython

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 创建环境配置文件
cp .env.example .env
```

#### 1.2 环境变量配置 (.env)
```env
# 调试模式
DEBUG=True
SECRET_KEY=your-secret-key-for-development

# 数据库配置
DATABASE_URL=sqlite:///db.sqlite3
# 或 PostgreSQL: DATABASE_URL=postgresql://user:password@localhost:5432/blog_db

# Redis 配置 (可选)
REDIS_URL=redis://localhost:6379/0

# 允许的主机
ALLOWED_HOSTS=localhost,127.0.0.1

# 邮件配置 (开发环境可选)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend

# 媒体文件配置
MEDIA_ROOT=media/
STATIC_ROOT=static/

# API 调试
CORS_ALLOW_ALL_ORIGINS=True
```

#### 1.3 数据库设置
```bash
# 应用迁移
python manage.py migrate

# 创建超级用户
python manage.py createsuperuser

# 创建测试数据
python manage.py create_sample_blog_data
```

#### 1.4 启动开发服务器
```bash
# 启动 Django 开发服务器
python manage.py runserver

# 或指定端口
python manage.py runserver 0.0.0.0:8000
```

#### 1.5 Django 调试工具

**安装调试工具**:
```bash
pip install django-debug-toolbar django-extensions
```

**在 settings.py 中添加**:
```python
# settings.py
if DEBUG:
    INSTALLED_APPS += ['debug_toolbar', 'django_extensions']
    MIDDLEWARE += ['debug_toolbar.middleware.DebugToolbarMiddleware']
    
    # Debug Toolbar 配置
    INTERNAL_IPS = ['127.0.0.1', 'localhost']
    
    DEBUG_TOOLBAR_CONFIG = {
        'SHOW_TOOLBAR_CALLBACK': lambda request: DEBUG,
    }
```

**常用调试命令**:
```bash
# 查看路由
python manage.py show_urls

# 数据库 shell
python manage.py dbshell

# Django shell
python manage.py shell

# 检查项目配置
python manage.py check

# 查看迁移状态
python manage.py showmigrations
```

### 2. 前端调试 (React)

#### 2.1 环境准备
```bash
cd recipeServerWeb

# 安装依赖
npm install
# 或 yarn install

# 创建环境配置
cp .env.example .env
```

#### 2.2 环境变量配置 (.env)
```env
# API 配置
VITE_API_BASE_URL=http://localhost:8000/api/v1

# 应用配置
VITE_APP_TITLE=个人博客 - 开发环境
VITE_APP_DESCRIPTION=基于 React + Django 的博客系统

# 调试配置
VITE_NODE_ENV=development

# 第三方服务 (开发环境可选)
VITE_DISQUS_SHORTNAME=your-disqus-shortname
VITE_GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX
```

#### 2.3 启动开发服务器
```bash
# 启动 Vite 开发服务器
npm run dev

# 或指定端口
npm run dev -- --port 3000
```

#### 2.4 React 调试工具

**浏览器扩展**:
- React Developer Tools
- Redux DevTools (如果使用 Redux)

**代码调试**:
```javascript
// 在组件中添加断点
debugger;

// 使用 console 调试
console.log('Debug info:', data);
console.table(arrayData);
console.group('API Response');
console.log(response);
console.groupEnd();
```

**网络请求调试**:
```typescript
// services/api.ts - 添加请求拦截器
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config);
    return config;
  },
  (error) => {
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response);
    return response;
  },
  (error) => {
    console.error('Response Error:', error);
    return Promise.reject(error);
  }
);
```

### 3. 全栈调试技巧

#### 3.1 API 接口测试
```bash
# 使用 curl 测试 API
curl -X GET http://localhost:8000/api/v1/posts/
curl -X GET http://localhost:8000/api/v1/posts/1/ -H "Accept: application/json"

# 使用 httpie (推荐)
http GET localhost:8000/api/v1/posts/
http POST localhost:8000/api/v1/comments/ post=1 content="测试评论"
```

#### 3.2 数据库调试
```sql
-- 在 Django shell 中执行原始 SQL
from django.db import connection
cursor = connection.cursor()
cursor.execute("SELECT * FROM blog_post LIMIT 5")
results = cursor.fetchall()
```

#### 3.3 日志配置
**Django 日志配置**:
```python
# settings.py
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'DEBUG',
            'class': 'logging.FileHandler',
            'filename': 'debug.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file', 'console'],
            'level': 'INFO',
            'propagate': True,
        },
        'blog': {
            'handlers': ['file', 'console'],
            'level': 'DEBUG',
            'propagate': True,
        },
    },
}
```

---

## 生产环境部署

### 1. 服务器准备

#### 1.1 系统要求
- Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- Python 3.8+
- Node.js 18+
- PostgreSQL 13+
- Nginx 1.18+
- Redis 6+ (可选)

#### 1.2 安装系统依赖
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install -y python3 python3-venv python3-pip nodejs npm postgresql postgresql-contrib nginx redis-server

# CentOS/RHEL
sudo dnf install -y python3 python3-pip nodejs npm postgresql postgresql-server postgresql-contrib nginx redis
```

### 2. 数据库配置

#### 2.1 PostgreSQL 设置
```bash
# 启动 PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 创建数据库和用户
sudo -u postgres psql << EOF
CREATE DATABASE blog_db;
CREATE USER blog_user WITH PASSWORD 'secure_password_here';
ALTER ROLE blog_user SET client_encoding TO 'utf8';
ALTER ROLE blog_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE blog_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE blog_db TO blog_user;
\q
EOF
```

### 3. 后端部署

#### 3.1 代码部署
```bash
# 创建应用目录
sudo mkdir -p /var/www/blog
sudo chown $USER:$USER /var/www/blog
cd /var/www/blog

# 克隆代码
git clone <your-repository-url> .

# 后端设置
cd recipeServerPython
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn psycopg2-binary
```

#### 3.2 生产环境配置
```bash
# 创建生产环境配置
cat > .env << EOF
DEBUG=False
SECRET_KEY=$(python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())')

# 数据库
DATABASE_URL=postgresql://blog_user:secure_password_here@localhost:5432/blog_db

# Redis
REDIS_URL=redis://localhost:6379/0

# 域名配置
ALLOWED_HOSTS=your-domain.com,www.your-domain.com

# 静态文件
STATIC_ROOT=/var/www/blog/static/
MEDIA_ROOT=/var/www/blog/media/

# 邮件配置
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password

# 安全设置
SECURE_SSL_REDIRECT=True
SECURE_HSTS_SECONDS=31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS=True
SECURE_HSTS_PRELOAD=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
EOF
```

#### 3.3 数据库迁移和静态文件
```bash
# 应用迁移
python manage.py migrate

# 收集静态文件
python manage.py collectstatic --noinput

# 创建超级用户
python manage.py createsuperuser
```

#### 3.4 Gunicorn 配置
```bash
# 创建 Gunicorn 配置文件
cat > gunicorn.conf.py << EOF
bind = "127.0.0.1:8000"
workers = 3
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
timeout = 30
keepalive = 5
preload_app = True
user = "www-data"
group = "www-data"
tmp_upload_dir = None
secure_scheme_headers = {
    'X-FORWARDED-PROTOCOL': 'ssl',
    'X-FORWARDED-PROTO': 'https',
    'X-FORWARDED-SSL': 'on'
}
EOF
```

#### 3.5 Systemd 服务配置
```bash
# 创建 systemd 服务文件
sudo cat > /etc/systemd/system/blog-backend.service << EOF
[Unit]
Description=Blog Backend (Gunicorn)
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/blog/recipeServerPython
Environment="PATH=/var/www/blog/recipeServerPython/venv/bin"
ExecStart=/var/www/blog/recipeServerPython/venv/bin/gunicorn --config gunicorn.conf.py config.wsgi:application
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
```

### 4. 前端部署

#### 4.1 构建前端
```bash
cd /var/www/blog/recipeServerWeb

# 安装依赖
npm ci --only=production

# 创建生产环境配置
cat > .env.production << EOF
VITE_API_BASE_URL=https://your-domain.com/api/v1
VITE_APP_TITLE=我的个人博客
VITE_APP_DESCRIPTION=分享技术心得与生活感悟
VITE_DISQUS_SHORTNAME=your-disqus-shortname
VITE_GOOGLE_ANALYTICS_ID=GA-XXXXXXXXX
EOF

# 构建生产版本
npm run build
```

### 5. Nginx 配置

#### 5.1 Nginx 虚拟主机配置
```bash
# 创建 Nginx 配置文件
sudo cat > /etc/nginx/sites-available/blog << 'EOF'
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL 证书配置
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    # SSL 安全配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # 安全头
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    
    # 文件上传大小限制
    client_max_body_size 100M;
    
    # 前端静态文件
    location / {
        root /var/www/blog/recipeServerWeb/dist;
        try_files $uri $uri/ /index.html;
        
        # 缓存静态资源
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API 接口
    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        proxy_redirect off;
    }
    
    # Django 管理后台
    location /admin/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # 静态文件
    location /static/ {
        alias /var/www/blog/static/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # 媒体文件
    location /media/ {
        alias /var/www/blog/media/;
        expires 1y;
        add_header Cache-Control "public";
    }
    
    # RSS 和站点地图
    location ~ ^/(rss|sitemap\.xml|robots\.txt)/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# 启用站点
sudo ln -s /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. SSL 证书配置

#### 6.1 使用 Let's Encrypt
```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# 设置自动续期
sudo crontab -e
# 添加以下行：
# 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## Docker 部署

### 1. 单机 Docker 部署

#### 1.1 准备 Docker 环境
```bash
# 安装 Docker 和 Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 将用户添加到 docker 组
sudo usermod -aG docker $USER
```

#### 1.2 创建 Docker 配置
```bash
# 克隆项目
git clone <your-repository-url> blog
cd blog

# 创建环境配置文件
cp docker-compose.yml docker-compose.prod.yml
```

#### 1.3 修改生产环境配置
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: blog_db
      POSTGRES_USER: blog_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    networks:
      - blog_network

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - blog_network

  backend:
    build: 
      context: ./recipeServerPython
      dockerfile: Dockerfile.prod
    environment:
      - DEBUG=False
      - DATABASE_URL=postgresql://blog_user:${DB_PASSWORD}@db:5432/blog_db
      - REDIS_URL=redis://redis:6379/0
      - SECRET_KEY=${SECRET_KEY}
      - ALLOWED_HOSTS=${ALLOWED_HOSTS}
    volumes:
      - media_files:/app/media
      - static_files:/app/static
    depends_on:
      - db
      - redis
    restart: unless-stopped
    networks:
      - blog_network

  frontend:
    build:
      context: ./recipeServerWeb
      dockerfile: Dockerfile.prod
      args:
        - VITE_API_BASE_URL=${API_BASE_URL}
    restart: unless-stopped
    networks:
      - blog_network

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.prod.conf:/etc/nginx/nginx.conf
      - static_files:/var/www/static
      - media_files:/var/www/media
      - /etc/letsencrypt:/etc/letsencrypt
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
      - frontend
    restart: unless-stopped
    networks:
      - blog_network

volumes:
  postgres_data:
  redis_data:
  media_files:
  static_files:

networks:
  blog_network:
    driver: bridge
```

#### 1.4 创建环境变量文件
```bash
# .env.prod
DB_PASSWORD=secure_database_password_here
SECRET_KEY=secure_django_secret_key_here
ALLOWED_HOSTS=your-domain.com,www.your-domain.com
API_BASE_URL=https://your-domain.com/api/v1
```

#### 1.5 部署命令
```bash
# 构建并启动服务
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

# 执行数据库迁移
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate

# 创建超级用户
docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser

# 收集静态文件
docker-compose -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
```

### 2. Docker 生产环境 Dockerfile

#### 2.1 后端 Dockerfile.prod
```dockerfile
# recipeServerPython/Dockerfile.prod
FROM python:3.11-slim

# 设置环境变量
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# 创建应用用户
RUN groupadd -r django && useradd -r -g django django

# 设置工作目录
WORKDIR /app

# 安装 Python 依赖
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制项目文件
COPY . .

# 创建静态文件和媒体文件目录
RUN mkdir -p /app/static /app/media
RUN chown -R django:django /app

# 切换到非 root 用户
USER django

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "config.wsgi:application"]
```

#### 2.2 前端 Dockerfile.prod
```dockerfile
# recipeServerWeb/Dockerfile.prod
FROM node:18-alpine as builder

WORKDIR /app

# 复制 package 文件
COPY package*.json ./
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建参数
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# 构建应用
RUN npm run build

# 生产阶段
FROM nginx:alpine

# 复制构建文件
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 Nginx 配置
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露端口
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

## 故障排除

### 1. 常见问题诊断

#### 1.1 后端问题
```bash
# 检查 Django 服务状态
sudo systemctl status blog-backend

# 查看 Django 日志
sudo journalctl -u blog-backend -f

# 检查数据库连接
python manage.py dbshell

# 验证配置
python manage.py check --deploy

# 测试 API 接口
curl -I http://localhost:8000/api/v1/posts/
```

#### 1.2 前端问题
```bash
# 检查构建输出
npm run build

# 检查 Nginx 配置
sudo nginx -t

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# 检查静态文件权限
ls -la /var/www/blog/recipeServerWeb/dist/
```

#### 1.3 数据库问题
```bash
# 检查 PostgreSQL 状态
sudo systemctl status postgresql

# 查看数据库连接
sudo -u postgres psql -c "\l"

# 检查数据库用户权限
sudo -u postgres psql -c "\du"

# 查看 Django 迁移状态
python manage.py showmigrations
```

### 2. 性能问题排查

#### 2.1 数据库性能
```sql
-- 查看慢查询
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- 查看数据库大小
SELECT pg_size_pretty(pg_database_size('blog_db'));

-- 分析表统计信息
ANALYZE;
```

#### 2.2 应用性能
```bash
# 使用 Django Debug Toolbar
# 在开发环境中启用，查看 SQL 查询和性能数据

# 使用 cProfile 分析性能
python -m cProfile -o profile.stats manage.py runserver

# 内存使用分析
pip install memory-profiler
python -m memory_profiler views.py
```

### 3. 监控脚本

#### 3.1 健康检查脚本
```bash
#!/bin/bash
# health_check.sh

echo "=== 系统健康检查 ==="

# 检查服务状态
echo "1. 检查服务状态:"
systemctl is-active blog-backend && echo "✓ Django 服务正常" || echo "✗ Django 服务异常"
systemctl is-active nginx && echo "✓ Nginx 服务正常" || echo "✗ Nginx 服务异常"
systemctl is-active postgresql && echo "✓ PostgreSQL 服务正常" || echo "✗ PostgreSQL 服务异常"

# 检查端口
echo "2. 检查端口:"
netstat -tuln | grep :8000 && echo "✓ Django 端口 8000 开放" || echo "✗ Django 端口 8000 未开放"
netstat -tuln | grep :80 && echo "✓ HTTP 端口 80 开放" || echo "✗ HTTP 端口 80 未开放"
netstat -tuln | grep :443 && echo "✓ HTTPS 端口 443 开放" || echo "✗ HTTPS 端口 443 未开放"

# 检查 API 响应
echo "3. 检查 API 响应:"
curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/v1/posts/ | grep 200 && echo "✓ API 响应正常" || echo "✗ API 响应异常"

# 检查磁盘空间
echo "4. 检查磁盘空间:"
df -h | grep -E "/(var|home)" | awk '{print $5 " " $6}' | while read output; do
  usage=$(echo $output | awk '{print $1}' | sed 's/%//g')
  partition=$(echo $output | awk '{print $2}')
  if [ $usage -ge 90 ]; then
    echo "✗ 磁盘使用率过高: $partition ($usage%)"
  else
    echo "✓ 磁盘空间正常: $partition ($usage%)"
  fi
done

echo "=== 检查完成 ==="
```

---

## 性能优化

### 1. 数据库优化

#### 1.1 索引优化
```python
# models.py 中添加数据库索引
class Post(models.Model):
    title = models.CharField(max_length=200, db_index=True)
    slug = models.SlugField(unique=True, db_index=True)
    published_at = models.DateTimeField(db_index=True)
    
    class Meta:
        indexes = [
            models.Index(fields=['published_at', 'status']),
            models.Index(fields=['author', 'status']),
        ]
```

#### 1.2 查询优化
```python
# views.py 中优化查询
from django.db.models import Prefetch

# 使用 select_related 和 prefetch_related
posts = Post.objects.select_related('author').prefetch_related(
    'categories', 'tags',
    Prefetch('comments', queryset=Comment.objects.filter(is_approved=True))
)

# 使用 only() 减少查询字段
posts = Post.objects.only('title', 'slug', 'excerpt', 'published_at')

# 使用 defer() 延迟加载大字段
posts = Post.objects.defer('content')
```

### 2. 缓存配置

#### 2.1 Redis 缓存设置
```python
# settings.py
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

# 缓存配置
CACHE_MIDDLEWARE_ALIAS = 'default'
CACHE_MIDDLEWARE_SECONDS = 600
CACHE_MIDDLEWARE_KEY_PREFIX = 'blog'

# 会话缓存
SESSION_ENGINE = 'django.contrib.sessions.backends.cache'
SESSION_CACHE_ALIAS = 'default'
```

#### 2.2 视图缓存
```python
from django.views.decorators.cache import cache_page
from django.core.cache import cache

# 页面缓存
@cache_page(60 * 15)  # 15分钟
def post_list(request):
    return render(request, 'posts/list.html', context)

# 手动缓存
def get_popular_posts():
    cache_key = 'popular_posts'
    posts = cache.get(cache_key)
    if posts is None:
        posts = Post.objects.filter(status='published').order_by('-view_count')[:10]
        cache.set(cache_key, posts, 60 * 30)  # 30分钟
    return posts
```

### 3. 前端优化

#### 3.1 代码分割
```typescript
// 路由懒加载
import { lazy, Suspense } from 'react';

const PostDetail = lazy(() => import('./pages/PostDetail'));
const Home = lazy(() => import('./pages/Home'));

function App() {
  return (
    <Router>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/posts/:slug" element={<PostDetail />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
```

#### 3.2 图片优化
```typescript
// 图片懒加载组件
import { useState, useEffect, useRef } from 'react';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({ src, alt, className }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={className}>
      {isInView && (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          style={{ opacity: isLoaded ? 1 : 0 }}
        />
      )}
    </div>
  );
};
```

---

## 监控与日志

### 1. 应用监控

#### 1.1 系统监控脚本
```bash
#!/bin/bash
# monitor.sh

LOG_FILE="/var/log/blog/monitor.log"
DATE=$(date '+%Y-%m-%d %H:%M:%S')

# 检查 CPU 使用率
CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
echo "$DATE - CPU Usage: $CPU_USAGE%" >> $LOG_FILE

# 检查内存使用率
MEM_USAGE=$(free | grep Mem | awk '{printf("%.1f", $3/$2 * 100.0)}')
echo "$DATE - Memory Usage: $MEM_USAGE%" >> $LOG_FILE

# 检查磁盘使用率
DISK_USAGE=$(df -h | grep '/$' | awk '{print $5}')
echo "$DATE - Disk Usage: $DISK_USAGE" >> $LOG_FILE

# 检查应用响应时间
RESPONSE_TIME=$(curl -o /dev/null -s -w "%{time_total}" http://localhost:8000/api/v1/posts/)
echo "$DATE - API Response Time: ${RESPONSE_TIME}s" >> $LOG_FILE

# 如果响应时间超过 2 秒，发送警报
if (( $(echo "$RESPONSE_TIME > 2.0" | bc -l) )); then
    echo "$DATE - WARNING: API response time is too high: ${RESPONSE_TIME}s" >> $LOG_FILE
    # 这里可以添加邮件或 Slack 通知
fi
```

#### 1.2 定期监控
```bash
# 添加到 crontab
crontab -e

# 每 5 分钟运行一次监控
*/5 * * * * /path/to/monitor.sh

# 每天凌晨备份数据库
0 2 * * * /path/to/backup_database.sh

# 每周日志轮转
0 0 * * 0 /usr/sbin/logrotate /etc/logrotate.conf
```

### 2. 日志管理

#### 2.1 日志轮转配置
```bash
# /etc/logrotate.d/blog
/var/log/blog/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload blog-backend
    endscript
}
```

通过这个详细的调试和部署指南，你可以：

1. **开发阶段**：使用调试工具快速定位问题
2. **测试阶段**：验证功能和性能
3. **部署阶段**：选择适合的部署方式
4. **运维阶段**：监控系统状态和性能
5. **优化阶段**：持续改进系统性能

每个阶段都有详细的命令和配置示例，你可以根据实际情况进行调整。 