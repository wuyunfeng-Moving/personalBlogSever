from django.urls import path, include
from . import views
from . import auth_views

app_name = 'api'

urlpatterns = [
    # 认证相关路由
    # path('auth/register/', auth_views.RegisterView.as_view(), name='auth-register'),
    path('auth/token/', auth_views.LoginView.as_view(), name='auth-token'),
    path('auth/refresh/', auth_views.refresh_token_view, name='auth-refresh'),
    path('auth/profile/', auth_views.UserProfileView.as_view(), name='auth-profile'),
    
    # 博客相关路由
    path('', include('blog.urls', namespace='blog')),
] 