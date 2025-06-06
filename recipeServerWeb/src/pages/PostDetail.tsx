import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Typography, Spin, Alert, Tag, Button, Descriptions, Image, Divider } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { AppDispatch, RootState } from '../store';
import { fetchPostDetail } from '../store/postsSlice';

const { Title, Text, Paragraph } = Typography;

const PostDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { currentPost, loading, error } = useSelector((state: RootState) => state.recipes);

  useEffect(() => {
    if (slug) {
      dispatch(fetchPostDetail(slug));
    }
  }, [dispatch, slug]);

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

  if (!currentPost) {
    return (
      <Alert
        message="提示"
        description="文章不存在"
        type="info"
        showIcon
      />
    );
  }

  const statusLabels: Record<string, string> = {
    draft: '草稿',
    pending: '待审核', 
    published: '已发布',
    rejected: '已拒绝'
  };

  const statusColors: Record<string, string> = {
    draft: 'orange',
    pending: 'blue',
    published: 'green', 
    rejected: 'red'
  };

  return (
    <div style={{ padding: '24px', maxWidth: 800, margin: '0 auto' }}>
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate(-1)}
        style={{ marginBottom: 16 }}
      >
        返回
      </Button>

      <Card>
        <Title level={2}>{currentPost.title}</Title>
        
        {currentPost.featured_image && (
          <div style={{ marginBottom: 24 }}>
            <Image
              src={currentPost.featured_image}
              alt={currentPost.title}
              style={{ maxWidth: '100%', maxHeight: 400, objectFit: 'cover' }}
            />
          </div>
        )}

        <Descriptions bordered column={1} style={{ marginBottom: 24 }}>
          <Descriptions.Item label="作者">
            {currentPost.author?.username || currentPost.author?.display_name}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={statusColors[currentPost.status] || 'default'}>
              {statusLabels[currentPost.status] || currentPost.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="分类">
            {currentPost.categories?.map(category => (
              <Tag key={category.id} color="blue">
                {category.name}
              </Tag>
            )) || '暂无分类'}
          </Descriptions.Item>
          <Descriptions.Item label="标签">
            {currentPost.tags?.map(tag => (
              <Tag key={tag.id} color="purple">
                {tag.name}
              </Tag>
            )) || '暂无标签'}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {new Date(currentPost.created_at).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {new Date(currentPost.updated_at).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="浏览量">
            {currentPost.view_count || 0}
          </Descriptions.Item>
        </Descriptions>

        {currentPost.excerpt && (
          <>
            <Divider orientation="left">文章摘要</Divider>
            <Paragraph style={{ fontSize: 16, lineHeight: 1.6, color: '#666' }}>
              {currentPost.excerpt}
            </Paragraph>
          </>
        )}

        <Divider orientation="left">文章内容</Divider>
        <div style={{ fontSize: 16, lineHeight: 1.8, minHeight: 200 }}>
          {currentPost.content ? (
            <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
              {currentPost.content}
            </Paragraph>
          ) : (
            <Paragraph style={{ color: '#999' }}>
              暂无内容
            </Paragraph>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PostDetail; 