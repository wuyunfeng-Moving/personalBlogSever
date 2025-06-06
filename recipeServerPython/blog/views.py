from django.shortcuts import render
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .models import BlogPost, Category, Tag, Comment
from .serializers import (
    BlogPostSerializer, BlogPostListSerializer, 
    CategorySerializer, TagSerializer, CommentSerializer
)

# Create your views here.

class BlogPostListCreateView(generics.ListCreateAPIView):
    """博客文章列表和创建"""
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_serializer_class(self):
        if self.request.method == 'GET':
            return BlogPostListSerializer
        return BlogPostSerializer
    
    def get_queryset(self):
        queryset = BlogPost.objects.select_related('author').prefetch_related('categories', 'tags')
        
        # 根据用户权限过滤
        if self.request.user.is_authenticated and self.request.user.is_staff:
            # 管理员可以看到所有文章
            pass
        elif self.request.user.is_authenticated:
            # 普通用户只能看到已发布的文章和自己的文章
            queryset = queryset.filter(
                Q(status='published') | Q(author=self.request.user)
            )
        else:
            # 未登录用户只能看到已发布的文章
            queryset = queryset.filter(status='published')
        
        # 按参数过滤
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(categories__slug=category)
        
        tag = self.request.query_params.get('tag')
        if tag:
            queryset = queryset.filter(tags__slug=tag)
        
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) | 
                Q(content__icontains=search) |
                Q(excerpt__icontains=search)
            )
        
        author = self.request.query_params.get('author')
        if author:
            queryset = queryset.filter(author__username=author)
        
        return queryset.distinct()
    
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class BlogPostDetailView(generics.RetrieveUpdateDestroyAPIView):
    """博客文章详情、更新和删除"""
    serializer_class = BlogPostSerializer
    lookup_field = 'slug'
    
    def get_queryset(self):
        queryset = BlogPost.objects.select_related('author').prefetch_related('categories', 'tags')
        
        # 根据用户权限过滤
        if self.request.user.is_authenticated and self.request.user.is_staff:
            # 管理员可以看到所有文章
            return queryset
        elif self.request.user.is_authenticated:
            # 普通用户只能看到已发布的文章和自己的文章
            return queryset.filter(
                Q(status='published') | Q(author=self.request.user)
            )
        else:
            # 未登录用户只能看到已发布的文章
            return queryset.filter(status='published')
    
    def get_permissions(self):
        """根据操作设置权限"""
        if self.request.method in ['PUT', 'PATCH', 'DELETE']:
            # 只有作者或管理员可以编辑/删除
            return [IsAuthenticated()]
        return [permissions.AllowAny()]
    
    def perform_update(self, serializer):
        """只允许作者或管理员更新文章"""
        obj = self.get_object()
        if obj.author != self.request.user and not self.request.user.is_staff:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("您只能编辑自己的文章")
        serializer.save()
    
    def perform_destroy(self, instance):
        """只允许作者或管理员删除文章"""
        if instance.author != self.request.user and not self.request.user.is_staff:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("您只能删除自己的文章")
        instance.delete()

class MyPostsView(generics.ListAPIView):
    """我的文章列表"""
    serializer_class = BlogPostListSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return BlogPost.objects.filter(author=self.request.user).select_related('author').prefetch_related('categories', 'tags')

class CategoryListView(generics.ListCreateAPIView):
    """分类列表和创建"""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

class TagListView(generics.ListCreateAPIView):
    """标签列表和创建"""
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

class FeaturedPostsView(generics.ListAPIView):
    """推荐文章列表"""
    serializer_class = BlogPostListSerializer
    
    def get_queryset(self):
        limit = self.request.query_params.get('limit', 5)
        try:
            limit = int(limit)
        except (ValueError, TypeError):
            limit = 5
        
        return BlogPost.objects.filter(
            status='published', 
            is_featured=True
        ).select_related('author').prefetch_related('categories', 'tags')[:limit]

class PopularPostsView(generics.ListAPIView):
    """热门文章列表"""
    serializer_class = BlogPostListSerializer
    
    def get_queryset(self):
        limit = self.request.query_params.get('limit', 10)
        try:
            limit = int(limit)
        except (ValueError, TypeError):
            limit = 10
        
        return BlogPost.objects.filter(
            status='published'
        ).select_related('author').prefetch_related('categories', 'tags').order_by('-view_count')[:limit]

@api_view(['GET'])
def search_posts(request):
    """搜索文章"""
    query = request.query_params.get('q', '')
    if not query:
        return Response({'results': [], 'count': 0})
    
    posts = BlogPost.objects.filter(
        Q(title__icontains=query) | 
        Q(content__icontains=query) |
        Q(excerpt__icontains=query),
        status='published'
    ).select_related('author').prefetch_related('categories', 'tags')
    
    # 分页
    from rest_framework.pagination import PageNumberPagination
    paginator = PageNumberPagination()
    paginator.page_size = 10
    page = paginator.paginate_queryset(posts, request)
    
    serializer = BlogPostListSerializer(page, many=True)
    return paginator.get_paginated_response(serializer.data)
