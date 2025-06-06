from django.shortcuts import render
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django.shortcuts import get_object_or_404
from django.db.models import Q
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes
from .models import BlogPost, Category, Tag, Comment
from .serializers import (
    BlogPostSerializer, BlogPostListSerializer, 
    CategorySerializer, TagSerializer, CommentSerializer
)

# Create your views here.

@extend_schema(
    tags=['文章'],
    operation_id='list_posts',
    summary='获取文章列表',
    description='获取博客文章列表，支持分页、筛选和搜索功能',
    parameters=[
        OpenApiParameter(
            name='category',
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description='按分类slug筛选文章',
            examples=[
                OpenApiExample('技术文章', value='tech'),
                OpenApiExample('生活文章', value='life'),
            ]
        ),
        OpenApiParameter(
            name='tag',
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description='按标签slug筛选文章',
            examples=[
                OpenApiExample('Python', value='python'),
                OpenApiExample('Django', value='django'),
            ]
        ),
        OpenApiParameter(
            name='search',
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description='在文章标题、内容和摘要中搜索关键词'
        ),
        OpenApiParameter(
            name='author',
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description='按作者用户名筛选文章'
        ),
        OpenApiParameter(
            name='page',
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY,
            description='页码，默认为1'
        ),
        OpenApiParameter(
            name='page_size',
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY,
            description='每页数量，默认为10'
        ),
    ]
)
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
    
    @extend_schema(
        tags=['文章'],
        operation_id='create_post',
        summary='创建文章',
        description='创建新的博客文章，需要登录认证',
        examples=[
            OpenApiExample(
                name='创建文章示例',
                value={
                    "title": "我的新文章",
                    "content": "这是文章的内容...",
                    "excerpt": "这是文章的摘要",
                    "status": "published",
                    "category_ids": [1, 2],
                    "tag_names": ["Python", "Django"],
                    "is_featured": False,
                    "allow_comments": True
                }
            )
        ]
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)
    
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

@extend_schema(tags=['文章'], operation_id='post_detail')
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

@extend_schema(
    tags=['分类'],
    operation_id='list_categories',
    summary='获取分类列表',
    description='获取所有文章分类，包含每个分类的文章数量'
)
class CategoryListView(generics.ListCreateAPIView):
    """分类列表和创建"""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

@extend_schema(
    tags=['标签'],
    operation_id='list_tags',
    summary='获取标签列表',
    description='获取所有文章标签，包含每个标签的使用次数'
)
class TagListView(generics.ListCreateAPIView):
    """标签列表和创建"""
    queryset = Tag.objects.all()
    serializer_class = TagSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

@extend_schema(
    tags=['文章'],
    operation_id='featured_posts',
    summary='获取推荐文章',
    description='获取标记为推荐的文章列表',
    parameters=[
        OpenApiParameter(
            name='limit',
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY,
            description='返回的文章数量限制，默认为5',
            default=5
        ),
    ]
)
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

@extend_schema(
    tags=['文章'],
    operation_id='popular_posts',
    summary='获取热门文章',
    description='获取按浏览量排序的热门文章列表',
    parameters=[
        OpenApiParameter(
            name='limit',
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY,
            description='返回的文章数量限制，默认为10',
            default=10
        ),
    ]
)
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

@extend_schema(
    tags=['文章'],
    operation_id='search_posts',
    summary='搜索文章',
    description='在文章标题、内容和摘要中进行全文搜索',
    parameters=[
        OpenApiParameter(
            name='q',
            type=OpenApiTypes.STR,
            location=OpenApiParameter.QUERY,
            description='搜索关键词',
            required=True,
            examples=[
                OpenApiExample('搜索Python', value='Python'),
                OpenApiExample('搜索Django', value='Django'),
            ]
        ),
        OpenApiParameter(
            name='page',
            type=OpenApiTypes.INT,
            location=OpenApiParameter.QUERY,
            description='页码，默认为1'
        ),
    ],
    responses=BlogPostListSerializer(many=True)
)
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
