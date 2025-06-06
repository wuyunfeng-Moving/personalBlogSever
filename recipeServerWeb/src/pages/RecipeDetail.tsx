import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Typography, Spin, Alert, Tag, Button, Descriptions, Image, Row, Col, Divider } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { AppDispatch, RootState } from '../store';
import { fetchRecipeDetail } from '../store/recipesSlice';
import { Recipe } from '../services/api';

const { Title, Text } = Typography;

const RecipeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { currentRecipe, loading, error } = useSelector((state: RootState) => state.recipes);

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

  if (!currentRecipe) {
    return (
      <Alert
        message="提示"
        description="菜谱不存在"
        type="info"
        showIcon
      />
    );
  }

  return (
    <div style={{ padding: '24px' }}>
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={() => navigate(-1)}
        style={{ marginBottom: 16 }}
      >
        返回
      </Button>

      <Card>
        <Title level={2}>{currentRecipe.title}</Title>
        {currentRecipe.imageUrl || currentRecipe.image ? (
          <div style={{ marginBottom: 24 }}>
            <Image
              src={currentRecipe.imageUrl || currentRecipe.image}
              alt={currentRecipe.title}
              style={{ maxWidth: '100%', maxHeight: 400, objectFit: 'cover' }}
            />
          </div>
        ) : null}

        <Descriptions bordered column={2}>
          <Descriptions.Item label="作者">
            {currentRecipe.author?.username}
          </Descriptions.Item>
          <Descriptions.Item label="状态">
            <Tag color={currentRecipe.status === 'published' ? 'green' : currentRecipe.status === 'draft' ? 'orange' : 'blue'}>
              {currentRecipe.status === 'published' ? '已发布' : currentRecipe.status === 'draft' ? '草稿' : currentRecipe.status}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="描述" span={2}>
            {currentRecipe.description}
          </Descriptions.Item>
          <Descriptions.Item label="准备时间">
            {currentRecipe.prep_time_minutes} 分钟
          </Descriptions.Item>
          <Descriptions.Item label="烹饪时间">
            {currentRecipe.cook_time_minutes} 分钟
          </Descriptions.Item>
          <Descriptions.Item label="份量">
            {currentRecipe.servings || '未设置'} 人份
          </Descriptions.Item>
          <Descriptions.Item label="难度">
            {['', '简单', '适中', '困难'][Number(currentRecipe.difficulty)] || currentRecipe.difficulty}
          </Descriptions.Item>
          <Descriptions.Item label="适合人群">
            {['', '老人', '成人', '儿童', '婴幼儿'][Number(currentRecipe.suitable_person)] || currentRecipe.suitable_person}
          </Descriptions.Item>
          <Descriptions.Item label="温度">
            {currentRecipe.temperature_value ? `${currentRecipe.temperature_value}${currentRecipe.temperature_unit || ''}` : '—'}
          </Descriptions.Item>
          <Descriptions.Item label="锅具位置">
            {currentRecipe.comal_position || '—'}
          </Descriptions.Item>
          <Descriptions.Item label="标签">
            {(typeof currentRecipe.tags === 'string' ? currentRecipe.tags.split(',') : currentRecipe.tags || []).map((tag: string) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </Descriptions.Item>
          <Descriptions.Item label="工作模式">
            {(typeof currentRecipe.work_modes === 'string' ? currentRecipe.work_modes.split(',') : currentRecipe.work_modes || []).map((mode: string) => (
              <Tag key={mode}>{mode}</Tag>
            ))}
          </Descriptions.Item>
          <Descriptions.Item label="创建时间">
            {new Date(currentRecipe.created_at).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="更新时间">
            {new Date(currentRecipe.updated_at).toLocaleString()}
          </Descriptions.Item>
        </Descriptions>

        <Divider orientation="left">食材</Divider>
        <Row gutter={16}>
          <Col span={12}>
            <b>辅料：</b>
            <ul>
              {(currentRecipe.ingredients || []).map((item: any, idx: number) => (
                <li key={idx}>
                  {typeof item === 'string'
                    ? item
                    : item.name
                      ? `${item.name}${item.amount ? `: ${item.amount}` : ''}${item.unit ? item.unit : ''}`
                      : JSON.stringify(item)}
                </li>
              ))}
            </ul>
          </Col>
          <Col span={12}>
            <b>主料：</b>
            <ul>
              {(currentRecipe.staple_food || []).map((item: any, idx: number) => (
                <li key={idx}>
                  {typeof item === 'string'
                    ? item
                    : item.name
                      ? `${item.name}${item.amount ? `: ${item.amount}` : ''}${item.unit ? item.unit : ''}`
                      : JSON.stringify(item)}
                </li>
              ))}
            </ul>
          </Col>
        </Row>

        <Divider orientation="left">步骤</Divider>
        <ol>
          {(currentRecipe.steps || []).map((step: any, idx: number) => (
            <li key={idx} style={{ marginBottom: 16 }}>
              <div><b>步骤{step.stepNo || idx + 1}：</b> {step.stepDescription || step}</div>
              {step.imageUrl && (
                <div style={{ marginTop: 8 }}>
                  <Image src={step.imageUrl} alt={`步骤${step.stepNo || idx + 1}`} style={{ maxWidth: 200 }} />
                </div>
              )}
            </li>
          ))}
        </ol>

        {currentRecipe.cloud_commands && (
          <>
            <Divider orientation="left">云菜谱命令</Divider>
            <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4 }}>
              {JSON.stringify(currentRecipe.cloud_commands, null, 2)}
            </pre>
          </>
        )}
      </Card>
    </div>
  );
};

export default RecipeDetail; 