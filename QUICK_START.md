# 个人博客系统 - 快速开始指南

## 🚀 简介

这是一个基于 Django + React 的现代化个人博客系统，具有以下特点：

- **后端**: Django + Django REST Framework + PostgreSQL + Redis
- **前端**: React 18 + TypeScript + Vite + Tailwind CSS
- **部署**: Docker 容器化 + Nginx 反向代理
- **功能**: 文章管理、分类标签、评论系统、搜索、SEO 优化

---

## 📋 系统要求

### 开发环境
- Python 3.8+
- Node.js 18+
- Git

### 生产环境
- Ubuntu 20.04+ / CentOS 8+ / Debian 11+
- Python 3.8+
- Node.js 18+
- PostgreSQL 13+
- Nginx 1.18+
- Redis 6+ (可选)

---

## 🛠️ 开发环境设置

### 方式一：自动设置（推荐）

```bash
# 1. 克隆项目
git clone <your-repository-url>
cd personalBlogSever

# 2. 运行自动设置脚本
bash scripts/dev_setup.sh

# 3. 启动开发环境
# 方式 A: 分别启动前后端
bash scripts/start_backend.sh   # 终端1
bash scripts/start_frontend.sh  # 终端2

# 方式 B: 同时启动前后端
bash scripts/start_all.sh
```

### 方式二：手动设置

#### 后端设置
```bash
cd recipeServerPython

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 创建环境配置文件
cp .env.example .env
# 编辑 .env 文件设置数据库连接等

# 数据库迁移
python manage.py migrate

# 创建超级用户
python manage.py createsuperuser

# 启动开发服务器
python manage.py runserver
```

#### 前端设置
```bash
cd recipeServerWeb

# 安装依赖
npm install

# 创建环境配置文件
cp .env.example .env
# 编辑 .env 文件设置 API 地址等

# 启动开发服务器
npm run dev
```

---

## 🌐 访问地址

开发环境启动后，可以通过以下地址访问：

- **前端应用**: http://localhost:5173
- **后端 API**: http://localhost:8000/api/v1
- **管理后台**: http://localhost:8000/admin
- **API 文档**: http://localhost:8000/api/v1/docs/

---

## 🚀 生产环境部署

### 方式一：自动部署（推荐）

```bash
# 1. 在服务器上克隆项目
git clone <your-repository-url>
cd personalBlogSever

# 2. 运行部署脚本
bash scripts/deploy.sh

# 脚本将引导你完成以下配置：
# - 输入域名
# - 设置数据库密码
# - 自动安装依赖
# - 配置服务
# - 获取 SSL 证书
```

### 方式二：Docker 部署

```bash
# 1. 安装 Docker 和 Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 2. 创建环境配置
cp .env.example .env.prod
# 编辑 .env.prod 文件

# 3. 启动服务
docker-compose -f docker-compose.prod.yml --env-file .env.prod up -d

# 4. 初始化数据库
docker-compose -f docker-compose.prod.yml exec backend python manage.py migrate
docker-compose -f docker-compose.prod.yml exec backend python manage.py createsuperuser
```

---

## 🔧 常用命令

### 开发环境

```bash
# 后端相关
cd recipeServerPython
python manage.py migrate                    # 应用数据库迁移
python manage.py createsuperuser            # 创建超级用户
python manage.py shell                      # Django shell
python manage.py collectstatic             # 收集静态文件
python manage.py create_sample_blog_data   # 创建示例数据

# 前端相关
cd recipeServerWeb
npm run dev         # 启动开发服务器
npm run build       # 构建生产版本
npm run preview     # 预览构建结果
npm run type-check  # TypeScript 类型检查
npm run lint        # ESLint 检查
```

### 生产环境

```bash
# 服务管理
sudo systemctl start blog-backend      # 启动后端服务
sudo systemctl stop blog-backend       # 停止后端服务
sudo systemctl restart blog-backend    # 重启后端服务
sudo systemctl status blog-backend     # 查看服务状态

# 日志查看
sudo journalctl -u blog-backend -f     # 查看后端日志
sudo tail -f /var/log/nginx/error.log  # 查看 Nginx 错误日志
sudo tail -f /var/log/nginx/access.log # 查看 Nginx 访问日志

# 健康检查
bash scripts/health_check.sh           # 基本健康检查
bash scripts/health_check.sh --report  # 生成详细报告
```

---

## 📊 监控与维护

### 健康检查

```bash
# 基本检查
bash scripts/health_check.sh

# 自动修复
bash scripts/health_check.sh --auto-fix

# 生成报告
bash scripts/health_check.sh --report

# 快速修复
bash scripts/health_check.sh --quick-fix
```

### 备份与恢复

```bash
# 手动备份
bash /var/www/blog/scripts/backup.sh

# 恢复数据库
psql -U blog_user -d blog_db < backup/db_backup_YYYYMMDD_HHMMSS.sql

# 恢复媒体文件
tar -xzf backup/media_backup_YYYYMMDD_HHMMSS.tar.gz -C /var/www/blog/
```

---

## 🐛 故障排除

### 常见问题

#### 1. 后端无法启动
```bash
# 检查错误日志
sudo journalctl -u blog-backend -f

# 检查配置文件
python manage.py check --deploy

# 检查数据库连接
python manage.py dbshell
```

#### 2. 前端构建失败
```bash
# 清理缓存
npm cache clean --force

# 重新安装依赖
rm -rf node_modules package-lock.json
npm install

# 检查环境变量
npm run type-check
```

#### 3. 数据库连接问题
```bash
# 检查 PostgreSQL 服务
sudo systemctl status postgresql

# 测试连接
sudo -u postgres psql -c '\l'

# 重置用户权限
sudo -u postgres psql -c "ALTER USER blog_user CREATEDB;"
```

#### 4. Nginx 配置问题
```bash
# 测试配置
sudo nginx -t

# 重新加载配置
sudo systemctl reload nginx

# 检查端口占用
sudo netstat -tuln | grep :80
```

### 性能优化

#### 数据库优化
```sql
-- 分析查询性能
EXPLAIN ANALYZE SELECT * FROM blog_post WHERE status = 'published';

-- 更新统计信息
ANALYZE;

-- 检查慢查询
SELECT query, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
```

#### 缓存优化
```python
# Django 设置中启用缓存
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}
```

---

## 📚 更多资源

### 文档
- [详细部署指南](DEBUG_AND_DEPLOY.md)
- [API 文档](recipeServerPython/api_docs.md)
- [前端开发指南](recipeServerWeb/README.md)
- [测试指南](recipeServerPython/test_cases.md)

### 配置文件
- [环境变量配置](.env.example)
- [Docker 配置](docker-compose.yml)
- [Nginx 配置](nginx.conf)
- [Git 忽略配置](.gitignore)

### 脚本工具
- [开发环境设置](scripts/dev_setup.sh)
- [生产环境部署](scripts/deploy.sh)
- [健康检查](scripts/health_check.sh)

---

## 🤝 参与贡献

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启 Pull Request

---

## 📄 许可证

本项目基于 MIT 许可证开源。详见 [LICENSE](LICENSE) 文件。

---

## 🆘 获取帮助

如果遇到问题或需要帮助：

1. 查看[故障排除部分](#🐛-故障排除)
2. 阅读相关文档
3. 运行健康检查脚本
4. 查看系统日志

---

**祝你使用愉快！** 🎉 