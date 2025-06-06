from django.urls import path
from . import views

app_name = 'web'

urlpatterns = [
    path('', views.home, name='home'),
    path('recipes/', views.recipe_list, name='recipe_list'),
    path('recipe/<int:recipe_id>/', views.recipe_detail, name='recipe_detail'),
    path('login/', views.user_login, name='login'),
    path('logout/', views.user_logout, name='logout'),
    path('register/', views.user_register, name='register'),
    path('profile/', views.user_profile, name='profile'),
    
    # 提交内容
    path('submit/recipe/', views.submit_recipe, name='submit_recipe'),
    path('submit/device/', views.submit_device, name='submit_device'),
    
    # 管理员审核
    path('review/', views.review_submissions, name='review_submissions'),
    path('review/recipe/<int:pk>/', views.review_recipe, name='review_recipe'),
    path('review/device/<int:pk>/', views.review_device, name='review_device'),
    
    # 设备管理
    path('devices/', views.device_list, name='device_list'),
    path('devices/add/', views.add_device, name='add_device'),
    path('devices/edit/<int:pk>/', views.edit_device, name='edit_device'),
    path('devices/delete/<int:pk>/', views.delete_device, name='delete_device'),
    path('devices/<int:pk>/', views.device_detail, name='device_detail'),
    
    # 添加/编辑设备命令（通过引导界面）
    path('recipe/<int:recipe_id>/device/<int:device_id>/add_command/', views.add_edit_device_command_guide, name='add_device_command_guide'),
    path('recipe/<int:recipe_id>/device/<int:device_id>/edit_command/', views.add_edit_device_command_guide, name='edit_device_command_guide'), # Edit also points to the same view
    
    # 日志查看
    path('system/logs/', views.view_logs, name='view_logs'),
] 