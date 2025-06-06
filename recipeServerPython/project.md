# 项目：Python 个人博客系统

## 0. 开发流程规则

每次功能开发或修改必须遵循以下流程步骤：
1. **项目说明更新** - 首先在project.md中更新需求描述
2. **接口文档更新** - 更新api_docs.md中的相关API接口
3. **测试用例更新** - 在test_cases.md中添加新测试场景
4. **测试代码更新** - 编写对应的测试代码
5. **功能代码修改** - 实现功能代码
6. **测试验证** - 运行测试确保功能正常

## 1. 目标

使用 Python 开发一个现代化的个人博客系统，提供完整的博客写作、发布、管理和访问体验。该系统将提供：
*   一个现代化的管理后台，供博主管理文章、分类、标签和系统设置。
*   一个美观的前台展示界面，供访客浏览文章和互动。
*   一个 RESTful API，供第三方应用程序或移动App访问博客数据。
*   全面的SEO优化和性能优化功能。
*   完善的评论系统和用户互动功能。

## 2. 核心功能

*   **用户认证:** 为博主提供安全的登录认证系统，支持普通访客的评论功能。
*   **文章管理:**
    *   创建、编辑、保存博客文章（标题、内容、摘要、特色图片等）。
    *   **Markdown支持**: 支持Markdown格式编写，提供实时预览。
    *   **自动保存**: 编辑过程中的修改自动保存草稿。
    *   **状态管理**: 支持草稿(Draft)、已发布(Published)、私密(Private)等状态。
    *   **版本控制**: 记录文章编辑历史，支持版本对比和恢复。
    *   **SEO优化**: 支持自定义meta标题、描述、关键词和友好URL。
*   **分类和标签管理:**
    *   创建和管理文章分类系统。
    *   支持为文章添加多个标签。
    *   提供标签云和分类导航功能。
*   **媒体管理:**
    *   图片上传、压缩和管理功能。
    *   支持拖拽上传和批量操作。
    *   可选CDN集成优化加载速度。
*   **评论系统:**
    *   内置评论功能，支持访客评论和回复。
    *   评论审核机制，防止垃圾评论。
    *   支持嵌套评论和评论通知。
*   **主题和界面:**
    *   响应式设计，支持多设备访问。
    *   支持多种主题切换。
    *   深色/浅色模式支持。
*   **搜索和导航:**
    *   全文搜索功能。
    *   文章归档按日期分类。
    *   相关文章推荐。
*   **API访问:**
    *   检索文章列表的端点，支持分页和筛选。
    *   检索单篇文章详情的端点。
    *   支持按分类、标签、日期筛选文章。
    *   提供RSS源生成。
*   **统计和分析:**
    *   文章访问量统计。
    *   访客统计和流量分析。
    *   热门文章排行。
*   **日志记录与监控:**
    *   全面的系统日志记录（访问、错误、操作记录）。
    *   性能监控和异常报警。

## 3. 技术栈

*   **语言:** Python 3.x
*   **Web 框架:** Django
*   **API 框架:** Django REST Framework
*   **数据库:** PostgreSQL (生产) / SQLite (开发)
*   **前端:** Django模板 + Bootstrap/Tailwind CSS + 少量JavaScript
*   **富文本编辑:** Markdown编辑器 (如Editor.md或类似组件)
*   **缓存:** Redis (可选)
*   **搜索:** Django内置全文搜索或Elasticsearch (高级需求)
*   **部署:** Docker + Nginx

## 4. 数据模型

*   **`Post` (文章):**
    *   `id`, `title` (标题), `slug` (URL别名), `content` (内容-Markdown), `excerpt` (摘要), `featured_image` (特色图片), `author` (作者 - ForeignKey 到 User), `created_at` (创建时间), `updated_at` (更新时间), `published_at` (发布时间).
    *   `status` (状态): 字符串 (`draft`, `published`, `private`).
    *   `categories` (分类): ManyToManyField 关联到 `Category`.
    *   `tags` (标签): ManyToManyField 关联到 `Tag`.
    *   `view_count` (浏览次数): 整数
    *   `is_featured` (是否置顶): 布尔值
    *   `meta_title`, `meta_description`, `meta_keywords` (SEO字段)
    *   `allow_comments` (允许评论): 布尔值
    *   **`previous_version`**: ForeignKey 到 `self` (版本控制用)

*   **`Category` (分类):**
    *   `id`, `name` (名称), `slug` (URL别名), `description` (描述), `parent` (父分类 - ForeignKey 到 self), `created_at`, `updated_at`.
    *   `post_count` (文章数量): 计算字段

*   **`Tag` (标签):**
    *   `id`, `name` (名称), `slug` (URL别名), `created_at`.
    *   `post_count` (文章数量): 计算字段

*   **`Comment` (评论):**
    *   `id`, `post` (ForeignKey 到 Post), `author_name` (评论者姓名), `author_email` (邮箱), `author_url` (网站), `content` (评论内容), `created_at`, `updated_at`.
    *   `parent` (父评论 - ForeignKey 到 self, 支持回复).
    *   `is_approved` (是否通过审核): 布尔值
    *   `ip_address` (IP地址): 字符串

*   **`Media` (媒体文件):**
    *   `id`, `file` (文件路径), `original_filename` (原始文件名), `file_size` (文件大小), `mime_type` (文件类型), `uploaded_by` (上传者), `created_at`.
    *   `alt_text` (替代文本): 字符串

*   **`PostView` (文章访问记录):**
    *   `post` (ForeignKey 到 Post), `ip_address`, `user_agent`, `created_at`.
    *   用于统计文章访问量

*   **`SiteSettings` (站点设置):**
    *   `site_title`, `site_description`, `site_keywords`, `footer_text`, `posts_per_page`, `allow_comments`, `require_comment_approval` 等配置项

## 5. API 端点

*   `GET /api/v1/posts/`: 获取文章列表，支持分页、分类、标签筛选
*   `GET /api/v1/posts/{slug}/`: 获取单篇文章详情
*   `GET /api/v1/categories/`: 获取分类列表
*   `GET /api/v1/tags/`: 获取标签列表
*   `GET /api/v1/search/?q={query}`: 全文搜索文章
*   `POST /api/v1/comments/`: 提交评论
*   `GET /api/v1/posts/featured/`: 获取置顶文章
*   `GET /api/v1/posts/popular/`: 获取热门文章
*   `GET /rss/`: RSS订阅源
*   `GET /sitemap.xml`: 站点地图

## 6. Web 界面

*   **前台界面 (公开访问):**
    *   首页：展示最新文章、置顶文章、热门标签
    *   文章列表页：分页显示，支持按分类、标签、日期筛选
    *   文章详情页：完整文章内容、评论区、相关文章
    *   分类页面：显示特定分类下的文章
    *   标签页面：显示特定标签的文章
    *   归档页面：按时间归档显示文章
    *   搜索页面：全文搜索结果
    *   关于页面：博主介绍

*   **后台管理界面 (博主专用):**
    *   Django Admin增强：
        *   文章管理：创建、编辑、发布文章，支持Markdown编辑器
        *   分类和标签管理
        *   评论管理和审核
        *   媒体文件管理
        *   统计面板：访问量、评论数、热门内容
        *   站点设置配置
        *   用户管理

## 7. 内容发布流程

1. **创建文章:** 博主在后台创建新文章，选择Markdown编辑器编写
2. **保存草稿:** 系统自动保存草稿，避免内容丢失
3. **预览文章:** 提供实时预览功能查看渲染效果
4. **设置属性:** 添加分类、标签、SEO信息等
5. **发布文章:** 选择立即发布或定时发布
6. **前台展示:** 已发布文章在前台显示，支持评论互动
7. **统计分析:** 跟踪文章访问量和用户反馈

## 8. 评论互动流程

1. **访客评论:** 访客在文章页面提交评论
2. **审核机制:** 根据设置决定是否需要审核
3. **邮件通知:** 新评论通知博主（可选）
4. **回复功能:** 支持对评论进行回复
5. **垃圾评论防护:** 基本的反垃圾评论机制

## 9. SEO 和性能优化

*   **URL优化**: 使用友好的URL结构 (`/posts/article-title/`)
*   **Meta标签**: 自动生成和自定义meta标题、描述
*   **站点地图**: 自动生成XML站点地图
*   **RSS订阅**: 自动生成RSS源
*   **图片优化**: 自动压缩和格式转换
*   **缓存策略**: 页面缓存和数据库查询优化
*   **CDN支持**: 静态资源CDN配置

## 10. 日志与监控策略

*   记录所有HTTP请求和响应
*   记录文章访问统计数据
*   记录用户操作日志（创建、编辑、删除）
*   记录系统错误和异常
*   监控系统性能指标
*   评论和垃圾内容监控

## 功能更新与优化记录

### Markdown编辑器集成 (计划)

*   **需求描述**：集成现代化的Markdown编辑器，提供实时预览、语法高亮、图片拖拽上传等功能。
*   **实现计划**：
    *   集成Editor.md或类似的Markdown编辑器
    *   添加图片上传和管理功能
    *   实现代码语法高亮
    *   支持数学公式渲染（可选）

### 主题系统开发 (计划)

*   **需求描述**：开发灵活的主题系统，支持多种博客主题切换。
*   **实现计划**：
    *   设计主题架构和模板继承体系
    *   开发默认主题（简约现代风格）
    *   提供主题配置选项
    *   支持深色模式切换

### 性能优化 (计划)

*   **需求描述**：优化系统性能，提升页面加载速度和用户体验。
*   **优化方向**：
    *   数据库查询优化
    *   页面缓存机制
    *   静态资源压缩
    *   CDN集成配置

### 文章创建分类ID映射问题修复 (已完成)

*   **问题描述**：前端文章创建时出现"请填写合法的整数值"错误，原因是前端硬编码的分类ID映射与数据库中的实际分类ID不一致。
*   **问题分析**：
    *   前端代码中使用硬编码的分类映射：tech: 1, life: 2, travel: 3, thoughts: 4, tutorials: 5
    *   数据库中的实际分类ID为：技术: 3, 生活: 4, 旅行: 5, 随笔: 6, 教程: 7
    *   导致前端传递的分类ID在数据库中不存在，触发验证错误
*   **解决方案**：
    *   修改前端CreatePost组件，动态获取分类数据而不是使用硬编码映射
    *   添加getCategories API调用来获取实际的分类列表
    *   使用分类的slug作为表单值，在提交时动态查找对应的分类ID
    *   更新分类选择器使用动态获取的分类数据
*   **修改文件**：
    *   `recipeServerWeb/src/pages/CreatePost.tsx`：添加分类状态管理和动态获取逻辑
    *   移除硬编码的categoryOptions，使用API获取的分类数据
*   **测试结果**：修复后文章创建功能正常，分类ID验证通过

### Swagger/OpenAPI 文档集成 (已完成)

*   **需求描述**：为API接口添加交互式文档，提供现代化的API浏览和测试界面。
*   **实现方案**：
    *   集成drf-spectacular包，支持OpenAPI 3.0标准
    *   配置Swagger UI和ReDoc两种文档界面
    *   为所有API端点添加详细的文档注释和示例
    *   按功能模块对API进行分类组织
*   **功能特性**：
    *   **Swagger UI** (`/api/docs/`)：交互式API测试界面
    *   **ReDoc** (`/api/redoc/`)：美观的API文档阅读界面
    *   **OpenAPI Schema** (`/api/schema/`)：标准的API规范文件
    *   支持JWT认证测试
    *   提供完整的请求/响应示例
    *   参数验证和错误处理说明
*   **修改文件**：
    *   `requirements.txt`：添加drf-spectacular依赖
    *   `recipe_server/settings.py`：配置drf-spectacular设置
    *   `recipe_server/urls.py`：添加文档路由
    *   `blog/views.py`：为博客API添加详细文档注释
    *   `api/auth_views.py`：为认证API添加文档注释
    *   `api_docs.md`：更新API文档说明
*   **访问地址**：
    *   Swagger UI: http://localhost:8000/api/docs/
    *   ReDoc: http://localhost:8000/api/redoc/
    *   OpenAPI Schema: http://localhost:8000/api/schema/