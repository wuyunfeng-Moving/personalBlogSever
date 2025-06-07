import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Typography, Tag, Spin, Alert, Button, Space, Divider, Row, Col } from 'antd';
import { 
  ArrowLeftOutlined, 
  EnvironmentOutlined, 
  UserOutlined, 
  CalendarOutlined,
  TagOutlined,
  EyeOutlined,
  EditOutlined
} from '@ant-design/icons';
import { getPostById } from '../services/postService';
import { getCurrentUser, UserProfile } from '../services/authService';
import { BlogPost } from '../services/api';

const { Title, Text, Paragraph } = Typography;

const PostDetailView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<(UserProfile & { access: string }) | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const userProfile = await getCurrentUser();
      setUser(userProfile);
    };
    loadUser();
  }, []);

  useEffect(() => {
    const loadPost = async () => {
      if (!slug) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const postData = await getPostById(slug);
        setPost(postData);
      } catch (error: any) {
        console.error('加载文章失败:', error);
        if (error.response?.status === 404) {
          setError('文章不存在或已被删除');
        } else {
          setError('加载文章失败，请稍后重试');
        }
      } finally {
        setLoading(false);
      }
    };

    loadPost();
  }, [slug]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleEdit = () => {
    if (post) {
      navigate(`/edit-post/${post.slug}`);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'orange',
      pending: 'blue',
      published: 'green',
      rejected: 'red'
    };
    return colors[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts: Record<string, string> = {
      draft: '草稿',
      pending: '待审核',
      published: '已发布',
      rejected: '已拒绝'
    };
    return texts[status] || status;
  };

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '400px' 
      }}>
        <Spin size="large" tip="加载文章中..." />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
        <Alert
          message="错误"
          description={error || '文章不存在'}
          type="error"
          showIcon
          action={
            <Button onClick={handleBack}>
              返回
            </Button>
          }
        />
      </div>
    );
  }

  const isMyPost = user && post.author.id === user.id;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px' }}>
      {/* 顶部操作栏 */}
      <div style={{ marginBottom: '24px' }}>
        <Space>
          <Button 
            icon={<ArrowLeftOutlined />} 
            onClick={handleBack}
          >
            返回
          </Button>
          {isMyPost && (
            <Button 
              type="primary"
              icon={<EditOutlined />} 
              onClick={handleEdit}
            >
              编辑文章
            </Button>
          )}
        </Space>
      </div>

      <Card>
        {/* 文章标题和状态 */}
        <div style={{ marginBottom: '24px' }}>
          <Space direction="vertical" size="small" style={{ width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Title level={1} style={{ margin: 0, flex: 1 }}>
                {post.title}
              </Title>
              <Tag color={getStatusColor(post.status)} style={{ marginLeft: '16px' }}>
                {getStatusText(post.status)}
              </Tag>
            </div>
          </Space>
        </div>

        {/* 文章元信息 */}
        <div style={{ marginBottom: '24px' }}>
          <Row gutter={[16, 8]}>
            <Col>
              <Space>
                <UserOutlined />
                <Text>作者: {post.author.username}</Text>
              </Space>
            </Col>
            <Col>
              <Space>
                <CalendarOutlined />
                <Text>
                  发布于: {new Date(post.published_at || post.created_at).toLocaleString()}
                </Text>
              </Space>
            </Col>
            {post.view_count > 0 && (
              <Col>
                <Space>
                  <EyeOutlined />
                  <Text>阅读量: {post.view_count}</Text>
                </Space>
              </Col>
            )}
          </Row>
        </div>

        {/* 分类信息 */}
        {post.categories && post.categories.length > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <Space>
              <Text strong>分类:</Text>
              {post.categories.map(category => (
                <Tag key={category.id} color="blue">
                  {category.name}
                </Tag>
              ))}
            </Space>
          </div>
        )}

        {/* 标签信息 */}
        {post.tags && post.tags.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <Space wrap>
              <TagOutlined />
              <Text strong>标签:</Text>
              {post.tags.map(tag => (
                <Tag key={tag.id} color="geekblue">
                  {tag.name}
                </Tag>
              ))}
            </Space>
          </div>
        )}

        {/* 地理位置信息 */}
        {post.latitude && post.longitude && (
          <div style={{ marginBottom: '24px' }}>
            <Card 
              size="small" 
              title={
                <Space>
                  <EnvironmentOutlined style={{ color: '#1890ff' }} />
                  <Text strong>地理位置</Text>
                </Space>
              }
              style={{ backgroundColor: '#f6ffed' }}
            >
              <Space direction="vertical" size="small">
                {post.location_name && (
                  <Text strong style={{ fontSize: '16px' }}>
                    📍 {post.location_name}
                  </Text>
                )}
                <Text type="secondary">
                  经度: {post.longitude.toFixed(6)} | 纬度: {post.latitude.toFixed(6)}
                </Text>
              </Space>
            </Card>
          </div>
        )}

        <Divider />

        {/* 文章内容 */}
        <div style={{ marginBottom: '24px' }}>
          <Paragraph style={{ 
            fontSize: '16px', 
            lineHeight: '1.8',
            whiteSpace: 'pre-wrap'
          }}>
            {post.content}
          </Paragraph>
        </div>

        {/* 文章图片 */}
        {post.featured_image && (
          <div style={{ marginBottom: '24px', textAlign: 'center' }}>
            <img 
              src={post.featured_image} 
              alt={post.title}
              style={{ 
                maxWidth: '100%', 
                maxHeight: '500px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
            />
          </div>
        )}

        {/* 底部信息 */}
        <Divider />
        <div style={{ textAlign: 'center' }}>
          <Text type="secondary">
            创建于: {new Date(post.created_at).toLocaleString()}
            {post.updated_at !== post.created_at && (
              <> | 最后更新: {new Date(post.updated_at).toLocaleString()}</>
            )}
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default PostDetailView; 