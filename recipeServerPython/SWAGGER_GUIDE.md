# Swagger API 文档使用指南

## 📚 访问地址

启动Django服务器后，可以通过以下地址访问API文档：

- **Swagger UI**: http://localhost:8000/api/docs/
- **ReDoc**: http://localhost:8000/api/redoc/
- **OpenAPI Schema**: http://localhost:8000/api/schema/

## 🚀 快速开始

### 1. 启动服务器
```bash
cd recipeServerPython
python manage.py runserver
```

### 2. 访问Swagger UI
在浏览器中打开 http://localhost:8000/api/docs/

### 3. 浏览API端点
API按功能模块分类：
- **认证** - 用户注册、登录、令牌管理
- **文章** - 博客文章的增删改查
- **分类** - 文章分类管理
- **标签** - 文章标签管理

## 🔐 认证测试

### 获取访问令牌
1. 在Swagger UI中找到 `POST /api/v1/auth/token/` 端点
2. 点击 "Try it out"
3. 输入用户名和密码：
   ```json
   {
     "username": "testuser",
     "password": "password123"
   }
   ```
4. 点击 "Execute"
5. 复制响应中的 `access` 令牌

### 使用令牌认证
1. 点击页面顶部的 "Authorize" 按钮
2. 在弹出框中输入：`Bearer your_access_token_here`
3. 点击 "Authorize"
4. 现在可以测试需要认证的端点了

## 📝 常用API测试

### 获取文章列表
- **端点**: `GET /api/v1/posts/`
- **参数**: 
  - `page`: 页码
  - `category`: 分类筛选
  - `search`: 搜索关键词

### 创建文章
- **端点**: `POST /api/v1/posts/`
- **需要认证**: 是
- **示例数据**:
  ```json
  {
    "title": "我的新文章",
    "content": "文章内容...",
    "excerpt": "文章摘要",
    "status": "published",
    "category_ids": [3],
    "tag_names": ["Python", "Django"]
  }
  ```

### 获取分类列表
- **端点**: `GET /api/v1/categories/`
- **无需认证**

## 🛠️ 开发者提示

### 查看原始Schema
访问 http://localhost:8000/api/schema/ 可以获取完整的OpenAPI 3.0规范文件（YAML格式）

### 生成客户端代码
可以使用OpenAPI Generator等工具基于Schema生成各种语言的客户端代码：
```bash
# 示例：生成JavaScript客户端
openapi-generator-cli generate -i http://localhost:8000/api/schema/ -g javascript -o ./api-client
```

### 自定义文档
在视图中使用 `@extend_schema` 装饰器可以自定义API文档：
```python
from drf_spectacular.utils import extend_schema

@extend_schema(
    tags=['自定义标签'],
    summary='端点摘要',
    description='详细描述',
    examples=[...]
)
def my_api_view(request):
    pass
```

## 🔧 配置说明

Swagger配置位于 `recipe_server/settings.py` 中的 `SPECTACULAR_SETTINGS`：

```python
SPECTACULAR_SETTINGS = {
    'TITLE': '个人博客 API',
    'DESCRIPTION': '现代化个人博客系统的 RESTful API',
    'VERSION': '1.0.0',
    # ... 其他配置
}
```

## 📞 支持

如果遇到问题：
1. 检查Django服务器是否正常运行
2. 确认数据库连接正常
3. 查看Django日志获取详细错误信息
4. 参考 `api_docs.md` 获取更多API信息 