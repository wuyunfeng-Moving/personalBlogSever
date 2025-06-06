import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Typography, Spin, Alert, Tag, Button, Descriptions, Image, Divider } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { AppDispatch, RootState } from '../store';
import { fetchRecipeDetail } from '../store/recipesSlice';

const { Title, Text, Paragraph } = Typography;

const PostDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { currentRecipe: currentPost, loading, error } = useSelector((state: RootState) => state.recipes);

  useEffect(() => {
    if (id) {
      dispatch(fetchRecipeDetail(parseInt(id)));
    }
  }, [dispatch, id]);

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

  const categoryLabels: Record<string, string> = {
    tech: '技术',
    life: '生活',
    travel: '旅行',
    thoughts: '随笔',
    tutorials: '教程'
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
        
        {currentPost.imageUrl || currentPost.image ? (
          <div style={{ marginBottom: 24 }}>
            <Image
              src={currentPost.imageUrl || currentPost.image}
              alt={currentPost.title}
              style={{ maxWidth: '100%', maxHeight: 400, objectFit: 'cover' }}
            />
          </div>
        ) : null}

        <Descriptions bordered column={1} style={{ marginBottom: 24 }}>
          <Descriptions.Item label="作者">
            {currentPost.author?.username}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={currentPost.status === 'published' ? 'green' : currentPost.status === 'draft' ? 'orange' : 'blue'}>
              {currentPost.status === 'published' ? '已发布' : currentPost.status === 'draft' ? '草稿' : currentPost.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="分类">
            <Tag color="blue">
              {categoryLabels[currentPost.difficulty] || currentPost.difficulty}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="标签">
            {(typeof currentPost.tags === 'string' ? currentPost.tags.split(',') : currentPost.tags || []).map((tag: string) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {new Date(currentPost.created_at).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {new Date(currentPost.updated_at).toLocaleString()}
          </Descriptions.Item>
        </Descriptions>

        <Divider orientation="left">文章摘要</Divider>
        <Paragraph style={{ fontSize: 16, lineHeight: 1.6, color: '#666' }}>
          {currentPost.description}
        </Paragraph>

        <Divider orientation="left">文章内容</Divider>
        <div style={{ fontSize: 16, lineHeight: 1.8, minHeight: 200 }}>
          {/* 这里假设content字段存储文章内容，如果没有则显示steps内容 */}
          {(currentPost as any).content ? (
            <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
              {(currentPost as any).content}
            </Paragraph>
          ) : (
            <div>
              {(currentPost.steps || []).map((step: any, idx: number) => (
                <Paragraph key={idx} style={{ marginBottom: 16 }}>
                  {step.stepDescription || step}
                </Paragraph>
              ))}
              {(!currentPost.steps || currentPost.steps.length === 0) && (
                <Paragraph style={{ whiteSpace: 'pre-wrap' }}>
                  {currentPost.description}
                </Paragraph>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default PostDetail; 