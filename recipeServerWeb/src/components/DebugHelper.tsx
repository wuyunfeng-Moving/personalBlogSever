import React, { useState } from 'react';
import { Card, Collapse, Typography, Tag, Button, Space, Divider } from 'antd';
import { BugOutlined, EyeOutlined, EyeInvisibleOutlined } from '@ant-design/icons';

const { Panel } = Collapse;
const { Text, Paragraph } = Typography;

interface DebugHelperProps {
  visible?: boolean;
}

const DebugHelper: React.FC<DebugHelperProps> = ({ visible = false }) => {
  const [isVisible, setIsVisible] = useState(visible);

  // 只在开发环境显示
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const getCurrentUser = () => {
    try {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  };

  const getAuthToken = () => {
    return localStorage.getItem('accessToken');
  };

  const checkAPIStatus = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/stats/');
      return {
        status: response.status,
        ok: response.ok,
        data: await response.json()
      };
    } catch (error) {
      return {
        status: 'error',
        ok: false,
        error: error.message
      };
    }
  };

  const clearAuthData = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    console.log('已清除认证数据');
    window.location.reload();
  };

  const user = getCurrentUser();
  const token = getAuthToken();

  if (!isVisible) {
    return (
      <div style={{ 
        position: 'fixed', 
        bottom: '20px', 
        right: '20px', 
        zIndex: 1000 
      }}>
        <Button
          type="primary"
          shape="circle"
          icon={<BugOutlined />}
          onClick={() => setIsVisible(true)}
          title="显示调试信息"
        />
      </div>
    );
  }

  return (
    <div style={{ 
      position: 'fixed', 
      bottom: '20px', 
      right: '20px', 
      width: '400px', 
      maxHeight: '500px', 
      overflow: 'auto',
      zIndex: 1000 
    }}>
      <Card
        title={
          <Space>
            <BugOutlined />
            调试助手
          </Space>
        }
        size="small"
        extra={
          <Button
            type="text"
            icon={<EyeInvisibleOutlined />}
            onClick={() => setIsVisible(false)}
          />
        }
      >
        <Collapse size="small" ghost>
          <Panel header="用户状态" key="user">
            {user ? (
              <div>
                <Text strong>用户名: </Text>
                <Text>{user.username}</Text>
                <br />
                <Text strong>权限: </Text>
                <Tag color={user.is_admin ? 'red' : 'blue'}>
                  {user.is_admin ? '管理员' : '普通用户'}
                </Tag>
                <br />
                <Text strong>Token: </Text>
                <Text code style={{ fontSize: '10px' }}>
                  {token ? `${token.substring(0, 20)}...` : '无'}
                </Text>
              </div>
            ) : (
              <Text type="secondary">未登录</Text>
            )}
          </Panel>

          <Panel header="本地存储" key="storage">
            <Paragraph>
              <Text strong>localStorage keys:</Text>
              <br />
              {Object.keys(localStorage).map(key => (
                <Tag key={key} style={{ margin: '2px' }}>{key}</Tag>
              ))}
            </Paragraph>
          </Panel>

          <Panel header="API状态" key="api">
            <Button
              size="small"
              onClick={async () => {
                const status = await checkAPIStatus();
                console.log('API状态:', status);
              }}
            >
              检查API连接
            </Button>
            <Divider type="vertical" />
            <Button
              size="small"
              onClick={() => {
                console.log('当前用户:', user);
                console.log('认证Token:', token);
                console.log('localStorage:', localStorage);
              }}
            >
              输出到控制台
            </Button>
          </Panel>

          <Panel header="操作工具" key="tools">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button size="small" danger onClick={clearAuthData}>
                清除认证数据
              </Button>
              <Button 
                size="small" 
                onClick={() => window.open('http://localhost:8000/api/docs/', '_blank')}
              >
                打开API文档
              </Button>
              <Button
                size="small"
                onClick={() => {
                  console.clear();
                  console.log('控制台已清空');
                }}
              >
                清空控制台
              </Button>
            </Space>
          </Panel>

          <Panel header="快速测试" key="test">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Button
                size="small"
                onClick={async () => {
                  try {
                    const response = await fetch('http://localhost:8000/api/v1/posts/');
                    const data = await response.json();
                    console.log('文章列表:', data);
                  } catch (error) {
                    console.error('获取文章失败:', error);
                  }
                }}
              >
                测试获取文章
              </Button>
              <Button
                size="small"
                onClick={async () => {
                  try {
                    const response = await fetch('http://localhost:8000/api/v1/categories/');
                    const data = await response.json();
                    console.log('分类列表:', data);
                  } catch (error) {
                    console.error('获取分类失败:', error);
                  }
                }}
              >
                测试获取分类
              </Button>
            </Space>
          </Panel>
        </Collapse>
      </Card>
    </div>
  );
};

export default DebugHelper; 