from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BlogPostViewSet,
    MyPostsView,
    CategoryListView,
    TagListView,
    FeaturedPostsView,
    PopularPostsView,
    search_posts
)

app_name = 'blog'

router = DefaultRouter()
router.register(r'posts', BlogPostViewSet, basename='post')

urlpatterns = [
    path('', include(router.urls)),
    path('posts/my/', MyPostsView.as_view(), name='my-posts'),
    path('categories/', CategoryListView.as_view(), name='category-list'),
    path('tags/', TagListView.as_view(), name='tag-list'),
    path('posts/featured/', FeaturedPostsView.as_view(), name='featured-posts'),
    path('posts/popular/', PopularPostsView.as_view(), name='popular-posts'),
    path('search/', search_posts, name='search-posts'),
] 