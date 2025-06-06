from .settings import *
import os

# 生产环境设置
DEBUG = False

# 允许的主机 - 替换为您的域名
ALLOWED_HOSTS = [
    'your-domain.com',  # 替换为您的域名
    'www.your-domain.com',  # 替换为您的域名
    'your-server-ip',  # 替换为您的服务器IP
]

# 数据库配置 - 生产环境PostgreSQL
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'personal_blog_prod'),
        'USER': os.environ.get('DB_USER', 'blog_user'),
        'PASSWORD': os.environ.get('DB_PASSWORD', 'your_secure_password'),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
    }
}

# 安全设置
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-production-secret-key-here')

# 静态文件设置
STATIC_URL = '/static/'
STATIC_ROOT = '/var/www/personalBlog/static/'

# 媒体文件设置
MEDIA_URL = '/media/'
MEDIA_ROOT = '/var/www/personalBlog/media/'

# CORS设置 - 生产环境
CORS_ALLOWED_ORIGINS = [
    "https://your-domain.com",  # 替换为您的域名
    "https://www.your-domain.com",  # 替换为您的域名
]

CORS_ALLOW_CREDENTIALS = True

# 安全中间件
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# HTTPS设置（如果使用HTTPS）
# SECURE_SSL_REDIRECT = True
# SECURE_HSTS_SECONDS = 31536000
# SECURE_HSTS_INCLUDE_SUBDOMAINS = True
# SECURE_HSTS_PRELOAD = True

# 日志配置
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.handlers.RotatingFileHandler',
            'filename': '/var/www/personalBlog/logs/django.log',
            'maxBytes': 1024*1024*5,  # 5 MB
            'backupCount': 5,
            'formatter': 'verbose',
        },
    },
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'loggers': {
        'django': {
            'handlers': ['file'],
            'level': 'INFO',
            'propagate': True,
        },
    },
} 