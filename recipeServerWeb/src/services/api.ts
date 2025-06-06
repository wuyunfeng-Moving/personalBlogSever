import axios from 'axios';

// 创建一个API配置文件
export interface Recipe {
  id: number;
  title: string;
  description: string;
  author: {
    id: number;
    username: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    date_joined?: string;
  };
  steps: Array<
    string | { stepNo: number; stepDescription: string; imageUrl?: string }
  >;
  ingredients: Array<string | { name: string; amount?: string; unit?: string }>;
  staple_food: Array<string | { name: string; amount?: string; unit?: string }>;
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  image?: string;
  imageUrl?: string;
  difficulty?: string | number;
  suitable_person?: string | number;
  tags?: string[] | string;
  work_modes?: string[] | string;
  temperature_value?: number;
  temperature_unit?: string;
  comal_position?: string;
  status: string;
  created_at: string;
  updated_at: string;
  device_types?: { model_identifier: string; command: string }[];
  cloud_commands?: any;
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

export interface RecipeListResponse {
  count: number;
  results: Recipe[];
}

// 设备类型相关接口
export interface DeviceModel {
  id: number;
  model_identifier: string;
  name: string;
  status: 'pending' | 'approved' | 'rejected';
  command_template?: string;
}

export interface DeviceModelListResponse {
  count: number;
  results: DeviceModel[];
}

export interface CommandStep {
  stepNo: number;
  stepDescription: string;
}

export interface CloudCommandData {
  model: string;
  hex_command: string;
  steps: CommandStep[];
}

export interface RecipeFormData {
  title: string;
  description: string;
  steps: Array<{
    stepNo: number;
    stepDescription: string;
    imageUrl?: string;
  }>;
  ingredients: string[];
  staple_food: string[];
  difficulty: string;
  prep_time_minutes: number;
  cook_time_minutes: number;
  servings: number;
  tags?: string;
  suitable_person?: number;
  work_modes?: string;
  temperature_value?: number;
  temperature_unit?: string;
  comal_position?: string;
  cloud_commands?: CloudCommandData[];
  status?: 'draft' | 'pending' | 'published' | 'rejected';
}

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

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'  // 明确要求JSON响应
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
      // 服务器返回错误状态码
      console.error('Error data:', error.response.data);
      console.error('Error status:', error.response.status);
      console.error('Error headers:', error.response.headers);
    } else if (error.request) {
      // 请求已发送但没有收到响应
      console.error('No response received:', error.request);
    } else {
      // 请求配置出错
      console.error('Error message:', error.message);
    }

    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // 尝试使用refresh_token或user对象中的refresh获取新令牌
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
        
        // 如果存在user对象，则更新其中的access
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
        // 刷新令牌失败，清除所有认证数据
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

const api = {
  // 获取菜谱列表
  getRecipes: async (params?: { model?: string; author?: string }): Promise<RecipeListResponse> => {
    const response = await apiClient.get('/recipes/', { params });
    return response.data;
  },

  // 获取设备类型列表
  getDeviceModels: async (): Promise<DeviceModelListResponse> => {
    const response = await apiClient.get('/device-models/');
    return response.data;
  },

  // 获取菜谱详情
  getRecipeDetail: async (id: number | string): Promise<Recipe> => {
    const response = await apiClient.get(`/recipes/${id}/`);
    return response.data;
  },

  // 获取设备类型详情
  getDeviceModelDetail: async (id: number | string): Promise<DeviceModel> => {
    const response = await apiClient.get(`/device-models/${id}/`);
    return response.data;
  },

  // 创建新菜谱
  createRecipe: async (data: RecipeFormData | FormData): Promise<Recipe> => {
    const headers = data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined;
    const response = await apiClient.post('/recipes/create/', data, { headers });
    return response.data;
  },

  // 更新菜谱
  updateRecipe: async (id: number | string, data: RecipeFormData | FormData): Promise<Recipe> => {
    const headers = data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : undefined;
    const response = await apiClient.put(`/recipes/${id}/update/`, data, { headers });
    return response.data;
  },

  // 删除菜谱
  deleteRecipe: async (id: number | string): Promise<void> => {
    await apiClient.delete(`/recipes/${id}/delete/`);
  },

  // 提交菜谱审核
  submitRecipeForReview: async (id: number | string): Promise<Recipe> => {
    const response = await apiClient.put(`/recipes/${id}/submit-review/`);
    return response.data;
  },

  // 取消菜谱审核
  cancelRecipeReview: async (id: number | string): Promise<Recipe> => {
    const response = await apiClient.put(`/recipes/${id}/cancel-review/`);
    return response.data;
  },

  // 获取菜谱命令
  getRecipeCommands: async (recipeId: number | string, modelIdentifier: string): Promise<any> => {
    const response = await apiClient.get(`/recipes/${recipeId}/commands/`, { 
      params: { model: modelIdentifier } 
    });
    return response.data;
  },

  // 获取我的菜谱列表
  getMyRecipes: async (): Promise<RecipeListResponse> => {
    const response = await apiClient.get('/recipes/', { params: { author: 'me' } });
    return response.data;
  },

  // 创建新设备类型
  createDeviceModel: async (deviceModel: Omit<DeviceModel, 'id' | 'status'>): Promise<DeviceModel> => {
    const response = await apiClient.post('/device-models/create/', deviceModel);
    return response.data;
  },

  // 更新设备类型
  updateDeviceModel: async (id: number | string, deviceModel: Partial<Omit<DeviceModel, 'id' | 'status'>>): Promise<DeviceModel> => {
    const response = await apiClient.put(`/device-models/${id}/update/`, deviceModel);
    return response.data;
  },

  // 删除设备类型
  deleteDeviceModel: async (id: number | string): Promise<void> => {
    await apiClient.delete(`/device-models/${id}/delete/`);
  },

  // 获取待审核的菜谱列表
  getPendingRecipes: async (): Promise<RecipeListResponse> => {
    const response = await apiClient.get('/recipes/pending/');
    return response.data;
  },

  // 审核菜谱
  reviewRecipe: async (id: number | string, action: 'approve' | 'reject'): Promise<{ status: string }> => {
    const response = await apiClient.put(`/recipes/${id}/review/`, { action });
    return response.data;
  },

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
  }
};

export { safeStorage };
export default api; 