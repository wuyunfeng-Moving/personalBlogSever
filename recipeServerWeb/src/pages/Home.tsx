import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, Row, Col, Typography, Spin, Alert, Tag, Empty, Menu, Select, Space, Button, Tooltip, message } from 'antd';
import { PlusOutlined, EditOutlined, CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, FileOutlined, FileTextOutlined, AppstoreOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { AppDispatch, RootState } from '../store';
import { fetchRecipes } from '../store/recipesSlice';
import { fetchDeviceModels } from '../store/deviceTypesSlice';
import { logout, getCurrentUser, UserProfile } from '../services/authService';
import { getPendingRecipes, reviewRecipe } from '../services/adminService';
import { getMyRecipes } from '../services/recipeService';
import { RecipeListResponse } from '../services/api';  

const { Title, Text } = Typography;
const { Option } = Select;

type MenuKey = 'recipes' | 'devices' | 'my-recipes' | 'pending-reviews';

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

  const [selectedKey, setSelectedKey] = useState<MenuKey>('recipes');
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [user, setUser] = useState<(UserProfile & { access: string }) | null>(null);
  const [myRecipes, setMyRecipes] = useState<any[]>([]);
  const [myRecipesLoading, setMyRecipesLoading] = useState(false);
  const [myRecipesError, setMyRecipesError] = useState<string | null>(null);
  const [pendingRecipes, setPendingRecipes] = useState<any[]>([]);
  const [pendingRecipesLoading, setPendingRecipesLoading] = useState(false);
  const [pendingRecipesError, setPendingRecipesError] = useState<string | null>(null);

  // 获取用户信息
  useEffect(() => {
    const loadUserProfile = async () => {
      const userProfile = await getCurrentUser();
      setUser(userProfile);
    };

    loadUserProfile();
  }, []);

  useEffect(() => {
    dispatch(fetchRecipes(selectedDevice));
    dispatch(fetchDeviceModels());
  }, [dispatch, selectedDevice]);

  useEffect(() => {
    if (selectedKey === 'my-recipes' && user) {
      fetchMyRecipes();
    } else if (selectedKey === 'pending-reviews' && user && user.is_admin) {
      fetchPendingRecipes();
    }
  }, [selectedKey, user]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'my-recipes' && user) {
      setSelectedKey('my-recipes');
    } else if (tab === 'pending-reviews' && user && user.is_admin) {
      setSelectedKey('pending-reviews');
    } else if (tab === 'devices') {
      setSelectedKey('devices');
    }
  }, [location.search, user]);

  const fetchMyRecipes = async () => {
    if (!user) return;
    
    setMyRecipesLoading(true);
    setMyRecipesError(null);
    
    try {
      const response: RecipeListResponse = await getMyRecipes();
      
      setMyRecipes(response.results || []);
    } catch (error: any) {
      console.error('获取我的菜谱失败:', error);
      setMyRecipesError(error.response?.data?.error || '获取失败，请重试');
    } finally {
      setMyRecipesLoading(false);
    }
  };

  const fetchPendingRecipes = async () => {
    if (!user || !user.is_admin) return;
    
    setPendingRecipesLoading(true);
    setPendingRecipesError(null);
    
    try {
      const response = await getPendingRecipes();
      setPendingRecipes(response.results || []);
      
      if (response.count === 0) {
        console.log('没有待审核的菜谱');
      } else {
        console.log(`找到 ${response.count} 个待审核菜谱`);
      }
    } catch (error: any) {
      console.error('获取待审核菜谱失败:', error);
      setPendingRecipesError(error.response?.data?.error || '获取失败，请重试');
      
      if (error.response?.status === 403) {
        message.error('您没有权限查看待审核菜谱');
        setSelectedKey('recipes');
      }
    } finally {
      setPendingRecipesLoading(false);
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

  const handleDeviceChange = (value: string) => {
    setSelectedDevice(value);
  };

  const handleCreateRecipe = () => {
    navigate('/create-recipe');
  };
  
  const handleEditRecipe = (id: number) => {
    navigate(`/edit-recipe/${id}`);
  };

  const handleRecipeClick = (id: number, isMyRecipe = false) => {
    console.log('isMyRecipe', isMyRecipe);
    if (isMyRecipe) {
      navigate(`/edit-recipe/${id}`);
    } else {
      navigate(`/recipes/${id}`);
    }
  };

  const handleDeviceClick = (deviceModel: any) => {
    setSelectedDevice(deviceModel.model_identifier);
    setSelectedKey('recipes');
    message.info(`已筛选 ${deviceModel.name} 的菜谱`);
  };

  const renderCommandTemplate = (template: any) => {
    if (!template) return '无命令模板';
    try {
      return JSON.stringify(template, null, 2);
    } catch (error) {
      return '命令模板格式错误';
    }
  };

  const renderRecipeStatus = (status: string) => {
    return (
      <Tooltip title={statusText[status] || status}>
        <Tag color={statusColors[status] || 'default'} icon={statusIcons[status]}>
          {statusText[status] || status}
        </Tag>
      </Tooltip>
    );
  };

  const renderRecipeList = (
    recipeItems = recipes.items, 
    loading = recipes.loading, 
    error = recipes.error, 
    isMyRecipes = false,
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

    if (!recipeItems || recipeItems.length === 0) {
      return <Empty description={isPendingReviews ? "暂无待审核菜谱" : "暂无菜谱"} />;
    }

    return (
      <Row gutter={[16, 16]}>
        {recipeItems.map((recipe) => (
          <Col xs={24} sm={12} md={8} lg={6} key={recipe.id}>
            <Card
              title={recipe.title}
              hoverable
              onClick={() => handleRecipeClick(recipe.id, isMyRecipes)}
              cover={recipe.image && <img alt={recipe.title} src={recipe.image} />}
              style={{ cursor: 'pointer' }}
              actions={isPendingReviews ? [
                <Tooltip title="通过审核">
                  <Button 
                    type="text" 
                    icon={<CheckOutlined style={{ color: 'green' }} />} 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReviewRecipe(recipe.id, 'approve');
                    }}
                  />
                </Tooltip>,
                <Tooltip title="拒绝">
                  <Button 
                    type="text" 
                    icon={<CloseOutlined style={{ color: 'red' }} />} 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReviewRecipe(recipe.id, 'reject');
                    }}
                  />
                </Tooltip>
              ] : isMyRecipes ? [
                <Button 
                  type="link" 
                  icon={<EditOutlined />} 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditRecipe(recipe.id);
                  }}
                >
                  编辑
                </Button>
              ] : []}
            >
              <p>{recipe.description}</p>
              <p>
                <Text type="secondary">作者: {recipe.author.username}</Text>
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
              {renderRecipeStatus(recipe.status)}
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
              onClick={() => handleDeviceClick(deviceModel)}
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
      case 'devices':
        return renderDeviceList();
      case 'my-recipes':
        return renderRecipeList(myRecipes, myRecipesLoading, myRecipesError, true);
      case 'pending-reviews':
        return renderRecipeList(pendingRecipes, pendingRecipesLoading, pendingRecipesError, false, true);
      default:
        return renderRecipeList();
    }
  };

  const handleReviewRecipe = async (id: number, action: 'approve' | 'reject') => {
    if (!user) return;
    
    try {
      const result = await reviewRecipe(id, action);
      message.success(action === 'approve' ? '菜谱已通过审核' : '已拒绝该菜谱');
      console.log('审核结果:', result);
      // 刷新列表
      fetchPendingRecipes();
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
                    onClick={handleCreateRecipe}
                    block
                  >
                    创建菜谱
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
                  key: 'recipes',
                  icon: <FileOutlined />,
                  label: '全部菜谱',
                  onClick: () => handleMenuClick('recipes')
                },
                user ? {
                  key: 'my-recipes',
                  icon: <FileTextOutlined />,
                  label: '我的菜谱',
                  onClick: () => handleMenuClick('my-recipes')
                } : null,
                user && user.is_admin ? {
                  key: 'pending-reviews',
                  icon: <ClockCircleOutlined />,
                  label: '待审核菜谱',
                  onClick: () => handleMenuClick('pending-reviews')
                } : null,
                {
                  key: 'devices',
                  icon: <AppstoreOutlined />,
                  label: '设备型号',
                  onClick: () => handleMenuClick('devices')
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
                    {selectedKey === 'recipes' && '全部菜谱'}
                    {selectedKey === 'my-recipes' && '我的菜谱'}
                    {selectedKey === 'devices' && '设备型号'}
                    {selectedKey === 'pending-reviews' && '待审核菜谱'}
                  </Title>
                </Col>
                <Col>
                  {selectedKey === 'recipes' && (
                    <Select
                      placeholder="按设备筛选"
                      style={{ width: 200 }}
                      allowClear
                      onChange={handleDeviceChange}
                      value={selectedDevice || undefined}
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