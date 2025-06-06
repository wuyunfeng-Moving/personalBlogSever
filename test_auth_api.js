// 认证API测试脚本
// 使用方法: 在浏览器控制台中运行各个测试函数

const BASE_URL = 'http://127.0.0.1:8000/api/v1';

// 测试注册功能
async function testRegister() {
  console.log('🔍 测试用户注册...');
  
  const testUser = {
    username: 'testuser' + Date.now(),
    email: 'test@example.com',
    password: 'testpassword123',
    password2: 'testpassword123',
    first_name: 'Test',
    last_name: 'User'
  };
  
  try {
    const response = await fetch(`${BASE_URL}/auth/register/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testUser)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ 注册成功:', {
        状态码: response.status,
        用户名: data.user?.username,
        邮箱: data.user?.email,
        已获取令牌: !!data.access
      });
      
      // 保存令牌用于后续测试
      localStorage.setItem('test_access_token', data.access);
      localStorage.setItem('test_refresh_token', data.refresh);
      
      return data;
    } else {
      console.log('❌ 注册失败:', {
        状态码: response.status,
        错误信息: data.error,
        详细信息: data.details
      });
    }
  } catch (error) {
    console.log('❌ 注册请求失败:', error.message);
  }
}

// 测试登录功能
async function testLogin() {
  console.log('🔍 测试用户登录...');
  
  const loginData = {
    username: 'admin',  // 假设有管理员用户
    password: 'admin123'
  };
  
  try {
    const response = await fetch(`${BASE_URL}/auth/token/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData)
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ 登录成功:', {
        状态码: response.status,
        用户名: data.user?.username,
        已获取令牌: !!data.access
      });
      
      // 保存令牌
      localStorage.setItem('test_access_token', data.access);
      localStorage.setItem('test_refresh_token', data.refresh);
      
      return data;
    } else {
      console.log('❌ 登录失败:', {
        状态码: response.status,
        错误信息: data.error,
        详细信息: data.details
      });
    }
  } catch (error) {
    console.log('❌ 登录请求失败:', error.message);
  }
}

// 测试获取用户信息
async function testGetProfile() {
  console.log('🔍 测试获取用户信息...');
  
  const token = localStorage.getItem('test_access_token');
  if (!token) {
    console.log('❌ 没有访问令牌，请先登录');
    return;
  }
  
  try {
    const response = await fetch(`${BASE_URL}/auth/profile/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ 获取用户信息成功:', {
        状态码: response.status,
        用户ID: data.id,
        用户名: data.username,
        邮箱: data.email,
        姓名: data.name,
        是否管理员: data.is_admin
      });
      return data;
    } else {
      console.log('❌ 获取用户信息失败:', {
        状态码: response.status,
        错误信息: data.error
      });
    }
  } catch (error) {
    console.log('❌ 获取用户信息请求失败:', error.message);
  }
}

// 测试刷新令牌
async function testRefreshToken() {
  console.log('🔍 测试刷新令牌...');
  
  const refreshToken = localStorage.getItem('test_refresh_token');
  if (!refreshToken) {
    console.log('❌ 没有刷新令牌');
    return;
  }
  
  try {
    const response = await fetch(`${BASE_URL}/auth/refresh/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh: refreshToken })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ 刷新令牌成功:', {
        状态码: response.status,
        新访问令牌: !!data.access
      });
      
      // 更新访问令牌
      localStorage.setItem('test_access_token', data.access);
      
      return data;
    } else {
      console.log('❌ 刷新令牌失败:', {
        状态码: response.status,
        错误信息: data.error
      });
    }
  } catch (error) {
    console.log('❌ 刷新令牌请求失败:', error.message);
  }
}

// 运行所有认证测试
async function runAuthTests() {
  console.log('🚀 开始认证API测试...\n');
  
  // 测试注册
  await testRegister();
  console.log('');
  
  // 等待1秒
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 测试登录
  await testLogin();
  console.log('');
  
  // 等待1秒
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 测试获取用户信息
  await testGetProfile();
  console.log('');
  
  // 等待1秒
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 测试刷新令牌
  await testRefreshToken();
  console.log('');
  
  console.log('🎉 认证API测试完成！');
}

// 清理测试数据
function clearTestData() {
  localStorage.removeItem('test_access_token');
  localStorage.removeItem('test_refresh_token');
  console.log('✅ 测试数据已清理');
}

// 导出函数供浏览器使用
if (typeof window !== 'undefined') {
  window.testRegister = testRegister;
  window.testLogin = testLogin;
  window.testGetProfile = testGetProfile;
  window.testRefreshToken = testRefreshToken;
  window.runAuthTests = runAuthTests;
  window.clearTestData = clearTestData;
  
  console.log('认证API测试函数已加载，可以运行:');
  console.log('- testRegister() - 测试注册');
  console.log('- testLogin() - 测试登录');
  console.log('- testGetProfile() - 测试获取用户信息');
  console.log('- testRefreshToken() - 测试刷新令牌');
  console.log('- runAuthTests() - 运行所有测试');
  console.log('- clearTestData() - 清理测试数据');
} 