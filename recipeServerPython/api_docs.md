# 博客系统 API 接口文档

## 📚 交互式API文档

我们提供了多种方式来浏览和测试API：

*   **Swagger UI**: `http://localhost:8000/api/docs/` - 现代化的交互式API文档界面
*   **ReDoc**: `http://localhost:8000/api/redoc/` - 美观的API文档阅读界面  
*   **OpenAPI Schema**: `http://localhost:8000/api/schema/` - 原始的OpenAPI 3.0规范文件

### Swagger UI 特性
- 🔍 **实时测试**: 直接在浏览器中测试API端点
- 📖 **详细文档**: 每个端点都有详细的参数说明和示例
- 🔐 **认证支持**: 支持JWT令牌认证测试
- 📝 **请求示例**: 提供完整的请求和响应示例
- 🏷️ **分类组织**: API按功能模块分类展示

## 0. 重要说明

*   **主要用途**: 此 API 设计用于第三方应用程序、移动App或RSS阅读器与个人博客系统交互。
*   **内容访问**: API主要提供博客文章、分类、标签等内容的读取访问。
*   **状态过滤**: API 返回的文章数据**仅包含已发布**（状态为 `published`）的内容。
*   **文章管理**: 支持完整的文章CRUD操作（创建、读取、更新、删除），需要适当的认证权限。
*   **历史记录**: 提供文章编辑历史追踪功能，记录所有修改操作。
*   **权限控制**: 文章的编辑和删除操作仅限于文章作者和系统管理员。

## 1. 认证

*   **公开访问**: 大部分读取接口（文章列表、文章详情、分类、标签等）不需要认证，公开访问。
*   **JWT Token认证**: 文章管理操作（创建、编辑、删除）需要JWT Token认证。
*   **权限验证**: 文章的编辑和删除操作会验证用户权限（仅作者和管理员可操作）。

### 1.1 获取认证Token

#### POST `/api/v1/auth/token/`

*   **描述:** 用户登录获取JWT访问令牌。
*   **请求体:**
    ```json
    {
        "username": "your_username",
        "password": "your_password"
    }
    ```
*   **成功响应 (200 OK):**
    ```json
    {
        "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
        "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
        "user": {
            "id": 1,
            "username": "blogger",
            "email": "blogger@example.com"
        }
    }
    ```

### 1.2 使用Token

在需要认证的请求中，在HTTP头部添加：
```
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
```

## 2. 基础 URL

*   所有 API v1 接口均以 `/api/v1/` 为前缀。

## 3. 接口详情

### 3.1 文章 (Posts)

#### GET `/api/v1/posts/`

*   **描述:** 获取已发布的博客文章列表。支持分页和筛选。
*   **请求参数:**
    *   `page` (查询参数, 可选): `integer`, 请求的页码 (默认为 1)。
    *   `page_size` (查询参数, 可选): `integer`, 每页返回的项目数 (默认为 10)。
    *   `category` (查询参数, 可选): `string`, 分类slug，按分类筛选文章。
    *   `tag` (查询参数, 可选): `string`, 标签slug，按标签筛选文章。
    *   `year` (查询参数, 可选): `integer`, 按年份筛选文章。
    *   `month` (查询参数, 可选): `integer`, 按月份筛选文章。
    *   `featured` (查询参数, 可选): `boolean`, 是否只返回置顶文章。
    *   `search` (查询参数, 可选): `string`, 全文搜索关键词。
*   **成功响应 (200 OK):**
    ```json
    {
        "count": 45,
        "next": "http://example.com/api/v1/posts/?page=2",
        "previous": null,
        "results": [
            {
                "id": 1,
                "title": "Python装饰器深入理解",
                "slug": "python-decorators-deep-dive",
                "excerpt": "本文将深入探讨Python装饰器的工作原理...",
                "featured_image": "http://example.com/media/images/python-decorators.jpg",
                "author": {
                    "id": 1,
                    "username": "blogger",
                    "display_name": "技术博主"
                },
                "categories": [
                    {
                        "id": 1,
                        "name": "Python编程",
                        "slug": "python-programming"
                    }
                ],
                "tags": [
                    {
                        "id": 1,
                        "name": "Python",
                        "slug": "python"
                    },
                    {
                        "id": 5,
                        "name": "装饰器",
                        "slug": "decorators"
                    }
                ],
                "published_at": "2023-10-15T08:30:00Z",
                "view_count": 256,
                "is_featured": false,
                "allow_comments": true
            }
            // ... 其他文章
        ]
    }
    ```
*   **错误响应:**
    *   `400 Bad Request`: 无效的查询参数。
    *   `404 Not Found`: 指定的分类或标签不存在。

#### GET `/api/v1/posts/{slug}/`

*   **描述:** 获取指定slug的单篇文章详细信息。
*   **路径参数:**
    *   `slug` (必填): `string`, 文章的唯一URL标识符。
*   **成功响应 (200 OK):**
    ```json
    {
        "id": 1,
        "title": "Python装饰器深入理解",
        "slug": "python-decorators-deep-dive",
        "content": "# Python装饰器详解\n\n装饰器是Python中一个强大的特性...",
        "excerpt": "本文将深入探讨Python装饰器的工作原理...",
        "featured_image": "http://example.com/media/images/python-decorators.jpg",
        "author": {
            "id": 1,
            "username": "blogger",
            "display_name": "技术博主",
            "avatar": "http://example.com/media/avatars/blogger.jpg"
        },
        "categories": [
            {
                "id": 1,
                "name": "Python编程",
                "slug": "python-programming",
                "description": "Python编程相关技术文章"
            }
        ],
        "tags": [
            {
                "id": 1,
                "name": "Python",
                "slug": "python"
            },
            {
                "id": 5,
                "name": "装饰器",
                "slug": "decorators"
            }
        ],
        "created_at": "2023-10-15T08:30:00Z",
        "updated_at": "2023-10-15T10:45:00Z",
        "published_at": "2023-10-15T08:30:00Z",
        "view_count": 256,
        "is_featured": false,
        "allow_comments": true,
        "meta_title": "Python装饰器深入理解 - 技术博客",
        "meta_description": "深入探讨Python装饰器的工作原理和应用场景",
        "meta_keywords": "Python,装饰器,编程技巧",
        "related_posts": [
            {
                "id": 3,
                "title": "Python闭包详解",
                "slug": "python-closures-explained"
            }
        ]
    }
    ```
*   **错误响应:**
    *   `404 Not Found`: 文章slug不存在或文章未发布。

#### GET `/api/v1/posts/featured/`

*   **描述:** 获取置顶文章列表。
*   **请求参数:**
    *   `limit` (查询参数, 可选): `integer`, 返回的文章数量限制 (默认为 5)。
*   **成功响应 (200 OK):**
    ```json
    {
        "results": [
            {
                "id": 2,
                "title": "2023年技术总结与展望",
                "slug": "tech-summary-2023",
                "excerpt": "回顾2023年的技术发展...",
                "featured_image": "http://example.com/media/images/tech-2023.jpg",
                "published_at": "2023-12-31T23:59:00Z",
                "view_count": 1024
            }
            // ... 其他置顶文章
        ]
    }
    ```

#### GET `/api/v1/posts/popular/`

*   **描述:** 获取热门文章列表（按浏览量排序）。
*   **请求参数:**
    *   `limit` (查询参数, 可选): `integer`, 返回的文章数量限制 (默认为 10)。
    *   `period` (查询参数, 可选): `string`, 统计周期 ('week', 'month', 'year', 'all')，默认为 'month'。
*   **成功响应 (200 OK):**
    ```json
    {
        "results": [
            {
                "id": 5,
                "title": "JavaScript异步编程完全指南",
                "slug": "javascript-async-programming-guide",
                "excerpt": "从回调函数到Promise再到async/await...",
                "view_count": 1520,
                "published_at": "2023-09-20T14:30:00Z"
            }
            // ... 其他热门文章
        ]
    }
    ```

#### POST `/api/v1/posts/`

*   **描述:** 创建新的博客文章。需要用户认证。
*   **认证:** 需要JWT Token认证
*   **请求体:**
    ```json
    {
        "title": "新文章标题",
        "content": "文章内容（支持Markdown）",
        "excerpt": "文章摘要",
        "status": "draft", // 'draft' 或 'published'
        "category_ids": [1, 2],
        "tag_names": ["Python", "Django"],
        "is_featured": false,
        "allow_comments": true,
        "meta_title": "SEO标题",
        "meta_description": "SEO描述",
        "meta_keywords": "关键词1,关键词2"
    }
    ```
*   **成功响应 (201 Created):**
    ```json
    {
        "id": 10,
        "title": "新文章标题",
        "slug": "new-article-title",
        "content": "文章内容（支持Markdown）",
        "excerpt": "文章摘要",
        "status": "draft",
        "author": {
            "id": 1,
            "username": "blogger",
            "display_name": "技术博主"
        },
        "categories": [
            {
                "id": 1,
                "name": "Python编程",
                "slug": "python-programming"
            }
        ],
        "tags": [
            {
                "id": 1,
                "name": "Python",
                "slug": "python"
            }
        ],
        "created_at": "2023-12-01T10:30:00Z",
        "updated_at": "2023-12-01T10:30:00Z"
    }
    ```
*   **错误响应:**
    *   `401 Unauthorized`: 未认证或Token无效。
    *   `400 Bad Request`: 请求数据格式错误或必填字段缺失。

#### PUT `/api/v1/posts/{slug}/`

*   **描述:** 更新指定文章的完整信息。只有文章作者和管理员可以操作。
*   **认证:** 需要JWT Token认证
*   **路径参数:**
    *   `slug` (必填): `string`, 文章的唯一URL标识符。
*   **请求体:** 与创建文章相同的JSON格式
*   **成功响应 (200 OK):** 返回更新后的文章完整信息
*   **错误响应:**
    *   `401 Unauthorized`: 未认证或Token无效。
    *   `403 Forbidden`: 没有权限编辑此文章。
    *   `404 Not Found`: 文章不存在。

#### PATCH `/api/v1/posts/{slug}/`

*   **描述:** 部分更新指定文章信息。只有文章作者和管理员可以操作。
*   **认证:** 需要JWT Token认证
*   **路径参数:**
    *   `slug` (必填): `string`, 文章的唯一URL标识符。
*   **请求体:** 只需包含要更新的字段
    ```json
    {
        "title": "更新后的标题",
        "status": "published"
    }
    ```
*   **成功响应 (200 OK):** 返回更新后的文章完整信息
*   **错误响应:**
    *   `401 Unauthorized`: 未认证或Token无效。
    *   `403 Forbidden`: 没有权限编辑此文章。
    *   `404 Not Found`: 文章不存在。

#### DELETE `/api/v1/posts/{slug}/`

*   **描述:** 删除指定文章。只有文章作者和管理员可以操作。
*   **认证:** 需要JWT Token认证
*   **路径参数:**
    *   `slug` (必填): `string`, 文章的唯一URL标识符。
*   **成功响应 (204 No Content):** 文章删除成功，无返回内容
*   **错误响应:**
    *   `401 Unauthorized`: 未认证或Token无效。
    *   `403 Forbidden`: 没有权限删除此文章。
    *   `404 Not Found`: 文章不存在。

#### GET `/api/v1/posts/{slug}/history/`

*   **描述:** 获取指定文章的编辑历史记录。只有文章作者和管理员可以查看。
*   **认证:** 需要JWT Token认证
*   **路径参数:**
    *   `slug` (必填): `string`, 文章的唯一URL标识符。
*   **成功响应 (200 OK):**
    ```json
    [
        {
            "history_id": 15,
            "history_date": "2023-12-01T14:30:00Z",
            "history_type": "+",
            "history_type_display": "Created",
            "history_user": {
                "id": 1,
                "username": "blogger",
                "display_name": "技术博主"
            },
            "id": 10,
            "title": "文章标题",
            "content": "文章内容...",
            "status": "draft"
        },
        {
            "history_id": 16,
            "history_date": "2023-12-01T15:45:00Z",
            "history_type": "~",
            "history_type_display": "Changed",
            "history_user": {
                "id": 1,
                "username": "blogger",
                "display_name": "技术博主"
            },
            "id": 10,
            "title": "更新后的文章标题",
            "content": "更新后的文章内容...",
            "status": "published"
        }
    ]
    ```
*   **错误响应:**
    *   `401 Unauthorized`: 未认证或Token无效。
    *   `403 Forbidden`: 没有权限查看此文章的历史记录。
    *   `404 Not Found`: 文章不存在。

#### GET `/api/v1/posts/my/`

*   **描述:** 获取当前用户的文章列表（包括草稿和已发布的文章）。
*   **认证:** 需要JWT Token认证
*   **请求参数:**
    *   `page` (查询参数, 可选): `integer`, 页码。
    *   `page_size` (查询参数, 可选): `integer`, 每页数量。
    *   `status` (查询参数, 可选): `string`, 按状态筛选 ('draft', 'published')。
*   **成功响应 (200 OK):**
    ```json
    {
        "count": 8,
        "next": null,
        "previous": null,
        "results": [
            {
                "id": 10,
                "title": "我的文章标题",
                "slug": "my-article-title",
                "excerpt": "文章摘要",
                "status": "published",
                "created_at": "2023-12-01T10:30:00Z",
                "updated_at": "2023-12-01T15:45:00Z",
                "view_count": 25
            }
            // ... 其他文章
        ]
    }
    ```
*   **错误响应:**
    *   `401 Unauthorized`: 未认证或Token无效。

### 3.2 分类 (Categories)

#### GET `/api/v1/categories/`

*   **描述:** 获取文章分类列表。
*   **请求参数:**
    *   `include_count` (查询参数, 可选): `boolean`, 是否包含每个分类的文章数量 (默认为 true)。
*   **成功响应 (200 OK):**
    ```json
    {
        "results": [
            {
                "id": 1,
                "name": "Python编程",
                "slug": "python-programming",
                "description": "Python编程相关技术文章",
                "post_count": 12,
                "parent": null
            },
            {
                "id": 2,
                "name": "Web开发",
                "slug": "web-development",
                "description": "前端和后端Web开发技术",
                "post_count": 8,
                "parent": null
            },
            {
                "id": 3,
                "name": "前端开发",
                "slug": "frontend-development",
                "description": "前端开发技术和框架",
                "post_count": 5,
                "parent": {
                    "id": 2,
                    "name": "Web开发",
                    "slug": "web-development"
                }
            }
        ]
    }
    ```

#### GET `/api/v1/categories/{slug}/`

*   **描述:** 获取指定分类的详细信息和该分类下的文章。
*   **路径参数:**
    *   `slug` (必填): `string`, 分类的URL标识符。
*   **请求参数:**
    *   `page` (查询参数, 可选): `integer`, 文章列表的页码。
    *   `page_size` (查询参数, 可选): `integer`, 每页文章数量。
*   **成功响应 (200 OK):**
    ```json
    {
        "category": {
            "id": 1,
            "name": "Python编程",
            "slug": "python-programming",
            "description": "Python编程相关技术文章",
            "post_count": 12
        },
        "posts": {
            "count": 12,
            "next": null,
            "previous": null,
            "results": [
                // ... 该分类下的文章列表
            ]
        }
    }
    ```

### 3.3 标签 (Tags)

#### GET `/api/v1/tags/`

*   **描述:** 获取标签列表。
*   **请求参数:**
    *   `popular` (查询参数, 可选): `boolean`, 是否按使用频率排序 (默认为 true)。
    *   `limit` (查询参数, 可选): `integer`, 返回的标签数量限制。
*   **成功响应 (200 OK):**
    ```json
    {
        "results": [
            {
                "id": 1,
                "name": "Python",
                "slug": "python",
                "post_count": 15
            },
            {
                "id": 2,
                "name": "JavaScript",
                "slug": "javascript",
                "post_count": 10
            },
            {
                "id": 3,
                "name": "Django",
                "slug": "django",
                "post_count": 8
            }
        ]
    }
    ```

#### GET `/api/v1/tags/{slug}/`

*   **描述:** 获取指定标签的文章列表。
*   **路径参数:**
    *   `slug` (必填): `string`, 标签的URL标识符。
*   **请求参数:**
    *   `page` (查询参数, 可选): `integer`, 文章列表的页码。
    *   `page_size` (查询参数, 可选): `integer`, 每页文章数量。
*   **成功响应 (200 OK):**
    ```json
    {
        "tag": {
            "id": 1,
            "name": "Python",
            "slug": "python",
            "post_count": 15
        },
        "posts": {
            "count": 15,
            "results": [
                // ... 该标签的文章列表
            ]
        }
    }
    ```

### 3.4 评论 (Comments)

#### GET `/api/v1/posts/{post_id}/comments/`

*   **描述:** 获取指定文章的评论列表。
*   **路径参数:**
    *   `post_id` (必填): `integer`, 文章ID。
*   **请求参数:**
    *   `page` (查询参数, 可选): `integer`, 评论列表的页码。
*   **成功响应 (200 OK):**
    ```json
    {
        "count": 5,
        "results": [
            {
                "id": 1,
                "author_name": "张三",
                "author_email": "zhangsan@example.com",
                "author_url": "https://zhangsan.blog",
                "content": "这篇文章写得很好，学到了很多！",
                "created_at": "2023-10-16T09:15:00Z",
                "is_approved": true,
                "parent": null,
                "replies": [
                    {
                        "id": 2,
                        "author_name": "博主",
                        "content": "谢谢你的支持！",
                        "created_at": "2023-10-16T10:30:00Z",
                        "parent": 1
                    }
                ]
            }
        ]
    }
    ```

#### POST `/api/v1/posts/{post_id}/comments/`

*   **描述:** 为指定文章提交评论。
*   **路径参数:**
    *   `post_id` (必填): `integer`, 文章ID。
*   **请求体:**
    ```json
    {
        "author_name": "李四",
        "author_email": "lisi@example.com",
        "author_url": "https://lisi.blog", // 可选
        "content": "非常有用的文章，感谢分享！",
        "parent": null // 可选，回复评论时填写父评论ID
    }
    ```
*   **成功响应 (201 Created):**
    ```json
    {
        "id": 3,
        "author_name": "李四",
        "content": "非常有用的文章，感谢分享！",
        "created_at": "2023-10-17T14:20:00Z",
        "is_approved": false, // 待审核状态
        "message": "评论已提交，正在等待审核"
    }
    ```
*   **错误响应:**
    *   `400 Bad Request`: 请求体格式错误或缺少必要字段。
    *   `404 Not Found`: 文章不存在或不允许评论。
    *   `429 Too Many Requests`: 评论提交过于频繁。

### 3.5 搜索 (Search)

#### GET `/api/v1/search/`

*   **描述:** 全文搜索博客文章。
*   **请求参数:**
    *   `q` (查询参数, 必填): `string`, 搜索关键词。
    *   `page` (查询参数, 可选): `integer`, 搜索结果页码。
    *   `page_size` (查询参数, 可选): `integer`, 每页结果数量。
    *   `category` (查询参数, 可选): `string`, 限制搜索范围到特定分类。
*   **成功响应 (200 OK):**
    ```json
    {
        "query": "Python装饰器",
        "count": 3,
        "results": [
            {
                "id": 1,
                "title": "Python装饰器深入理解",
                "slug": "python-decorators-deep-dive",
                "excerpt": "本文将深入探讨Python装饰器的工作原理...",
                "highlight": "Python<em>装饰器</em>是一个强大的特性...",
                "published_at": "2023-10-15T08:30:00Z",
                "relevance_score": 0.95
            }
        ]
    }
    ```

### 3.6 归档 (Archive)

#### GET `/api/v1/archive/`

*   **描述:** 获取文章归档信息（按年月分组）。
*   **成功响应 (200 OK):**
    ```json
    {
        "results": [
            {
                "year": 2023,
                "months": [
                    {
                        "month": 12,
                        "month_name": "十二月",
                        "post_count": 4
                    },
                    {
                        "month": 11,
                        "month_name": "十一月",
                        "post_count": 6
                    }
                ],
                "year_total": 24
            },
            {
                "year": 2022,
                "months": [
                    {
                        "month": 12,
                        "month_name": "十二月",
                        "post_count": 3
                    }
                ],
                "year_total": 21
            }
        ]
    }
    ```

### 3.7 RSS和站点地图

#### GET `/rss/`

*   **描述:** RSS订阅源。
*   **成功响应 (200 OK):**
    *   返回标准的RSS 2.0格式XML文档。

#### GET `/sitemap.xml`

*   **描述:** XML站点地图。
*   **成功响应 (200 OK):**
    *   返回标准的XML站点地图格式。

### 3.8 统计信息

#### GET `/api/v1/stats/`

*   **描述:** 获取博客统计信息。
*   **成功响应 (200 OK):**
    ```json
    {
        "total_posts": 45,
        "total_categories": 8,
        "total_tags": 23,
        "total_comments": 127,
        "total_views": 15420,
        "latest_post": {
            "title": "最新文章标题",
            "published_at": "2023-12-15T10:30:00Z"
        }
    }
    ```

## 4. 错误响应格式

所有错误响应都遵循统一格式：

```json
{
    "error": {
        "code": "INVALID_PARAMETER",
        "message": "请求参数无效",
        "details": {
            "field": "page",
            "reason": "页码必须是正整数"
        }
    }
}
```

## 5. 分页格式

所有分页响应都遵循统一格式：

```json
{
    "count": 总数量,
    "next": "下一页URL",
    "previous": "上一页URL",
    "results": [数据列表]
}
```

## 6. 速率限制

*   公开读取接口：每分钟100次请求
*   评论提交：每小时10次请求
*   搜索接口：每分钟20次请求

## 7. 版本控制

*   当前版本：v1
*   向后兼容性：重大更改时会发布新版本
*   推荐在请求头中包含 `Accept: application/json; version=1` 