# 个人博客系统开发项目

## 项目概述
基于 React + TypeScript (前端) 和 Django (后端) 的个人博客系统。

### 技术栈
- **前端**: React 18 + TypeScript + Vite
- **后端**: Django + Django REST Framework
- **数据库**: SQLite (开发环境)
- **认证**: JWT Token
- **样式**: CSS Modules

## 项目结构
```
personalBlogSever/
├── recipeServerPython/     # Django 后端
│   ├── blog/              # 博客应用
│   ├── api/               # API 接口
│   └── manage.py          # Django 管理脚本
├── recipeServerWeb/       # React 前端
│   ├── src/
│   │   ├── components/    # 组件
│   │   ├── pages/         # 页面
│   │   ├── services/      # API 服务
│   │   └── types/         # 类型定义
└── scripts/               # 开发脚本
```

## 开发历程

### 2024-01-XX - 项目初始化与转换
- 将原有的菜谱管理系统转换为博客系统
- 前端路由从 `/recipes/` 改为 `/posts/`
- 更新组件名称和功能：
  - `CreateRecipe.tsx` → `CreatePost.tsx`
  - `RecipeDetail.tsx` → `PostDetail.tsx`
- 修改 `Home.tsx` 为博客文章管理界面
- 更新 `App.tsx` 导航和路由配置

### 2024-01-XX - 认证系统实现
- **添加完整的用户认证功能**
- 安装并配置 `djangorestframework-simplejwt` 用于JWT认证
- 创建认证API视图 (`auth_views.py`)：
  - `RegisterView` - 用户注册接口
  - `LoginView` - 用户登录接口  
  - `UserProfileView` - 用户信息获取/更新接口
  - `refresh_token_view` - JWT令牌刷新接口
- 添加认证相关的URL路由：
  - `/api/v1/auth/register/` - 用户注册
  - `/api/v1/auth/token/` - 用户登录
  - `/api/v1/auth/refresh/` - 刷新令牌
  - `/api/v1/auth/profile/` - 用户信息
- 配置Django REST Framework和JWT设置
- 创建认证API测试脚本 (`test_auth_api.js`)

### 2024-01-XX - API 服务重构
- **前端 API 服务完全重构** (services/api.ts)
- 移除所有菜谱相关接口和数据类型
- 新增博客系统完整API接口：

#### 新增接口类型
- `BlogPost` - 博客文章主体接口
- `Category` - 文章分类接口  
- `Tag` - 文章标签接口
- `Comment` - 评论系统接口
- `SearchResult` - 搜索结果接口
- `ArchiveYear/ArchiveMonth` - 归档信息接口
- `BlogStats` - 博客统计信息接口
- `PaginatedResponse<T>` - 统一分页响应接口

#### 新增API方法
**文章管理**:
- `getPosts()` - 获取文章列表（支持分页、分类、标签、搜索等过滤）
- `getPost(slug)` - 获取文章详情
- `getFeaturedPosts()` - 获取置顶文章
- `getPopularPosts()` - 获取热门文章
- `createPost()` - 创建文章
- `updatePost()` - 更新文章
- `deletePost()` - 删除文章

**分类标签**:
- `getCategories()` - 获取分类列表
- `getCategory(slug)` - 获取分类详情及文章
- `getTags()` - 获取标签列表
- `getTag(slug)` - 获取标签文章

**评论系统**:
- `getComments()` - 获取文章评论
- `createComment()` - 提交评论

**搜索归档**:
- `search()` - 全文搜索
- `getArchive()` - 获取归档信息
- `getStats()` - 获取统计信息

**管理功能**:
- `getPendingPosts()` - 获取待审核文章
- `reviewPost()` - 审核文章
- `getMyPosts()` - 获取我的文章

#### 技术改进
- 请求头添加 API 版本控制 (`Accept: application/json; version=1`)
- 统一分页响应格式
- 支持 FormData 和 JSON 两种数据格式
- 完善的错误处理和认证机制
- 保持原有的认证接口兼容性

## 当前功能特性
- ✅ 用户认证系统（注册/登录/JWT）
- ✅ 博客文章管理（创建/编辑/删除/发布）
- ✅ 分类和标签系统
- ✅ 评论系统
- ✅ 全文搜索
- ✅ 文章归档
- ✅ 统计信息
- ✅ 管理员审核功能
- ✅ 响应式设计
- ✅ 图片上传支持

## 开发环境启动
```bash
# 启动后端
cd recipeServerPython
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# 启动前端  
cd recipeServerWeb
npm install
npm run dev
```

## 访问地址
- 前端: http://localhost:5173
- 后端API: http://localhost:8000/api/v1
- 管理后台: http://localhost:8000/admin

## 下一步计划
- [ ] 完善前端页面组件以匹配新的API接口
- [ ] 实现评论组件
- [ ] 添加搜索页面
- [ ] 实现归档页面
- [ ] 优化UI/UX设计
- [ ] 添加SEO优化
- [ ] 部署配置 