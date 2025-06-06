# 个人博客系统

现代化的全栈个人博客系统，基于 Django + React 构建，提供完整的博客写作、发布、管理和访问体验。

## 项目架构

### 前后端分离架构
```
personalBlogServer/
├── recipeServerPython/     # Django 后端 API 服务
└── recipeServerWeb/        # React 前端应用
```

### 技术栈

#### 后端 (Django)
- **Python 3.x + Django**: 后端框架
- **Django REST Framework**: API 开发
- **PostgreSQL**: 生产数据库
- **SQLite**: 开发数据库
- **Redis**: 缓存 (可选)
- **Nginx**: 反向代理和静态文件服务

#### 前端 (React)
- **React 18 + TypeScript**: 前端框架
- **Vite**: 构建工具
- **React Router**: 路由管理
- **Tailwind CSS**: 样式框架
- **React Query**: 数据状态管理
- **Axios**: HTTP 客户端

## 系统特性

### 核心功能
- 📝 **文章管理**: Markdown 编写，实时预览，自动保存
- 🏷️ **分类标签**: 灵活的内容组织方式
- 💬 **评论系统**: 支持嵌套回复和审核机制
- 🔍 **全文搜索**: 快速查找文章内容
- 📊 **数据统计**: 访问量统计和内容分析
- 🎨 **主题系统**: 多主题支持，深色模式

### 技术特性
- 🚀 **高性能**: 缓存优化，懒加载
- 📱 **响应式**: 完美支持各种设备
- 🔒 **安全性**: CSRF 保护，XSS 防护
- 🔧 **SEO 优化**: meta 标签，sitemap，RSS
- 🐳 **容器化**: Docker 部署支持
- 📈 **可扩展**: 模块化设计，易于扩展

## 快速开始

### 前置要求
- Python 3.8+
- Node.js 18+
- PostgreSQL (生产环境)
- Docker (可选)

### 1. 克隆项目
```bash
git clone <repository-url>
cd personalBlogServer
```

### 2. 后端设置
```bash
cd recipeServerPython

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 数据库配置
cp .env.example .env
# 编辑 .env 文件配置数据库等信息

# 数据库迁移
python manage.py migrate

# 创建超级用户
python manage.py createsuperuser

# 启动开发服务器
python manage.py runserver
```

### 3. 前端设置
```bash
cd ../recipeServerWeb

# 安装依赖
npm install

# 环境配置
cp .env.example .env
# 编辑 .env 文件配置 API 地址等

# 启动开发服务器
npm run dev
```

### 4. 访问应用
- 前端应用: http://localhost:5173
- 后端 API: http://localhost:8000
- 管理后台: http://localhost:8000/admin

## 项目结构

### 后端结构
```
recipeServerPython/
├── blog/                   # 博客核心模块
│   ├── models.py          # 数据模型
│   ├── views.py           # 视图层
│   ├── serializers.py     # API 序列化
│   └── urls.py            # 路由配置
├── api/                   # API 接口
├── media/                 # 媒体文件
├── static/                # 静态文件
├── templates/             # 模板文件
├── manage.py              # Django 管理脚本
└── requirements.txt       # Python 依赖
```

### 前端结构
```
recipeServerWeb/
├── src/
│   ├── components/        # React 组件
│   ├── pages/            # 页面组件
│   ├── hooks/            # 自定义 Hooks
│   ├── services/         # API 服务
│   ├── types/            # TypeScript 类型
│   └── utils/            # 工具函数
├── public/               # 公共资源
└── package.json          # 前端依赖
```

## 数据模型

### 核心模型
- **Post**: 博客文章
- **Category**: 文章分类
- **Tag**: 文章标签
- **Comment**: 评论系统
- **Media**: 媒体文件管理
- **SiteSettings**: 站点配置

### 模型关系
```
Post ←→ Category (多对多)
Post ←→ Tag (多对多)
Post ←→ Comment (一对多)
Post ←→ Media (一对多)
Comment ←→ Comment (自关联，支持回复)
```

## API 接口

### 主要端点
- `GET /api/v1/posts/` - 获取文章列表
- `GET /api/v1/posts/{slug}/` - 获取文章详情
- `GET /api/v1/categories/` - 获取分类列表
- `GET /api/v1/tags/` - 获取标签列表
- `POST /api/v1/comments/` - 提交评论
- `GET /api/v1/search/` - 搜索文章

详细 API 文档: [API 文档](recipeServerPython/api_docs.md)

## 部署

### Docker 部署 (推荐)
```bash
# 构建镜像
docker-compose build

# 启动服务
docker-compose up -d

# 数据库迁移
docker-compose exec backend python manage.py migrate

# 创建超级用户
docker-compose exec backend python manage.py createsuperuser
```

### 传统部署
详见各子项目的部署文档：
- [后端部署文档](recipeServerPython/deploy.md)
- [前端部署文档](recipeServerWeb/deploy.md)

## 开发指南

### 开发工作流
1. 查看 [需求文档](recipeServerPython/doc/requirement.md)
2. 阅读 [项目文档](recipeServerPython/project.md)
3. 编写测试用例
4. 实现功能代码
5. 运行测试验证

### 代码规范
- 后端遵循 PEP 8 规范
- 前端使用 ESLint + Prettier
- 提交消息遵循 Conventional Commits

### 测试
```bash
# 后端测试
cd recipeServerPython
python manage.py test

# 前端测试
cd recipeServerWeb
npm test
```

## 功能路线图

### 已完成 ✅
- [x] 基础博客功能
- [x] 文章分类和标签
- [x] 评论系统
- [x] 搜索功能
- [x] REST API

### 开发中 🚧
- [ ] Markdown 编辑器集成
- [ ] 主题系统
- [ ] 性能优化

### 计划中 📋
- [ ] 多语言支持
- [ ] 社交登录
- [ ] 移动端 App
- [ ] 订阅推送
- [ ] 数据分析面板

## 贡献

欢迎贡献代码！请遵循以下步骤：

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证。详情请查看 [LICENSE](LICENSE) 文件。

## 联系方式

如有问题或建议，请通过以下方式联系：

- 提交 Issue
- 发送邮件至: your-email@example.com
- 访问项目主页: https://your-blog.com

---

⭐ 如果这个项目对你有帮助，请给它一个星标！ 