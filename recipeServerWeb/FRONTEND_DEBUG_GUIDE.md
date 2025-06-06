# 前端调试指南

## 1. 浏览器开发者工具

### 1.1 打开开发者工具
- **Windows/Linux**: `F12` 或 `Ctrl + Shift + I`
- **Mac**: `Cmd + Option + I`
- **右键菜单**: 右键点击页面 → "检查" 或 "Inspect"

### 1.2 主要调试面板

#### Console 控制台
- **查看日志**: 所有 `console.log`、`console.error` 的输出
- **JavaScript错误**: 运行时错误会在这里显示
- **执行代码**: 可以直接运行JavaScript代码
```javascript
// 在控制台中测试API调用
fetch('/api/v1/posts/')
  .then(response => response.json())
  .then(data => console.log(data));
```

#### Network 网络面板
- **查看HTTP请求**: 所有的API请求和响应
- **请求详情**: 点击请求查看Headers、Preview、Response
- **过滤请求**: 可以按类型过滤（XHR、JS、CSS等）
- **请求时间**: 查看请求的耗时

#### Elements 元素面板
- **DOM结构**: 查看页面的HTML结构
- **CSS样式**: 右侧面板显示元素的样式
- **实时修改**: 可以直接修改HTML和CSS

#### Sources 源码面板
- **设置断点**: 在JavaScript代码中设置断点
- **单步调试**: 逐行执行代码
- **查看变量**: 在断点处查看变量值

## 2. React开发工具

### 2.1 安装React DevTools
1. 访问 Chrome Web Store 搜索 "React Developer Tools"
2. 或直接访问: https://chrome.google.com/webstore/detail/react-developer-tools/
3. 点击 "Add to Chrome" 安装

### 2.2 使用React DevTools
- **Components面板**: 查看React组件树
- **Profiler面板**: 分析组件性能
- **Props和State**: 查看组件的属性和状态
- **Hooks**: 查看组件中使用的Hooks

## 3. 常见调试场景

### 3.1 API调用调试

#### 检查网络请求
```javascript
// 在组件中添加详细日志
const createPost = async (data) => {
  console.log('发送请求数据:', data);
  
  try {
    const response = await api.createPost(data);
    console.log('API响应成功:', response);
    return response;
  } catch (error) {
    console.error('API调用失败:', error);
    console.error('错误详情:', {
      status: error.response?.status,
      data: error.response?.data,
      headers: error.response?.headers
    });
    throw error;
  }
};
```

#### Network面板查看
1. 打开Network面板
2. 执行操作（如提交表单）
3. 查找对应的API请求
4. 点击请求查看详情：
   - **Headers**: 请求头和响应头
   - **Preview**: 格式化的响应数据
   - **Response**: 原始响应数据

### 3.2 状态管理调试（Redux）

#### 安装Redux DevTools
1. Chrome Web Store搜索 "Redux DevTools"
2. 安装后在开发者工具中会出现Redux面板

#### 使用Redux DevTools
- **Action日志**: 查看所有dispatch的action
- **State树**: 查看当前store的完整状态
- **时间旅行**: 可以回到之前的状态

### 3.3 表单调试

#### Antd Form调试
```javascript
const onFinish = (values) => {
  console.log('表单值:', values);
  console.log('表单实例:', form);
  
  // 获取所有字段值
  const allValues = form.getFieldsValue();
  console.log('所有字段值:', allValues);
  
  // 获取错误信息
  const errors = form.getFieldsError();
  console.log('字段错误:', errors);
};

const onFinishFailed = (errorInfo) => {
  console.log('表单验证失败:', errorInfo);
};
```

### 3.4 组件渲染调试

#### 组件生命周期日志
```javascript
const MyComponent = () => {
  console.log('组件渲染');
  
  useEffect(() => {
    console.log('组件挂载');
    return () => {
      console.log('组件卸载');
    };
  }, []);
  
  useEffect(() => {
    console.log('依赖更新');
  }, [dependency]);
  
  return <div>组件内容</div>;
};
```

## 4. 调试技巧

### 4.1 控制台命令
```javascript
// 查看组件props和state
$0 // 当前选中的DOM元素
$0._owner // 对应的React组件实例

// 清空控制台
clear()

// 复制数据到剪贴板
copy(data)
```

### 4.2 断点调试
```javascript
// 代码中设置断点
debugger; // 程序会在此处暂停

// 条件断点 - 只在特定条件下暂停
if (someCondition) {
  debugger;
}
```

### 4.3 性能调试
```javascript
// 测量代码执行时间
console.time('API调用');
await api.getPosts();
console.timeEnd('API调用');

// 记录性能标记
performance.mark('开始');
// ... 一些操作
performance.mark('结束');
performance.measure('操作耗时', '开始', '结束');
```

## 5. 常见问题解决

### 5.1 CORS跨域问题
- **现象**: 控制台显示CORS错误
- **解决**: 检查后端CORS配置或使用代理

### 5.2 404错误
- **现象**: API请求返回404
- **调试**: 检查请求URL是否正确，后端路由是否存在

### 5.3 认证问题
- **现象**: 401或403错误
- **调试**: 检查请求头中的Authorization token

### 5.4 数据格式问题
- **现象**: 服务器返回400错误
- **调试**: 检查请求体格式，对比API文档

## 6. 调试工具推荐

### 6.1 浏览器扩展
- **React Developer Tools**: React组件调试
- **Redux DevTools**: Redux状态管理调试
- **Postman Interceptor**: API测试
- **JSON Viewer**: JSON格式化显示

### 6.2 在线工具
- **JSONLint**: JSON格式验证
- **Regex101**: 正则表达式测试
- **Can I Use**: 浏览器兼容性查询

## 7. 项目特定调试

### 7.1 博客系统常见问题
```javascript
// 检查用户认证状态
console.log('当前用户:', localStorage.getItem('user'));
console.log('访问令牌:', localStorage.getItem('accessToken'));

// 检查分类数据
console.log('分类列表:', categories);

// 检查表单数据提交
console.log('FormData内容:');
for (let [key, value] of formData.entries()) {
  console.log(key, value);
}
```

### 7.2 启用详细日志
在开发环境中可以添加更多日志：
```javascript
// 在api.ts中添加请求拦截器
apiClient.interceptors.request.use(
  config => {
    console.log('API请求:', config);
    return config;
  },
  error => {
    console.error('请求错误:', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  response => {
    console.log('API响应:', response);
    return response;
  },
  error => {
    console.error('响应错误:', error);
    return Promise.reject(error);
  }
);
```

## 8. 调试最佳实践

1. **渐进式调试**: 从简单到复杂，逐步缩小问题范围
2. **保留日志**: 重要操作添加日志，方便追踪
3. **异常处理**: 所有异步操作都要有try-catch
4. **数据验证**: 在关键点验证数据格式和内容
5. **环境区分**: 开发环境可以有更多调试信息
6. **文档记录**: 记录常见问题和解决方案 