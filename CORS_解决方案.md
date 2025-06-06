# CORS 跨域问题解决方案

## 问题描述
前端（运行在 `localhost:8001`）访问后端API（运行在 `127.0.0.1:8000`）时遇到CORS错误：
```
Access to XMLHttpRequest at 'http://127.0.0.1:8000/api/v1/auth/register/' from origin 'http://localhost:8001' has been blocked by CORS policy
```

## 解决方案

### 1. 安装并配置 django-cors-headers

#### 安装包
```bash
cd recipeServerPython
venv\Scripts\activate  # Windows
# 或 source venv/bin/activate  # Linux/macOS
pip install django-cors-headers
```

#### 更新 Django 设置
在 `recipeServerPython/recipe_server/settings.py` 中：

**添加到 INSTALLED_APPS:**
```python
INSTALLED_APPS = [
    # ... 其他应用
    'corsheaders',  # 添加这一行
    # ... 其他应用
]
```

**添加到 MIDDLEWARE (必须在最前面):**
```python
MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # 添加这一行
    'django.middleware.security.SecurityMiddleware',
    # ... 其他中间件
]
```

**更新 ALLOWED_HOSTS:**
```python
ALLOWED_HOSTS = ['localhost', '127.0.0.1', '0.0.0.0']
```

**添加 CORS 配置:**
```python
# CORS 配置
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:8001",
    "http://127.0.0.1:8001",
]

CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = DEBUG  # 在开发环境中允许所有源

CORS_ALLOWED_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]
```

### 2. 配置前端代理（可选）

在 `recipeServerWeb/vite.config.ts` 中添加代理配置：

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 8001,
    allowedHosts: ['*'],
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
```

### 3. 统一API地址

在 `recipeServerWeb/src/services/api.ts` 中：

```typescript
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1';
```

### 4. 重启服务器

```bash
# 重启后端
cd recipeServerPython
venv\Scripts\activate
python manage.py runserver

# 重启前端
cd recipeServerWeb
npm run dev
```

## 验证解决方案

1. 访问前端：`http://localhost:8001`
2. 尝试注册或登录功能
3. 检查浏览器控制台是否还有CORS错误

## 常见问题

### Q: 仍然有CORS错误？
A: 确保：
- Django服务器已重启
- 前端服务器已重启
- 浏览器缓存已清除

### Q: 其他端口的CORS错误？
A: 在 `CORS_ALLOWED_ORIGINS` 中添加相应的端口

### Q: 生产环境配置？
A: 设置 `CORS_ALLOW_ALL_ORIGINS = False` 并只添加生产域名到 `CORS_ALLOWED_ORIGINS`

## 安全注意事项

- 生产环境中不要使用 `CORS_ALLOW_ALL_ORIGINS = True`
- 只允许必要的域名访问API
- 定期检查和更新CORS配置 