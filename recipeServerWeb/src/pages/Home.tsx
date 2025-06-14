import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Row, Col, Typography, Spin, Alert, Tag, Empty, Menu, Select, Button, Tooltip, message, Input, Space } from 'antd';
import DebugHelper from '../components/DebugHelper';
import { PlusOutlined, EditOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, FileOutlined, FileTextOutlined, GlobalOutlined, DeleteOutlined, HistoryOutlined, SearchOutlined } from '@ant-design/icons';
import { AppDispatch, RootState } from '../store';
import { fetchPosts } from '../store/postsSlice';
import { logout, getCurrentUser, UserProfile } from '../services/authService';
import { getCategories, getMyPosts, PostListResponse, Category, deletePost } from '../services/postService';
import PostsMap from '../components/PostsMap';
import DeleteConfirmModal from '../components/DeleteConfirmModal';

const { Title, Text } = Typography;
const { Option } = Select;

type MenuKey = 'map' | 'posts' | 'my-posts';

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
  
  // 搜索和筛选状态
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [filteredMyPosts, setFilteredMyPosts] = useState<any[]>([]);
  
  // 删除确认模态框状态
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ slug: string; title: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
      loadCategories();
    }
  }, [selectedKey, user]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab') as MenuKey | null;
    if (tab && ['map', 'posts', 'my-posts'].includes(tab)) {
        if ((tab === 'my-posts' && user) || (tab !== 'my-posts')) {
            setSelectedKey(tab);
        }
    }
  }, [location.search, user]);

  // 根据搜索关键词和分类筛选我的文章
  useEffect(() => {
    let filtered = myPosts;
    
    // 关键词搜索
    if (searchKeyword.trim()) {
      filtered = filtered.filter(post => 
        post.title.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        (post.content && post.content.toLowerCase().includes(searchKeyword.toLowerCase()))
      );
    }
    
    // 分类筛选
    if (selectedCategory) {
      filtered = filtered.filter(post => 
        post.categories?.some((cat: Category) => cat.slug === selectedCategory)
      );
    }
    
    setFilteredMyPosts(filtered);
  }, [myPosts, searchKeyword, selectedCategory]);

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

  const loadCategories = async () => {
    try {
      const response = await getCategories(true);
      setCategories(response.results || []);
    } catch (error: any) {
      console.error('获取分类失败:', error);
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

  const handleDeletePost = (slug: string, title: string) => {
    console.log('handleDeletePost called with:', { slug, title });
    setDeleteTarget({ slug, title });
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    
    const { slug, title } = deleteTarget;
    setDeleteLoading(true);
    
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
      
      // 关闭模态框
      setDeleteModalVisible(false);
      setDeleteTarget(null);
      
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
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelDelete = () => {
    console.log('用户取消删除操作');
    setDeleteModalVisible(false);
    setDeleteTarget(null);
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

  const renderMyPostsWithSearch = () => {
    return (
      <div>
        {/* 搜索和筛选区域 */}
        <div style={{ marginBottom: '20px' }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} sm={12} md={10}>
              <Input.Search
                placeholder="搜索文章标题或内容..."
                allowClear
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onSearch={(value) => setSearchKeyword(value)}
                style={{ width: '100%' }}
                enterButton
              />
            </Col>
            <Col xs={24} sm={12} md={8}>
              <Select
                placeholder="按分类筛选"
                allowClear
                value={selectedCategory || undefined}
                onChange={handleCategoryChange}
                style={{ width: '100%' }}
              >
                <Option value="">全部分类</Option>
                {categories.map((category) => (
                  <Option key={category.slug} value={category.slug}>
                    {category.name} ({category.post_count || 0})
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} md={6}>
              <Space>
                <Text type="secondary">
                  共 {filteredMyPosts.length} 篇
                </Text>
                {(searchKeyword || selectedCategory) && (
                  <Button 
                    size="small" 
                    onClick={() => {
                      setSearchKeyword('');
                      setSelectedCategory('');
                    }}
                  >
                    清除筛选
                  </Button>
                )}
              </Space>
            </Col>
          </Row>
        </div>
        
        {/* 文章列表 */}
        {renderPostList(filteredMyPosts, myPostsLoading, myPostsError, true)}
      </div>
    );
  };

  const renderContent = () => {
    switch (selectedKey) {
      case 'map':
        return <PostsMap />;
      case 'posts':
        return renderPostList();
      case 'my-posts':
        return renderMyPostsWithSearch();
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
                  </Title>
                </Col>
              </Row>
            </div>
            {renderContent()}
          </Card>
        </Col>
      </Row>

      {/* 删除确认模态框 */}
      <DeleteConfirmModal
        visible={deleteModalVisible}
        title="确认删除文章"
        itemName={deleteTarget?.title || ''}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        loading={deleteLoading}
      />
    </div>
  );
};

export default Home; 