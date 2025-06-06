from django.urls import path
from . import views

app_name = 'blog'

urlpatterns = [
    # 博客文章相关
    path('posts/', views.BlogPostListCreateView.as_view(), name='post-list'),
    path('posts/<slug:slug>/', views.BlogPostDetailView.as_view(), name='post-detail'),
    path('my-posts/', views.MyPostsView.as_view(), name='my-posts'),
    
    # 分类和标签
    path('categories/', views.CategoryListView.as_view(), name='category-list'),
    path('tags/', views.TagListView.as_view(), name='tag-list'),
    
    # 特殊列表
    path('featured/', views.FeaturedPostsView.as_view(), name='featured-posts'),
    path('popular/', views.PopularPostsView.as_view(), name='popular-posts'),
    
    # 搜索
    path('search/', views.search_posts, name='search'),
] 