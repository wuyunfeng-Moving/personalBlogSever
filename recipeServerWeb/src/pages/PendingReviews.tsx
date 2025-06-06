/**
 * 注意：此组件的功能已经被集成到 Home.tsx 组件中
 * 该文件仅作备用，应用中不再使用此独立组件
 * 待审核菜谱现在作为 Home 页面的一个选项卡展示
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, 
  Row, 
  Col, 
  Typography, 
  Tag, 
  Button,
  message,
  Tooltip,
  Space
} from 'antd';
import { 
  ClockCircleOutlined, 
  CheckOutlined, 
  CloseOutlined,
  UserOutlined,
  FileSearchOutlined
} from '@ant-design/icons';
import { Recipe } from '../services/api';
import { getCurrentUser, UserProfile } from '../services/authService';
import { getPendingRecipes, reviewRecipe } from '../services/adminService';
import PageContent from '../components/PageContent';

const { Text } = Typography;

const PendingReviews: React.FC = () => {
  const navigate = useNavigate();
  const [pendingRecipes, setPendingRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<(UserProfile & { access: string }) | null>(null);

  useEffect(() => {
    const loadUserProfile = async () => {
      const userProfile = await getCurrentUser();
      setUser(userProfile);
    };

    loadUserProfile();
  }, []);

  useEffect(() => {
    if (user) {
      fetchPendingRecipes();
    }
  }, [user]);

  const fetchPendingRecipes = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      console.log('PendingReviews - User info:', {
        username: user.username,
        is_admin: user.is_admin
      });
      const response = await getPendingRecipes();
      setPendingRecipes(response.results || []);
      
      if (response.count === 0) {
        console.log('没有待审核的菜谱');
      } else {
        console.log(`找到 ${response.count} 个待审核菜谱`);
      }
    } catch (error: any) {
      console.error('获取待审核菜谱失败:', error);
      setError(error.response?.data?.error || '获取失败，请重试');
      
      if (error.response?.status === 403) {
        message.error('您没有权限查看待审核菜谱');
        navigate('/');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRecipeClick = (id: number) => {
    navigate(`/recipes/${id}`);
  };

  const approveRecipe = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    try {
      const result = await reviewRecipe(id, 'approve');
      message.success('菜谱已通过审核');
      console.log('审核结果:', result);
      // 刷新列表
      fetchPendingRecipes();
    } catch (error: any) {
      console.error('审核菜谱失败:', error);
      message.error(error.response?.data?.error || '操作失败，请重试');
      
      if (error.response?.status === 403) {
        message.error('您没有权限进行此操作');
      }
    }
  };

  const rejectRecipe = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    try {
      const result = await reviewRecipe(id, 'reject');
      message.success('已拒绝该菜谱');
      console.log('拒绝结果:', result);
      // 刷新列表
      fetchPendingRecipes();
    } catch (error: any) {
      console.error('拒绝菜谱失败:', error);
      message.error(error.response?.data?.error || '操作失败，请重试');
      
      if (error.response?.status === 403) {
        message.error('您没有权限进行此操作');
      }
    }
  };

  return (
    <PageContent
      title="待审核菜谱"
      loading={loading}
      error={error}
      isEmpty={!pendingRecipes || pendingRecipes.length === 0}
      emptyText="暂无待审核菜谱"
      breadcrumbs={[
        { title: '待审核菜谱', icon: <FileSearchOutlined /> }
      ]}
    >
      <Row gutter={[16, 16]}>
        {pendingRecipes.map((recipe) => (
          <Col xs={24} sm={12} md={8} lg={6} key={recipe.id}>
            <Card
              title={recipe.title}
              hoverable
              onClick={() => handleRecipeClick(recipe.id)}
              cover={recipe.image && <img alt={recipe.title} src={recipe.image} />}
              style={{ cursor: 'pointer' }}
              actions={[
                <Tooltip title="通过审核">
                  <Button 
                    type="text" 
                    icon={<CheckOutlined style={{ color: 'green' }} />} 
                    onClick={(e) => approveRecipe(recipe.id, e)}
                  />
                </Tooltip>,
                <Tooltip title="拒绝">
                  <Button 
                    type="text" 
                    icon={<CloseOutlined style={{ color: 'red' }} />} 
                    onClick={(e) => rejectRecipe(recipe.id, e)}
                  />
                </Tooltip>
              ]}
            >
              <p>{recipe.description}</p>
              <p>
                <Space>
                  <UserOutlined />
                  <Text type="secondary">作者: {recipe.author.username}</Text>
                </Space>
              </p>
              <p>
                <Text type="secondary">准备时间: {recipe.prep_time_minutes} 分钟</Text>
              </p>
              <p>
                <Text type="secondary">烹饪时间: {recipe.cook_time_minutes} 分钟</Text>
              </p>
              <p>
                <Text type="secondary">份量: {recipe.servings || '未设置'} 人份</Text>
              </p>
              <Tag color="blue" icon={<ClockCircleOutlined />}>待审核</Tag>
            </Card>
          </Col>
        ))}
      </Row>
    </PageContent>
  );
};

export default PendingReviews; 