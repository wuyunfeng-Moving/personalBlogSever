import axios from 'axios';

// 博客文章接口
export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content?: string;
  featured_image?: string;
  author: {
    id: number;
    username: string;
    display_name?: string;
    email?: string;
    avatar?: string;
    first_name?: string;
    last_name?: string;
    date_joined?: string;
  };
  categories: Category[];
  tags: Tag[];
  created_at: string;
  updated_at: string;
  published_at?: string;
  view_count: number;
  is_featured: boolean;
  allow_comments: boolean;
  status: 'draft' | 'pending' | 'published' | 'rejected';
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  related_posts?: {
    id: number;
    title: string;
    slug: string;
  }[];
}

// 分类接口
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  post_count?: number;
  parent?: {
    id: number;
    name: string;
    slug: string;
  } | null;
}

// 标签接口
export interface Tag {
  id: number;
  name: string;
  slug: string;
  post_count?: number;
}

// 评论接口
export interface Comment {
  id: number;
  author_name: string;
  author_email: string;
  author_url?: string;
  content: string;
  created_at: string;
  is_approved: boolean;
  parent?: number | null;
  replies?: Comment[];
}

// 搜索结果接口
export interface SearchResult {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  highlight?: string;
  published_at: string;
  relevance_score?: number;
}

// 归档接口
export interface ArchiveMonth {
  month: number;
  month_name: string;
  post_count: number;
}

export interface ArchiveYear {
  year: number;
  months: ArchiveMonth[];
  year_total: number;
}

// 统计信息接口
export interface BlogStats {
  total_posts: number;
  total_categories: number;
  total_tags: number;
  total_comments: number;
  total_views: number;
  latest_post?: {
    title: string;
    published_at: string;
  };
}

// 分页响应接口
export interface PaginatedResponse<T> {
  count: number;
  next?: string | null;
  previous?: string | null;
  results: T[];
}

// 博客文章表单数据
export interface BlogPostFormData {
  title: string;
  content: string;
  excerpt?: string;
  featured_image?: File | string;
  categories?: number[];
  tags?: string[];
  is_featured?: boolean;
  allow_comments?: boolean;
  status?: 'draft' | 'pending' | 'published';
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
}

// 评论提交数据
export interface CommentFormData {
  author_name: string;
  author_email: string;
  author_url?: string;
  content: string;
  parent?: number | null;
}

// 认证相关接口保持不变
export interface RegisterData {
  username: string;
  password: string;
  password2: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface LoginData {
  username: string;
  password: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
}

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
  name?: string;
  is_admin?: boolean;
  is_staff?: boolean;
}

// 根据环境提供不同的API基础URL
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// 安全地访问localStorage
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.warn('无法访问localStorage:', error);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn('无法访问localStorage:', error);
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('无法访问localStorage:', error);
    }
  }
};

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json; version=1'
  },
  timeout: 10000,
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    console.log('Full request URL:', `${config.baseURL || ''}${config.url || ''}`);
    console.log('Request config:', {
      method: config.method?.toUpperCase(),
      url: config.url || '',
      baseURL: config.baseURL || '',
      params: config.params,
      headers: config.headers
    });
    
    // 获取本地存储的访问令牌
    const token = safeStorage.getItem('access_token');
    const userStr = safeStorage.getItem('user');
    
    // 优先使用access_token，如果不存在，则尝试从user对象中获取
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (userStr) {
      try {
        const userData = JSON.parse(userStr);
        if (userData.access) {
          config.headers.Authorization = `Bearer ${userData.access}`;
        }
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
    
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    console.log('Received response:', response.status, response.config.url);
    console.log('Response data:', response.data);
    return response;
  },
  async (error) => {
    console.error('Response error:', error.response?.status, error.config?.url);
    
    if (error.response) {
      console.error('Error data:', error.response.data);
      console.error('Error status:', error.response.status);
      console.error('Error headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Error message:', error.message);
    }

    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        let refreshToken = safeStorage.getItem('refresh_token');
        if (!refreshToken) {
          const userStr = safeStorage.getItem('user');
          if (userStr) {
            const userData = JSON.parse(userStr);
            refreshToken = userData.refresh;
          }
        }
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }
        
        const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });
        
        const { access } = response.data;
        safeStorage.setItem('access_token', access);
        
        const userStr = safeStorage.getItem('user');
        if (userStr) {
          try {
            const userData = JSON.parse(userStr);
            userData.access = access;
            safeStorage.setItem('user', JSON.stringify(userData));
          } catch (error) {
            console.error('Error updating user data:', error);
          }
        }
        
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return apiClient(originalRequest);
      } catch (error) {
        safeStorage.removeItem('access_token');
        safeStorage.removeItem('refresh_token');
        safeStorage.removeItem('user');
        safeStorage.removeItem('userProfile');
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

// 博客API接口
const api = {
  // ========== 文章相关接口 ==========
  
  // 获取文章列表
  getPosts: async (params?: {
    page?: number;
    page_size?: number;
    category?: string;
    tag?: string;
    year?: number;
    month?: number;
    featured?: boolean;
    search?: string;
  }): Promise<PaginatedResponse<BlogPost>> => {
    const response = await apiClient.get('/posts/', { params });
    return response.data;
  },

  // 获取文章详情
  getPost: async (slug: string): Promise<BlogPost> => {
    const response = await apiClient.get(`/posts/${slug}/`);
    return response.data;
  },

  // 获取置顶文章
  getFeaturedPosts: async (limit?: number): Promise<{ results: BlogPost[] }> => {
    const response = await apiClient.get('/posts/featured/', { params: { limit } });
    return response.data;
  },

  // 获取热门文章
  getPopularPosts: async (params?: {
    limit?: number;
    period?: 'week' | 'month' | 'year' | 'all';
  }): Promise<{ results: BlogPost[] }> => {
    const response = await apiClient.get('/posts/popular/', { params });
    return response.data;
  },

  // 创建文章（需要认证）
  createPost: async (data: BlogPostFormData | FormData): Promise<BlogPost> => {
    const headers = data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined;
    const response = await apiClient.post('/posts/', data, { headers });
    return response.data;
  },

  // 更新文章（需要认证）
  updatePost: async (slug: string, data: BlogPostFormData | FormData): Promise<BlogPost> => {
    const headers = data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined;
    const response = await apiClient.put(`/posts/${slug}/`, data, { headers });
    return response.data;
  },

  // 删除文章（需要认证）
  deletePost: async (slug: string): Promise<void> => {
    await apiClient.delete(`/posts/${slug}/`);
  },

  // ========== 分类相关接口 ==========
  
  // 获取分类列表
  getCategories: async (include_count?: boolean): Promise<{ results: Category[] }> => {
    const response = await apiClient.get('/categories/', { params: { include_count } });
    return response.data;
  },

  // 获取分类详情及其文章
  getCategory: async (slug: string, params?: {
    page?: number;
    page_size?: number;
  }): Promise<{
    category: Category;
    posts: PaginatedResponse<BlogPost>;
  }> => {
    const response = await apiClient.get(`/categories/${slug}/`, { params });
    return response.data;
  },

  // ========== 标签相关接口 ==========
  
  // 获取标签列表
  getTags: async (params?: {
    popular?: boolean;
    limit?: number;
  }): Promise<{ results: Tag[] }> => {
    const response = await apiClient.get('/tags/', { params });
    return response.data;
  },

  // 获取标签文章
  getTag: async (slug: string, params?: {
    page?: number;
    page_size?: number;
  }): Promise<{
    tag: Tag;
    posts: PaginatedResponse<BlogPost>;
  }> => {
    const response = await apiClient.get(`/tags/${slug}/`, { params });
    return response.data;
  },

  // ========== 评论相关接口 ==========
  
  // 获取文章评论
  getComments: async (postId: number, page?: number): Promise<PaginatedResponse<Comment>> => {
    const response = await apiClient.get(`/posts/${postId}/comments/`, { params: { page } });
    return response.data;
  },

  // 提交评论
  createComment: async (postId: number, data: CommentFormData): Promise<Comment> => {
    const response = await apiClient.post(`/posts/${postId}/comments/`, data);
    return response.data;
  },

  // ========== 搜索接口 ==========
  
  // 搜索文章
  search: async (params: {
    q: string;
    page?: number;
    page_size?: number;
    category?: string;
  }): Promise<{
    query: string;
    count: number;
    results: SearchResult[];
  }> => {
    const response = await apiClient.get('/search/', { params });
    return response.data;
  },

  // ========== 归档接口 ==========
  
  // 获取归档信息
  getArchive: async (): Promise<{ results: ArchiveYear[] }> => {
    const response = await apiClient.get('/archive/');
    return response.data;
  },

  // ========== 统计接口 ==========
  
  // 获取博客统计信息
  getStats: async (): Promise<BlogStats> => {
    const response = await apiClient.get('/stats/');
    return response.data;
  },

  // ========== 认证相关接口 ==========
  
  // 注册新用户
  register: async (data: RegisterData): Promise<UserProfile> => {
    const response = await apiClient.post('/auth/register/', data);
    return response.data;
  },

  // 登录
  login: async (data: LoginData): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/token/', data);
    return response.data;
  },

  // 刷新令牌
  refreshToken: async (refreshToken: string): Promise<{ access: string }> => {
    const response = await apiClient.post('/auth/refresh/', { refresh: refreshToken });
    return response.data;
  },

  // 获取用户个人资料
  getUserProfile: async (): Promise<UserProfile> => {
    const response = await apiClient.get('/auth/profile/');
    return response.data;
  },

  // ========== 管理员接口 ==========
  
  // 获取待审核文章列表（管理员）
  getPendingPosts: async (): Promise<PaginatedResponse<BlogPost>> => {
    const response = await apiClient.get('/posts/pending/');
    return response.data;
  },

  // 审核文章（管理员）
  reviewPost: async (slug: string, action: 'approve' | 'reject'): Promise<{ status: string }> => {
    const response = await apiClient.put(`/posts/${slug}/review/`, { action });
    return response.data;
  },

  // 获取我的文章列表
  getMyPosts: async (): Promise<PaginatedResponse<BlogPost>> => {
    const response = await apiClient.get('/posts/', { params: { author: 'me' } });
    return response.data;
  }
};

export { safeStorage };
export default api; 