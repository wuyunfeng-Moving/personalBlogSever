import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Row, Col, Typography, Spin, Alert, Tag, Empty, Menu, Select, Button, Tooltip, message, List, Modal } from 'antd';
import DebugHelper from '../components/DebugHelper';
import { PlusOutlined, EditOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, FileOutlined, FileTextOutlined, AppstoreOutlined, GlobalOutlined, DeleteOutlined, HistoryOutlined } from '@ant-design/icons';
import { AppDispatch, RootState } from '../store';
import { fetchPosts } from '../store/postsSlice';
import { logout, getCurrentUser, UserProfile } from '../services/authService';
import { getCategories, getMyPosts, PostListResponse, Category, deletePost } from '../services/postService';
import PostsMap from '../components/PostsMap';

const { Title, Text } = Typography;
const { Option } = Select;

type MenuKey = 'map' | 'posts' | 'categories' | 'my-posts';

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
  const posts = useSelector((state: RootState) => state.posts);

  const [selectedKey, setSelectedKey] = useState<MenuKey>('map');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [user, setUser] = useState<(UserProfile & { access: string }) | null>(null);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [myPostsLoading, setMyPostsLoading] = useState(false);
  const [myPostsError, setMyPostsError] = useState<string | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserProfile = async () => {
      const userProfile = await getCurrentUser();
      setUser(userProfile);
    };
    loadUserProfile();
  }, []);

  useEffect(() => {
    dispatch(fetchPosts(selectedCategory));
  }, [dispatch, selectedCategory]);

  useEffect(() => {
    if (selectedKey === 'my-posts' && user) {
      fetchMyPosts();
    } else if (selectedKey === 'categories') {
      fetchCategories();
    }
  }, [selectedKey, user]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab') as MenuKey | null;
    if (tab && ['map', 'posts', 'categories', 'my-posts'].includes(tab)) {
        if ((tab === 'my-posts' && user) || (tab !== 'my-posts')) {
            setSelectedKey(tab);
        }
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
      setMyPostsError(error.response?.data?.error || '获取我的文章失败');
    } finally {
      setMyPostsLoading(false);
    }
  };

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    setCategoriesError(null);
    try {
      const response = await getCategories(true); // include_count=true
      setCategories(response.results || []);
    } catch (error: any) {
      setCategoriesError(error.response?.data?.error || '获取分类失败');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    navigate('/login');
  };

  const handleMenuClick = (key: MenuKey) => {
    setSelectedKey(key);
    navigate(`/?tab=${key}`);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    setSelectedKey('posts'); // Switch to post list view
    if (value) {
      const categoryName = categories.find(c => c.slug === value)?.name;
      message.info(`已筛选 "${categoryName}" 分类的文章`);
      navigate(`/?tab=posts`);
    }
  };

  const handleCreatePost = () => navigate('/create-post');
  const handleEditPost = (id: number) => navigate(`/edit-post/${id}`);

  const handleDeletePost = async (slug: string, title: string) => {
    Modal.confirm({
      title: `确定要删除文章 "${title}" 吗？`,
      content: '此操作不可撤销，但您仍然可以在历史记录中查看该文章的过往版本。',
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      width: 500,
      onOk: async () => {
        try {
          console.log(`开始删除文章: ${title} (slug: ${slug})`);
          
          // 显示删除进度
          const hideLoading = message.loading(`正在删除文章 "${title}"...`, 0);
          
          await deletePost(slug);
          
          hideLoading();
          console.log(`文章删除成功: ${title}`);
          message.success(`文章 "${title}" 已被删除`);
          
          // 立即刷新我的文章列表
          await fetchMyPosts();
          
          // 如果当前在全部文章页面，也刷新全部文章
          if (selectedKey === 'posts') {
            dispatch(fetchPosts(selectedCategory));
          }
          
        } catch (error: any) {
          console.error('删除文章失败:', error);
          
          // 详细的错误处理
          let errorMessage = '删除文章失败';
          
          if (error.response) {
            const status = error.response.status;
            const data = error.response.data;
            
            if (status === 401) {
              errorMessage = '认证失败，请重新登录';
            } else if (status === 403) {
              errorMessage = '权限不足，您只能删除自己的文章';
            } else if (status === 404) {
              errorMessage = '文章不存在，可能已被删除';
            } else if (status >= 500) {
              errorMessage = '服务器错误，请稍后重试';
            } else {
              errorMessage = data?.detail || data?.error || `删除失败 (状态码: ${status})`;
            }
          } else if (error.request) {
            errorMessage = '网络连接失败，请检查网络连接';
          } else {
            errorMessage = error.message || '未知错误';
          }
          
          message.error(errorMessage);
          
          // 显示详细错误信息（开发环境）
          if (import.meta.env.DEV) {
            console.error('删除错误详情:', {
              slug,
              title,
              error: error.response?.data,
              status: error.response?.status,
              message: error.message
            });
          }
        }
      },
    });
  };

  const handleViewHistory = (slug: string) => {
    navigate(`/posts/${slug}/history`);
  };

  const handlePostClick = (post: any, isMyPost = false) => {
    if (isMyPost) {
      navigate(`/edit-post/${post.slug}`); //  also use slug for editing
    } else {
      navigate(`/posts/${post.slug}`);
    }
  };

  const renderPostStatus = (status: string) => (
    <Tooltip title={statusText[status] || status}>
      <Tag color={statusColors[status] || 'default'} icon={statusIcons[status]}>
        {statusText[status] || status}
      </Tag>
    </Tooltip>
  );

  const renderPostList = (
    postItems = posts.items,
    loading = posts.loading,
    error = posts.error,
    isMyPosts = false,
  ) => {
    if (loading) return <div style={{ textAlign: 'center', padding: '40px 0' }}><Spin size="large" /></div>;
    if (error) return <Alert message="错误" description={error} type="error" showIcon />;
    if (!postItems || postItems.length === 0) return <Empty description="暂无文章" />;

    return (
      <Row gutter={[16, 16]}>
        {postItems.map((post) => (
          <Col xs={24} sm={12} md={8} lg={8} xl={6} key={post.id}>
            <Card
              title={post.title}
              hoverable
              onClick={() => handlePostClick(post, isMyPosts)}
              cover={post.featured_image && <img alt={post.title} src={post.featured_image} style={{ height: 180, objectFit: 'cover' }} />}
              actions={isMyPosts ? [
                <Tooltip title="编辑"><Button type="text" icon={<EditOutlined />} onClick={(e) => { e.stopPropagation(); navigate(`/edit-post/${post.slug}`); }} /></Tooltip>,
                <Tooltip title="查看历史"><Button type="text" icon={<HistoryOutlined />} onClick={(e) => { e.stopPropagation(); handleViewHistory(post.slug); }} /></Tooltip>,
                <Tooltip title="删除"><Button type="text" danger icon={<DeleteOutlined />} onClick={(e) => { e.stopPropagation(); handleDeletePost(post.slug, post.title); }} /></Tooltip>,
              ] : []}
            >
              <Card.Meta
                description={post.excerpt}
                style={{ height: 60, overflow: 'hidden' }}
              />
              <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>作者: {post.author.username}</Text>
                {renderPostStatus(post.status)}
              </div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
                发布于: {new Date(post.published_at || post.created_at).toLocaleDateString()}
              </Text>
            </Card>
          </Col>
        ))}
      </Row>
    );
  };

  const renderCategoryList = () => {
    if (categoriesLoading) return <div style={{ textAlign: 'center', padding: '40px 0' }}><Spin size="large" /></div>;
    if (categoriesError) return <Alert message="错误" description={categoriesError} type="error" showIcon />;
    if (!categories || categories.length === 0) return <Empty description="暂无分类" />;

    return (
      <List
        itemLayout="horizontal"
        dataSource={categories}
        renderItem={item => (
          <List.Item
            actions={[<Button type="link" onClick={() => handleCategoryChange(item.slug)}>查看该分类下的文章</Button>]}
          >
            <List.Item.Meta
              title={<Text strong>{item.name}</Text>}
              description={item.description || '暂无描述'}
            />
            <div>
              <Tag color="blue">文章数: {item.post_count || 0}</Tag>
            </div>
          </List.Item>
        )}
      />
    );
  };

  const renderContent = () => {
    switch (selectedKey) {
      case 'map':
        return <PostsMap />;
      case 'posts':
        return renderPostList();
      case 'categories':
        return renderCategoryList();
      case 'my-posts':
        return renderPostList(myPosts, myPostsLoading, myPostsError, true);
      default:
        return renderPostList();
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <DebugHelper />
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={24} md={6} lg={5} xl={4}>
          <Card>
            <div style={{ marginBottom: '20px' }}>
              {user ? (
                <>
                  <Title level={4}>欢迎, {user.username}!</Title>
                  <Button onClick={handleLogout} style={{ marginBottom: '10px' }}>退出登录</Button>
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleCreatePost} block>创建文章</Button>
                </>
              ) : (
                <Button type="primary" onClick={() => navigate('/login')} block>登录</Button>
              )}
            </div>
            <Menu
              mode="inline"
              selectedKeys={[selectedKey]}
              items={[
                { key: 'map', icon: <GlobalOutlined />, label: '地图视图', onClick: () => handleMenuClick('map') },
                { key: 'posts', icon: <FileOutlined />, label: '全部文章', onClick: () => handleMenuClick('posts') },
                user ? { key: 'my-posts', icon: <FileTextOutlined />, label: '我的文章', onClick: () => handleMenuClick('my-posts') } : null,
                { key: 'categories', icon: <AppstoreOutlined />, label: '文章分类', onClick: () => handleMenuClick('categories') }
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
                    {selectedKey === 'map' && '地图视图'}
                    {selectedKey === 'posts' && '全部文章'}
                    {selectedKey === 'my-posts' && '我的文章'}
                    {selectedKey === 'categories' && '文章分类'}
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
                      loading={categoriesLoading}
                    >
                      <Option value="">全部分类</Option>
                      {categories.map((category) => (
                        <Option key={category.slug} value={category.slug}>
                          {category.name}
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