import api, { PaginatedResponse, BlogPost, BlogPostFormData, Category } from './api';

// 重新导出类型以保持兼容性
export type { BlogPostFormData, Category };

// 文章历史记录接口
export interface PostHistory {
  history_id: number;
  history_date: string;
  history_type: '+' | '~' | '-';
  history_type_display: string;
  history_user: {
    id: number;
    username: string;
  };
  id: number;
  title: string;
  content: string;
  status: string;
}

// 博客文章响应类型（兼容旧的RecipeListResponse）
export interface PostListResponse {
  count: number;
  results: BlogPost[];
  next?: string | null;
  previous?: string | null;
}

// 获取文章列表
export const getPosts = async (params?: { 
  page?: number;
  page_size?: number;
  category?: string;
  tag?: string;
  search?: string;
  author?: string;
}) => {
  return api.getPosts(params);
};

// 获取我的文章
export const getMyPosts = async (): Promise<PostListResponse> => {
  const response = await api.getMyPosts();
  return {
    count: response.count,
    results: response.results,
    next: response.next,
    previous: response.previous
  };
};

// 获取文章详情
export const getPostById = async (slug: string) => {
  return api.getPost(slug);
};

// 创建文章
export const createPost = async (data: BlogPostFormData | FormData) => {
  return api.createPost(data);
};

// 更新文章
export const updatePost = async (slug: string, data: BlogPostFormData | FormData) => {
  console.log('updatePost data', data);
  return api.updatePost(slug, data);
};

// 删除文章
export const deletePost = async (slug: string) => {
  return api.deletePost(slug);
};

// 获取文章历史记录
export const getPostHistory = async (slug:string): Promise<PostHistory[]> => {
  const response = await api.getPostHistory(slug);
  return response;
};

// 获取置顶文章
export const getFeaturedPosts = async (limit?: number) => {
  return api.getFeaturedPosts(limit);
};

// 获取热门文章
export const getPopularPosts = async (params?: {
  limit?: number;
  period?: 'week' | 'month' | 'year' | 'all';
}) => {
  return api.getPopularPosts(params);
};

// 获取分类列表
export const getCategories = async (include_count?: boolean) => {
  return api.getCategories(include_count);
};

// 获取标签列表
export const getTags = async (params?: {
  popular?: boolean;
  limit?: number;
}) => {
  return api.getTags(params);
};

// 搜索文章
export const searchPosts = async (params: {
  q: string;
  page?: number;
  page_size?: number;
  category?: string;
}) => {
  return api.search(params);
};

// 兼容性函数 - 保持与旧API的兼容性
export const getRecipes = getPosts;
export const getMyRecipes = getMyPosts;
export const getRecipeById = getPostById;
export const createRecipe = createPost;
export const updateRecipe = updatePost;
export const deleteRecipe = deletePost; 