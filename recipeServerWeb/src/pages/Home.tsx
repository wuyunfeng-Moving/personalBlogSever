import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Row, Col, Typography, Spin, Alert, Tag, Empty, Menu, Select, Space, Button, Tooltip, message } from 'antd';
import { PlusOutlined, EditOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, FileOutlined, FileTextOutlined, AppstoreOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { AppDispatch, RootState } from '../store';
import { fetchRecipes } from '../store/postsSlice';
import { fetchDeviceModels } from '../store/deviceTypesSlice';
import { logout, getCurrentUser, UserProfile } from '../services/authService';
import { getPendingRecipes, reviewRecipe } from '../services/adminService';
import { getMyPosts, PostListResponse } from '../services/postService';  

const { Title, Text } = Typography;
const { Option } = Select;

type MenuKey = 'posts' | 'categories' | 'my-posts' | 'pending-reviews';

const statusColors: Record<string, string> = {
  draft: 'orange',
  pending: 'blue',
  published: 'green',
  rejected: 'red'
};

const statusIcons: Record<string, React.ReactNode> = {
  draft: <EditOutlined />,
  pending: <ClockCircleOutlined />,
  published: <CheckCircleOutlined />,
  rejected: <CloseCircleOutlined />
};

const statusText: Record<string, string> = {
  draft: '草稿',
  pending: '待审核',
  published: '已发布',
  rejected: '已拒绝'
};

const Home: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const recipes = useSelector((state: RootState) => state.recipes);
  const deviceTypes = useSelector((state: RootState) => state.deviceTypes);

  const [selectedKey, setSelectedKey] = useState<MenuKey>('posts');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [user, setUser] = useState<(UserProfile & { access: string }) | null>(null);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [myPostsLoading, setMyPostsLoading] = useState(false);
  const [myPostsError, setMyPostsError] = useState<string | null>(null);
  const [pendingPosts, setPendingPosts] = useState<any[]>([]);
  const [pendingPostsLoading, setPendingPostsLoading] = useState(false);
  const [pendingPostsError, setPendingPostsError] = useState<string | null>(null);

  // 获取用户信息
  useEffect(() => {
    const loadUserProfile = async () => {
      const userProfile = await getCurrentUser();
      setUser(userProfile);
    };

    loadUserProfile();
  }, []);

  useEffect(() => {
    dispatch(fetchRecipes(selectedCategory));
    dispatch(fetchDeviceModels());
  }, [dispatch, selectedCategory]);

  useEffect(() => {
    if (selectedKey === 'my-posts' && user) {
      fetchMyPosts();
    } else if (selectedKey === 'pending-reviews' && user && user.is_admin) {
      fetchPendingPosts();
    }
  }, [selectedKey, user]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'my-posts' && user) {
      setSelectedKey('my-posts');
    } else if (tab === 'pending-reviews' && user && user.is_admin) {
      setSelectedKey('pending-reviews');
    } else if (tab === 'categories') {
      setSelectedKey('categories');
    }
  }, [location.search, user]);

  const fetchMyPosts = async () => {
    if (!user) return;
    
    setMyPostsLoading(true);
    setMyPostsError(null);
    
    try {
      const response: PostListResponse = await getMyPosts();
      
      setMyPosts(response.results || []);
    } catch (error: any) {
      console.error('获取我的文章失败:', error);
      setMyPostsError(error.response?.data?.error || '获取失败，请重试');
    } finally {
      setMyPostsLoading(false);
    }
  };

  const fetchPendingPosts = async () => {
    if (!user || !user.is_admin) return;
    
    setPendingPostsLoading(true);
    setPendingPostsError(null);
    
    try {
      const response = await getPendingRecipes();
      setPendingPosts(response.results || []);
      
      if (response.count === 0) {
        console.log('没有待审核的文章');
      } else {
        console.log(`找到 ${response.count} 个待审核文章`);
      }
    } catch (error: any) {
      console.error('获取待审核文章失败:', error);
      setPendingPostsError(error.response?.data?.error || '获取失败，请重试');
      
      if (error.response?.status === 403) {
        message.error('您没有权限查看待审核文章');
        setSelectedKey('posts');
      }
    } finally {
      setPendingPostsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    navigate('/login');
  };

  const handleMenuClick = (key: MenuKey) => {
    setSelectedKey(key);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };

  const handleCreatePost = () => {
    navigate('/create-post');
  };
  
  const handleEditPost = (id: number) => {
    navigate(`/edit-post/${id}`);
  };

  const handlePostClick = (id: number, isMyPost = false) => {
    console.log('isMyPost', isMyPost);
    if (isMyPost) {
      navigate(`/edit-post/${id}`);
    } else {
      navigate(`/posts/${id}`);
    }
  };

  const handleCategoryClick = (category: any) => {
    setSelectedCategory(category.model_identifier);
    setSelectedKey('posts');
    message.info(`已筛选 ${category.name} 分类的文章`);
  };

  const renderCommandTemplate = (template: any) => {
    if (!template) return '无内容模板';
    try {
      return JSON.stringify(template, null, 2);
    } catch (error) {
      return '内容模板格式错误';
    }
  };

  const renderPostStatus = (status: string) => {
    return (
      <Tooltip title={statusText[status] || status}>
        <Tag color={statusColors[status] || 'default'} icon={statusIcons[status]}>
          {statusText[status] || status}
        </Tag>
      </Tooltip>
    );
  };

  const renderPostList = (
    postItems = recipes.items, 
    loading = recipes.loading, 
    error = recipes.error, 
    isMyPosts = false,
    isPendingReviews = false
  ) => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      );
    }

    if (error) {
      return (
        <Alert
          message="错误"
          description={error}
          type="error"
          showIcon
        />
      );
    }

    if (!postItems || postItems.length === 0) {
      return <Empty description={isPendingReviews ? "暂无待审核文章" : "暂无文章"} />;
    }

    return (
      <Row gutter={[16, 16]}>
        {postItems.map((post) => (
          <Col xs={24} sm={12} md={8} lg={6} key={post.id}>
            <Card
              title={post.title}
              hoverable
              onClick={() => handlePostClick(post.id, isMyPosts)}
              cover={post.featured_image && <img alt={post.title} src={post.featured_image} />}
              style={{ cursor: 'pointer' }}
              actions={isPendingReviews ? [
                <Tooltip title="通过审核">
                  <Button 
                    type="text" 
                    icon={<CheckOutlined style={{ color: 'green' }} />} 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReviewPost(post.id, 'approve');
                    }}
                  />
                </Tooltip>,
                <Tooltip title="拒绝">
                  <Button 
                    type="text" 
                    icon={<CloseOutlined style={{ color: 'red' }} />} 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReviewPost(post.id, 'reject');
                    }}
                  />
                </Tooltip>
              ] : isMyPosts ? [
                <Button 
                  type="link" 
                  icon={<EditOutlined />} 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditPost(post.id);
                  }}
                >
                  编辑
                </Button>
              ] : []}
            >
              <p>{post.excerpt}</p>
              <p>
                <Text type="secondary">作者: {post.author.username}</Text>
              </p>
              <p>
                <Text type="secondary">发布时间: {post.published_at || post.created_at}</Text>
              </p>
              {renderPostStatus(post.status)}
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  const renderDeviceList = () => {
    if (deviceTypes.loading) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      );
    }

    if (deviceTypes.error) {
      return (
        <Alert
          message="错误"
          description={deviceTypes.error}
          type="error"
          showIcon
        />
      );
    }

    if (!deviceTypes.items || deviceTypes.items.length === 0) {
      return <Empty description="暂无设备类型" />;
    }

    return (
      <Row gutter={[16, 16]}>
        {deviceTypes.items.map((deviceModel) => (
          <Col xs={24} sm={12} md={8} lg={6} key={deviceModel.id}>
            <Card
              title={deviceModel.name}
              hoverable
              onClick={() => handleCategoryClick(deviceModel)}
              style={{ cursor: 'pointer' }}
            >
              <p>
                <Text type="secondary">型号标识符: {deviceModel.model_identifier}</Text>
              </p>
              <p>
                <Text type="secondary">命令模板:</Text>
                <pre style={{ 
                  marginTop: 8,
                  padding: 8,
                  backgroundColor: '#f5f5f5',
                  borderRadius: 4,
                  fontSize: '12px',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all'
                }}>
                  {renderCommandTemplate(deviceModel.command_template)}
                </pre>
              </p>
              <Tag color={deviceModel.status === 'approved' ? 'green' : 'orange'}>
                {deviceModel.status === 'approved' ? '已批准' : '待审核'}
              </Tag>
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  const renderContent = () => {
    switch (selectedKey) {
      case 'categories':
        return renderDeviceList();
      case 'my-posts':
        return renderPostList(myPosts, myPostsLoading, myPostsError, true);
      case 'pending-reviews':
        return renderPostList(pendingPosts, pendingPostsLoading, pendingPostsError, false, true);
      default:
        return renderPostList();
    }
  };

  const handleReviewPost = async (id: number, action: 'approve' | 'reject') => {
    if (!user) return;
    
    try {
      const result = await reviewRecipe(id, action);
      message.success(action === 'approve' ? '文章已通过审核' : '已拒绝该文章');
      console.log('审核结果:', result);
      // 刷新列表
      fetchPendingPosts();
    } catch (error: any) {
      console.error('操作失败:', error);
      message.error(error.response?.data?.error || '操作失败，请重试');
      
      if (error.response?.status === 403) {
        message.error('您没有权限进行此操作');
      }
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={24} md={6} lg={5} xl={4}>
          <Card>
            <div style={{ marginBottom: '20px' }}>
              {user ? (
                <>
                  <Title level={4}>欢迎, {user.username}!</Title>
                  <Button onClick={handleLogout} style={{ marginBottom: '10px' }}>退出登录</Button>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={handleCreatePost}
                    block
                  >
                    创建文章
                  </Button>
                </>
              ) : (
                <Button type="primary" onClick={() => navigate('/login')} block>
                  登录
                </Button>
              )}
            </div>
            <Menu
              mode="inline"
              selectedKeys={[selectedKey]}
              items={[
                {
                  key: 'posts',
                  icon: <FileOutlined />,
                  label: '全部文章',
                  onClick: () => handleMenuClick('posts')
                },
                user ? {
                  key: 'my-posts',
                  icon: <FileTextOutlined />,
                  label: '我的文章',
                  onClick: () => handleMenuClick('my-posts')
                } : null,
                user && user.is_admin ? {
                  key: 'pending-reviews',
                  icon: <ClockCircleOutlined />,
                  label: '待审核文章',
                  onClick: () => handleMenuClick('pending-reviews')
                } : null,
                {
                  key: 'categories',
                  icon: <AppstoreOutlined />,
                  label: '文章分类',
                  onClick: () => handleMenuClick('categories')
                }
              ].filter(Boolean) as any}
            />
          </Card>
        </Col>
        <Col xs={24} sm={24} md={18} lg={19} xl={20}>
          <Card>
            <div style={{ marginBottom: '20px' }}>
              <Row justify="space-between" align="middle">
                <Col>
                  <Title level={3}>
                    {selectedKey === 'posts' && '全部文章'}
                    {selectedKey === 'my-posts' && '我的文章'}
                    {selectedKey === 'categories' && '文章分类'}
                    {selectedKey === 'pending-reviews' && '待审核文章'}
                  </Title>
                </Col>
                <Col>
                  {selectedKey === 'posts' && (
                    <Select
                      placeholder="按分类筛选"
                      style={{ width: 200 }}
                      allowClear
                      onChange={handleCategoryChange}
                      value={selectedCategory || undefined}
                    >
                      {deviceTypes.items?.map((deviceType) => (
                        <Option
                          key={deviceType.model_identifier}
                          value={deviceType.model_identifier}
                        >
                          {deviceType.name}
                        </Option>
                      ))}
                    </Select>
                  )}
                </Col>
              </Row>
            </div>
            {renderContent()}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Home; 