# 博客系统测试用例文档

本项目包含以下几类测试：

## 1. 模型测试 (blog/tests.py)

### 1.1 文章模型测试 (PostModelTests)
- `test_post_creation`: 测试创建文章实例
- `test_post_slug_generation`: 测试文章slug自动生成和唯一性
- `test_post_category_relation`: 测试文章与分类的多对多关系
- `test_post_tag_relation`: 测试文章与标签的多对多关系
- `test_post_status_field`: 测试文章状态字段的默认值和有效值
- `test_post_publication_date`: 测试文章发布时间自动设置
- `test_post_excerpt_auto_generation`: 测试文章摘要自动生成
- `test_post_view_count`: 测试文章浏览量计数

### 1.2 分类模型测试 (CategoryModelTests)
- `test_category_creation`: 测试创建分类实例
- `test_category_slug_generation`: 测试分类slug自动生成
- `test_category_hierarchy`: 测试分类层级关系（父子分类）
- `test_category_post_count`: 测试分类的文章计数

### 1.3 标签模型测试 (TagModelTests)
- `test_tag_creation`: 测试创建标签实例
- `test_tag_slug_generation`: 测试标签slug自动生成
- `test_tag_post_count`: 测试标签的文章计数

### 1.4 评论模型测试 (CommentModelTests)
- `test_comment_creation`: 测试创建评论实例
- `test_comment_reply_relation`: 测试评论回复的自关联关系
- `test_comment_approval_status`: 测试评论审核状态
- `test_comment_notification`: 测试评论通知功能

## 2. API测试 (api/tests.py)

### 2.1 文章API测试 (PostAPITests)
- **`test_list_posts_published_only`**: 测试文章列表只返回已发布的文章
- **`test_list_posts_pagination`**: 测试文章列表的分页功能
- **`test_list_posts_filter_by_category`**: 测试按分类筛选文章
- **`test_list_posts_filter_by_tag`**: 测试按标签筛选文章
- **`test_list_posts_search`**: 测试文章全文搜索功能
- `test_retrieve_post_detail`: 测试获取单个已发布文章详情
- `test_retrieve_post_detail_increments_view_count`: 测试访问文章详情增加浏览量
- `test_get_featured_posts`: 测试获取置顶文章列表
- `test_get_popular_posts`: 测试获取热门文章列表

### 2.2 分类API测试 (CategoryAPITests)
- **`test_list_categories`**: 测试获取分类列表，包含文章计数
- **`test_retrieve_category_detail`**: 测试获取分类详情和该分类下的文章
- `test_category_not_found`: 测试获取不存在的分类

### 2.3 标签API测试 (TagAPITests)
- **`test_list_tags`**: 测试获取标签列表，按使用频率排序
- **`test_retrieve_tag_detail`**: 测试获取标签详情和相关文章
- `test_tag_not_found`: 测试获取不存在的标签

### 2.4 评论API测试 (CommentAPITests)
- **`test_list_post_comments`**: 测试获取文章的评论列表
- **`test_create_comment_authenticated`**: 测试提交评论
- **`test_create_comment_with_reply`**: 测试回复评论
- **`test_comment_approval_required`**: 测试评论需要审核

### 2.5 搜索API测试 (SearchAPITests)
- **`test_search_posts_by_title`**: 测试按标题搜索文章
- **`test_search_posts_by_content`**: 测试按内容搜索文章
- **`test_search_posts_pagination`**: 测试搜索结果分页

## 3. Web界面测试 (web/tests.py)

### 3.1 前台页面测试 (PublicViewTests)
- `test_home_view`: 测试首页显示最新文章和置顶内容
- `test_post_detail_view`: 测试文章详情页显示完整内容和评论
- `test_category_list_view`: 测试分类列表页面
- `test_tag_list_view`: 测试标签云页面
- `test_archive_view`: 测试归档页面按时间线显示
- `test_search_view`: 测试搜索页面和结果显示

### 3.2 管理后台测试 (AdminViewTests)
- `test_admin_login_view`: 测试管理员登录页面
- `test_admin_dashboard_view`: 测试管理后台首页
- `test_admin_post_list_view`: 测试文章管理列表页
- `test_admin_post_create_view`: 测试创建文章页面
- `test_admin_post_edit_view`: 测试编辑文章页面
- `test_admin_comment_moderation`: 测试评论审核功能

## 测试执行方法

### 运行所有测试
```bash
python manage.py test
```

### 运行特定应用的测试
```bash
python manage.py test blog
python manage.py test api
python manage.py test web
```

### 运行特定测试类
```bash
python manage.py test blog.tests.PostModelTests
python manage.py test api.tests.PostAPITests
```

## 生成示例数据

创建示例数据的命令：
```bash
python manage.py create_sample_blog_data
```

这个命令会创建：
1. 示例分类（技术分享、生活随笔、读书笔记）
2. 示例标签（Python、Django、前端、随笔等）
3. 示例用户（admin、blogger、reader）
4. 示例文章（包含不同状态的文章）
5. 示例评论和回复

## 遵循开发流程规则

每次开发新功能或修改必须遵循以下步骤：
1. **需求文档更新** - 首先在`doc/requirement.md`中更新需求描述
2. **接口文档更新** - 更新`api_docs.md`中的相关API接口
3. **测试用例更新** - 在`test_cases.md`中添加新测试场景
4. **测试代码编写** - 编写对应的测试代码
5. **功能代码实现** - 实现功能代码
6. **测试验证** - 运行测试确保功能正常 