# 博客系统测试用例

## API接口测试

### 1. 文章管理接口测试

#### 1.1 获取文章列表测试
- **测试接口**: `GET /api/v1/posts/`
- **测试场景**:
  - 默认分页获取文章列表
  - 按分类筛选文章 (`category=python-programming`)
  - 按标签筛选文章 (`tag=python`)
  - 按年份筛选文章 (`year=2023`)
  - 按月份筛选文章 (`year=2023&month=12`)
  - 只获取置顶文章 (`featured=true`)
  - 全文搜索 (`search=Python装饰器`)
  - 分页参数测试 (`page=2&page_size=5`)
- **预期结果**: 返回符合条件的文章分页列表

#### 1.2 获取文章详情测试
- **测试接口**: `GET /api/v1/posts/{slug}/`
- **测试场景**:
  - 获取存在的文章详情
  - 获取不存在的文章 (404错误)
  - 获取未发布的文章 (404错误)
- **预期结果**: 返回文章完整信息或404错误

#### 1.3 创建文章测试 (需要认证)
- **测试接口**: `POST /api/v1/posts/`
- **测试场景**:
  - 创建完整的文章
  - 创建草稿文章
  - 上传图片的文章
  - 未认证用户创建文章 (401错误)
  - 缺少必填字段 (400错误)
- **预期结果**: 成功创建文章或相应错误

#### 1.4 更新文章测试 (需要认证)
- **测试接口**: `PUT /api/v1/posts/{slug}/`
- **测试场景**:
  - 更新自己的文章
  - 更新他人的文章 (403错误)
  - 更新不存在的文章 (404错误)
- **预期结果**: 成功更新或相应错误

#### 1.5 删除文章测试 (需要认证)
- **测试接口**: `DELETE /api/v1/posts/{slug}/`
- **测试场景**:
  - 删除自己的文章
  - 删除他人的文章 (403错误)
  - 删除不存在的文章 (404错误)
- **预期结果**: 成功删除或相应错误

### 2. 分类标签接口测试

#### 2.1 获取分类列表测试
- **测试接口**: `GET /api/v1/categories/`
- **测试场景**:
  - 获取所有分类
  - 包含文章数量统计 (`include_count=true`)
  - 不包含文章数量统计 (`include_count=false`)
- **预期结果**: 返回分类列表

#### 2.2 获取分类详情测试
- **测试接口**: `GET /api/v1/categories/{slug}/`
- **测试场景**:
  - 获取存在的分类及其文章
  - 获取不存在的分类 (404错误)
  - 分页获取分类文章
- **预期结果**: 返回分类信息和文章列表

#### 2.3 获取标签列表测试
- **测试接口**: `GET /api/v1/tags/`
- **测试场景**:
  - 获取所有标签
  - 按热度排序 (`popular=true`)
  - 限制返回数量 (`limit=10`)
- **预期结果**: 返回标签列表

#### 2.4 获取标签文章测试
- **测试接口**: `GET /api/v1/tags/{slug}/`
- **测试场景**:
  - 获取存在的标签及其文章
  - 获取不存在的标签 (404错误)
  - 分页获取标签文章
- **预期结果**: 返回标签信息和文章列表

### 3. 评论系统接口测试

#### 3.1 获取文章评论测试
- **测试接口**: `GET /api/v1/posts/{post_id}/comments/`
- **测试场景**:
  - 获取存在文章的评论
  - 获取不存在文章的评论 (404错误)
  - 分页获取评论
- **预期结果**: 返回评论列表

#### 3.2 提交评论测试
- **测试接口**: `POST /api/v1/posts/{post_id}/comments/`
- **测试场景**:
  - 提交有效评论
  - 回复其他评论
  - 缺少必填字段 (400错误)
  - 提交到不存在的文章 (404错误)
  - 频繁提交评论 (429错误)
- **预期结果**: 成功提交或相应错误

### 4. 搜索接口测试

#### 4.1 全文搜索测试
- **测试接口**: `GET /api/v1/search/`
- **测试场景**:
  - 有效关键词搜索
  - 空关键词搜索 (400错误)
  - 按分类限制搜索
  - 分页搜索结果
- **预期结果**: 返回搜索结果

### 5. 归档统计接口测试

#### 5.1 获取归档信息测试
- **测试接口**: `GET /api/v1/archive/`
- **测试场景**:
  - 获取文章归档统计
- **预期结果**: 返回按年月分组的文章统计

#### 5.2 获取统计信息测试
- **测试接口**: `GET /api/v1/stats/`
- **测试场景**:
  - 获取博客统计数据
- **预期结果**: 返回博客整体统计信息

### 6. 管理员接口测试

#### 6.1 获取待审核文章测试
- **测试接口**: `GET /api/v1/posts/pending/`
- **测试场景**:
  - 管理员获取待审核文章
  - 普通用户访问 (403错误)
  - 未认证用户访问 (401错误)
- **预期结果**: 返回待审核文章列表或错误

#### 6.2 审核文章测试
- **测试接口**: `PUT /api/v1/posts/{slug}/review/`
- **测试场景**:
  - 管理员批准文章
  - 管理员拒绝文章
  - 普通用户操作 (403错误)
  - 审核不存在的文章 (404错误)
- **预期结果**: 成功审核或相应错误

## 前端组件测试

### 1. 文章列表页面测试
- **测试组件**: `Home.tsx`
- **测试场景**:
  - 首次加载显示文章列表
  - 分页功能正常
  - 搜索功能正常
  - 分类筛选功能
  - 标签筛选功能
  - 响应式设计适应不同屏幕

### 2. 文章详情页面测试
- **测试组件**: `PostDetail.tsx`
- **测试场景**:
  - 正确显示文章内容
  - 显示分类和标签
  - 显示评论列表
  - 评论提交功能
  - 文章不存在时显示错误页面

### 3. 创建文章页面测试
- **测试组件**: `CreatePost.tsx`
- **测试场景**:
  - 表单字段验证
  - 图片上传功能
  - 分类选择功能
  - 标签输入功能
  - 保存草稿功能
  - 发布文章功能

### 4. 认证相关测试
- **测试组件**: 登录/注册组件
- **测试场景**:
  - 登录功能正常
  - 注册功能正常
  - 登录状态保持
  - 令牌自动刷新
  - 退出登录功能

## 性能测试

### 1. API响应时间测试
- 文章列表加载时间 < 500ms
- 文章详情加载时间 < 300ms
- 搜索响应时间 < 1s
- 图片上传时间 < 5s

### 2. 前端性能测试
- 首页加载时间 < 2s
- 页面切换流畅性
- 图片懒加载效果
- 内存占用情况

## 安全测试

### 1. 认证授权测试
- JWT令牌有效性验证
- 令牌过期处理
- 越权访问防护
- 未认证访问控制

### 2. 输入验证测试
- SQL注入防护
- XSS攻击防护
- 文件上传安全
- 数据格式验证

## 兼容性测试

### 1. 浏览器兼容性
- Chrome 最新版本
- Firefox 最新版本
- Safari 最新版本
- Edge 最新版本

### 2. 移动端适配
- iOS Safari
- Android Chrome
- 响应式布局测试
- 触摸操作适配

## 错误处理测试

### 1. 网络错误测试
- 网络断开情况
- 请求超时处理
- 服务器错误处理
- 错误信息显示

### 2. 数据异常测试
- 空数据处理
- 格式错误数据
- 大数据量处理
- 编码问题处理 