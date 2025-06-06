import api, { RegisterData, LoginData, AuthResponse, UserProfile, safeStorage } from './api';

// 重新导出类型以保持兼容性
export type { RegisterData, LoginData, AuthResponse, UserProfile };

export const register = async (data: RegisterData) => {
  return await api.register(data);
};

export const login = async (data: LoginData) => {
  try {
    const response = await api.login(data);
    if (response.access) {
      safeStorage.setItem('user', JSON.stringify(response));
      // 登录成功后立即获取用户信息
      await fetchUserProfile();
    }
    return response;
  } catch (error) {
    console.error('Login failed:', error);
    throw error;
  }
};

export const logout = () => {
  safeStorage.removeItem('user');
  safeStorage.removeItem('userProfile');
  safeStorage.removeItem('access_token');
  safeStorage.removeItem('refresh_token');
  // 可选：重定向到登录页面
  window.location.href = '/login';
};

export const fetchUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const response = await api.getUserProfile();
    
    // 合并姓和名为一个完整名字
    const userProfile = {
      ...response,
      name: `${response.first_name} ${response.last_name}`.trim() || response.username
    };
    
    console.log('userProfile', userProfile);
    
    // 保存到localStorage
    safeStorage.setItem('userProfile', JSON.stringify(userProfile));
    
    return userProfile;
  } catch (error) {
    console.error('获取用户资料失败:', error);
    return null;
  }
};

export const getCurrentUser = async (): Promise<(UserProfile & { access: string }) | null> => {
  try {
    const userStr = safeStorage.getItem('user');
    if (!userStr) {
      return null;
    }

    const userData = JSON.parse(userStr);
    if (!userData || !userData.access) {
      return null;
    }

    const profileStr = safeStorage.getItem('userProfile');
    if (profileStr) {
      const profileData = JSON.parse(profileStr);
      return { ...profileData, access: userData.access };
    }

    // If profile is not in storage, fetch it
    const profile = await fetchUserProfile();
    if (profile) {
      return { ...profile, access: userData.access };
    }
    
    return null;

  } catch (error) {
    console.warn('获取当前用户失败或用户数据损坏:', error);
    // If there's any error, treat as not logged in
    safeStorage.removeItem('user');
    safeStorage.removeItem('userProfile');
    return null;
  }
}; 