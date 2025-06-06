# 个人博客系统 - 前端

基于 React + TypeScript + Vite 构建的现代化个人博客前端应用。

## 技术栈

- **React 18**: 现代化的用户界面库
- **TypeScript**: 类型安全的JavaScript超集
- **Vite**: 快速的现代化构建工具
- **React Router**: 客户端路由管理
- **Tailwind CSS**: 实用优先的CSS框架
- **Axios**: HTTP客户端库
- **React Query**: 数据获取和状态管理
- **React Hook Form**: 表单处理库
- **Markdown-it**: Markdown解析和渲染
- **Prism.js**: 代码语法高亮

## 项目结构

```
src/
├── components/          # 可复用组件
│   ├── common/         # 通用组件
│   ├── post/           # 文章相关组件
│   ├── comment/        # 评论相关组件
│   └── layout/         # 布局组件
├── pages/              # 页面组件
│   ├── Home/           # 首页
│   ├── Post/           # 文章页面
│   ├── Category/       # 分类页面
│   ├── Tag/            # 标签页面
│   ├── Archive/        # 归档页面
│   └── Search/         # 搜索页面
├── hooks/              # 自定义React Hooks
├── services/           # API服务层
├── utils/              # 工具函数
├── types/              # TypeScript类型定义
├── styles/             # 样式文件
└── assets/             # 静态资源
```

## 主要功能

### 前台展示 (公开访问)
- **首页**: 展示最新文章、置顶文章、热门标签
- **文章详情**: 完整文章内容、评论区、相关文章推荐
- **分类浏览**: 按分类查看文章列表
- **标签浏览**: 按标签查看相关文章
- **归档页面**: 按时间线浏览历史文章
- **搜索功能**: 全文搜索博客内容
- **响应式设计**: 完美适配桌面端、平板和手机

### 主题系统
- **多主题支持**: 内置多种主题风格
- **深色模式**: 支持深色/浅色模式切换
- **自定义配置**: 主题色彩和布局自定义

### 用户体验
- **无限滚动**: 文章列表无限加载
- **渐进式加载**: 图片懒加载优化
- **离线缓存**: Service Worker支持
- **SEO优化**: 服务端渲染和meta标签优化

## 开发环境设置

### 前置要求
- Node.js 18+ 
- npm 或 yarn 或 pnpm

### 安装依赖
```bash
npm install
# 或
yarn install
# 或
pnpm install
```

### 环境变量配置
创建 `.env` 文件并配置：
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_SITE_TITLE=我的个人博客
VITE_SITE_DESCRIPTION=分享技术心得与生活感悟
VITE_DISQUS_SHORTNAME=your-disqus-shortname
```

### 开发服务器
```bash
npm run dev
```
访问 `http://localhost:5173`

### 构建生产版本
```bash
npm run build
```

### 预览生产构建
```bash
npm run preview
```

## 组件开发规范

### 组件结构
```tsx
// PostCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Post } from '@/types/post';

interface PostCardProps {
  post: Post;
  className?: string;
}

export const PostCard: React.FC<PostCardProps> = ({ post, className }) => {
  return (
    <article className={`post-card ${className || ''}`}>
      <Link to={`/posts/${post.slug}`}>
        <h2>{post.title}</h2>
        <p>{post.excerpt}</p>
      </Link>
    </article>
  );
};
```

### 自定义Hooks示例
```tsx
// hooks/usePosts.ts
import { useQuery } from 'react-query';
import { postsApi } from '@/services/api';

export const usePosts = (params?: PostsParams) => {
  return useQuery(
    ['posts', params],
    () => postsApi.getPosts(params),
    {
      staleTime: 5 * 60 * 1000, // 5分钟
      cacheTime: 10 * 60 * 1000, // 10分钟
    }
  );
};
```

### API服务层
```tsx
// services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
});

export const postsApi = {
  getPosts: (params?: PostsParams) => 
    api.get<PostsResponse>('/posts', { params }).then(res => res.data),
  
  getPost: (slug: string) => 
    api.get<Post>(`/posts/${slug}`).then(res => res.data),
  
  searchPosts: (query: string) => 
    api.get<SearchResponse>('/search', { params: { q: query } }).then(res => res.data),
};
```

## 部署

### Docker 部署
```dockerfile
# Dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Nginx 配置
```nginx
server {
    listen 80;
    server_name localhost;
    
    root /usr/share/nginx/html;
    index index.html;
    
    # 启用gzip压缩
    gzip on;
    gzip_types text/css application/javascript application/json;
    
    # SPA路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # 静态资源缓存
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 性能优化

### 代码分割
- 路由级别的懒加载
- 组件按需导入
- 第三方库按需加载

### 资源优化
- 图片压缩和WebP格式支持
- CSS和JavaScript压缩
- 字体文件优化

### 用户体验优化
- 骨架屏加载状态
- 渐进式图片加载
- 预加载关键资源

## ESLint 配置

开发环境推荐启用严格的类型检查：

```js
export default tseslint.config({
  extends: [
    ...tseslint.configs.recommendedTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
  },
});
```

## 浏览器支持

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。
