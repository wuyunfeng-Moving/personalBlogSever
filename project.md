# 个人博客系统

## 项目概述
一个完整的个人博客系统，包含Django后端和React前端，支持文章创建、编辑、分类管理、地理位置标记和地图展示功能。

## 最新功能更新

### 🗺️ 地理位置选择器改进 (最新)
**需求**: 文章编辑中的地图没有展示出来，将地图作为一个组件，通过"添加地址"来打开。

**实现内容**:
1. **新建LocationSelector组件** (`src/components/LocationSelector.tsx`)
   - 模态框设计：地图通过点击"添加地址"按钮在模态框中打开
   - 用户友好界面：
     - 未选择位置时显示虚线按钮"点击添加地理位置"
     - 已选择位置时显示位置信息卡片，包含修改和移除功能
   - 强大的地图功能：
     - 地图点击选择位置
     - 可拖拽标记精确调整位置
     - 搜索功能，支持地点名称搜索
     - 自动地理编码获取地址名称

2. **更新CreatePost页面**
   - 替换原有的LocationPicker为新的LocationSelector
   - 保持数据格式完全兼容

3. **测试页面**
   - 创建LocationTest页面 (`/location-test`) 用于独立测试
   - 创建ModalTest页面 (`/modal-test`) 用于Modal功能测试

**技术特点**:
- 响应式设计，模态框适配不同屏幕尺寸  
- 完善的错误处理和加载状态
- 地图实例按需创建和销毁，性能优化
- 完整的TypeScript类型定义

### 🐛 删除功能调试 (进行中)
**问题**: 点击删除按钮后，modal没有执行

**调试措施**:
1. 添加详细的控制台日志输出
2. 检查Modal对象和Modal.confirm函数的可用性
3. 增强错误处理和用户反馈
4. 创建ModalTest测试页面验证Modal.confirm功能

**当前状态**: 正在调试中，已添加更多日志和错误检查

## 核心功能

### 后端功能 (Django)
- **用户认证系统**: 注册、登录、JWT Token认证
- **文章管理**: 
  - CRUD操作 (创建、读取、更新、删除)
  - 文章状态管理 (草稿、待审核、已发布、已拒绝)
  - 地理位置信息存储 (经纬度、位置名称)
- **分类和标签系统**: 灵活的内容组织
- **文章历史记录**: 版本控制和变更追踪
- **地理位置API**: 支持地理位置查询和存储

### 前端功能 (React + TypeScript)
- **响应式界面**: 基于Ant Design的现代UI
- **文章管理**: 
  - 富文本编辑器
  - 实时预览
  - 图片上传
  - 地理位置选择
- **地图展示**: 
  - 基于高德地图的文章地理位置展示
  - 文章标签的可视化展示
  - 交互式地图标记
- **用户体验**: 
  - 加载状态管理
  - 错误处理
  - 用户反馈

## 技术栈

### 后端
- **框架**: Django 4.2+ 
- **数据库**: PostgreSQL (生产) / SQLite (开发)
- **认证**: Django REST Framework + JWT
- **API**: Django REST Framework
- **历史记录**: django-simple-history

### 前端  
- **框架**: React 19 + TypeScript
- **状态管理**: Redux Toolkit
- **UI组件**: Ant Design 5.24+
- **路由**: React Router 7+
- **地图**: 高德地图API (@amap/amap-jsapi-loader)
- **HTTP客户端**: Axios

### 开发工具
- **构建工具**: Vite
- **代码检查**: ESLint + TypeScript ESLint
- **包管理**: npm

## 项目结构

```
personalBlogSever/
├── recipeServerPython/          # Django后端
│   ├── blog/                    # 博客应用
│   ├── users/                   # 用户应用  
│   ├── config/                  # 项目配置
│   └── manage.py
└── recipeServerWeb/             # React前端
    ├── src/
    │   ├── components/          # 可复用组件
    │   │   ├── LocationSelector.tsx    # 地理位置选择器(新)
    │   │   ├── LocationPicker.tsx      # 原地理位置选择器
    │   │   └── PostsMap.tsx            # 地图展示组件
    │   ├── pages/               # 页面组件
    │   │   ├── CreatePost.tsx          # 文章创建/编辑
    │   │   ├── Home.tsx               # 首页
    │   │   ├── LocationTest.tsx       # 地理位置测试页面
    │   │   └── ModalTest.tsx          # Modal测试页面
    │   ├── services/            # API服务
    │   └── store/               # Redux状态管理
    └── package.json
```

## 部署说明

### Docker部署 (推荐)
项目包含完整的Docker配置文件，支持一键部署：
- `docker-compose.yml`: 完整的服务编排
- `Dockerfile.backend`: Django后端镜像
- `Dockerfile.frontend`: React前端镜像
- Nginx反向代理配置
- PostgreSQL和Redis服务

### 手动部署
详细的手动部署说明请参考项目文档。

## 开发指南

### 开发流程规范
每次开发新功能或修改将遵循以下流程：
1. 项目说明更新 - 修改project.md，新增需求描述
2. 接口文档更新 - 更新api_docs.md，添加新接口或修改现有接口  
3. 测试用例更新 - 更新test_cases.md，添加新测试场景
4. 测试代码更新 - 编写相应的测试函数
5. 功能代码修改 - 实现或修改功能
6. 测试验证 - 运行测试确保所有代码正常工作

### 环境要求
- **后端**: Python 3.8+, Django 4.2+
- **前端**: Node.js 16+, npm 8+
- **数据库**: PostgreSQL 12+ (生产环境)

### 启动开发环境

1. **启动后端**:
```bash
cd recipeServerPython
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

2. **启动前端**:
```bash
cd recipeServerWeb  
npm install
npm start
```

## 测试页面
- `/location-test`: 地理位置选择器功能测试
- `/modal-test`: Modal.confirm功能测试

## 最新需求 (进行中)

### 🎯 用户界面改进需求
1. **文章详细页面重设计**: 创建专门的文章详情展示页面（区别于编辑页面），显示完整的文章信息和地理位置
2. **我的文章页面功能增强**: 添加搜索功能和分类筛选功能
3. **界面简化**: 删除文章分类tab，简化导航结构
4. **代码清理**: 移除测试用的页面和代码
5. **表单简化**: 在前端移除文章摘要功能，简化创建/编辑流程

## 当前开发状态
- ✅ 地理位置选择器改进完成
- ✅ 删除功能Modal问题修复完成
- 🔄 用户界面改进需求实施中
- 📋 下一步: 文章详情页面设计和搜索功能实现

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