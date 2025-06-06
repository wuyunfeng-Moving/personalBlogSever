import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout, Spin, message } from 'antd';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateRecipe from './pages/CreateRecipe';
import { getCurrentUser, UserProfile } from './services/authService';
import RecipeDetail from './pages/RecipeDetail';
import PendingReviews from './pages/PendingReviews';

const { Header, Content } = Layout;

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<(UserProfile & { access: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const checkUser = async () => {
      const userProfile = await getCurrentUser();
      setUser(userProfile);
      setLoading(false);
    };
    
    checkUser();
  }, []);
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }
  
  return !user ? <>{children}</> : <Navigate to="/" replace />;
};

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<(UserProfile & { access: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const checkUser = async () => {
      const userProfile = await getCurrentUser();
      setUser(userProfile);
      setLoading(false);
    };
    
    checkUser();
  }, []);
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }
  
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

// 管理员路由守卫
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<(UserProfile & { access: string }) | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const checkUser = async () => {
      const userProfile = await getCurrentUser();
      setUser(userProfile);
      setLoading(false);
    };
    
    checkUser();
  }, []);
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }
  
  if (!user) {
    message.error('请先登录');
    return <Navigate to="/login" replace />;
  }
  
  if (!user.is_admin) {
    message.error('您没有管理员权限');
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Router>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h1 style={{ margin: 0 }}>菜谱管理系统</h1>
        </Header>
        <Content>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <Register />
                </PublicRoute>
              }
            />
            <Route path="/" element={<Home />} />
            <Route path="/recipes/:id" element={<RecipeDetail />} />
            <Route 
              path="/create-recipe" 
              element={
                <PrivateRoute>
                  <CreateRecipe />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/edit-recipe/:id" 
              element={
                <PrivateRoute>
                  <CreateRecipe />
                </PrivateRoute>
              } 
            />
            <Route 
              path="/pending-reviews" 
              element={
                <AdminRoute>
                  <PendingReviews />
                </AdminRoute>
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Content>
      </Layout>
    </Router>
  );
};

export default App;
