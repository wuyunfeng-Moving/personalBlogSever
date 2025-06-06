# Gunicorn配置文件

# 基本配置
bind = "127.0.0.1:8000"
workers = 3  # 工作进程数，通常为CPU核数的2-4倍
worker_class = "sync"
worker_connections = 1000
timeout = 30
keepalive = 2

# 应用配置
chdir = "/var/www/personalBlog/recipeServerPython"
pythonpath = "/var/www/personalBlog/recipeServerPython"

# 日志配置
accesslog = "/var/www/personalBlog/logs/gunicorn_access.log"
errorlog = "/var/www/personalBlog/logs/gunicorn_error.log"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'

# 进程配置
daemon = False
pidfile = "/var/www/personalBlog/logs/gunicorn.pid"
user = "www-data"
group = "www-data"
tmp_upload_dir = None

# 性能优化
preload_app = True
max_requests = 1000
max_requests_jitter = 100 