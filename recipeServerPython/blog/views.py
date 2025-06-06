from django.shortcuts import render
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from django.shortcuts import get_object_or_404
from django.db.models import Q
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes
from .models import BlogPost, Category, Tag, Comment
from .serializers import (
    BlogPostSerializer, BlogPostListSerializer, 
    CategorySerializer, TagSerializer, CommentSerializer,
    HistoricalBlogPostSerializer
)

# Create your views here.

class BlogPostViewSet(viewsets.ModelViewSet):
    """
    一个用于博客文章的视图集，提供 `list`, `create`, `retrieve`, `update`,
    `partial_update`, `destroy` 和 `history` 动作。
    """
    lookup_field = 'slug'

    def get_serializer_class(self):
        if self.action == 'list':
            return BlogPostListSerializer
        if self.action == 'history':
            return HistoricalBlogPostSerializer
        return BlogPostSerializer

    def get_queryset(self):
        queryset = BlogPost.objects.select_related('author').prefetch_related('categories', 'tags')
        
        # for list view, filter based on user
        if self.action == 'list':
            author_param = self.request.query_params.get('author')

            # 如果用户正在使用`author=me`参数请求自己的文章，则暂时不按状态过滤，
            # 以便他们可以看到自己的草稿。后续的作者过滤器会处理这个问题。
            if self.request.user.is_authenticated and author_param == 'me':
                pass
            
            # 如果用户是管理员并且没有按特定作者筛选，则他们可以看到所有文章。
            elif self.request.user.is_authenticated and self.request.user.is_staff and not author_param:
                pass
            
            # 对于所有其他情况（游客、普通登录用户浏览"全部文章"列表），只显示已发布的文章。
            else:
                queryset = queryset.filter(status='published')

        # filter by query params
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
            # allow 'me' for current user
            if author == 'me' and self.request.user.is_authenticated:
                queryset = queryset.filter(author=self.request.user)
            else:
                queryset = queryset.filter(author__username=author)

        return queryset.distinct().order_by('-published_at', '-created_at')

    def get_permissions(self):
        """根据操作设置权限"""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated()]
        return [permissions.AllowAny()]

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
                description='按分类slug筛选文章'
            ),
            OpenApiParameter(
                name='tag',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='按标签slug筛选文章'
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
                description='按作者用户名筛选文章，可使用"me"表示当前用户'
            ),
        ]
    )
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

    @extend_schema(
        tags=['文章'],
        operation_id='create_post',
        summary='创建文章',
        description='创建新的博客文章，需要登录认证'
    )
    def create(self, request, *args, **kwargs):
        return super().create(request, *args, **kwargs)

    @extend_schema(
        tags=['文章'],
        operation_id='retrieve_post',
        summary='获取文章详情',
        description='根据slug获取单篇文章的详细信息'
    )
    def retrieve(self, request, *args, **kwargs):
        return super().retrieve(request, *args, **kwargs)

    @extend_schema(
        tags=['文章'],
        operation_id='update_post',
        summary='更新文章',
        description='更新文章信息，只有作者和管理员可以操作'
    )
    def update(self, request, *args, **kwargs):
        return super().update(request, *args, **kwargs)

    @extend_schema(
        tags=['文章'],
        operation_id='partial_update_post',
        summary='部分更新文章',
        description='部分更新文章信息，只有作者和管理员可以操作'
    )
    def partial_update(self, request, *args, **kwargs):
        return super().partial_update(request, *args, **kwargs)

    @extend_schema(
        tags=['文章'],
        operation_id='delete_post',
        summary='删除文章',
        description='删除文章，只有作者和管理员可以操作'
    )
    def destroy(self, request, *args, **kwargs):
        return super().destroy(request, *args, **kwargs)

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def perform_update(self, serializer):
        obj = self.get_object()
        if obj.author != self.request.user and not self.request.user.is_staff:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("您只能编辑自己的文章。")
        serializer.save()

    def perform_destroy(self, instance):
        if instance.author != self.request.user and not self.request.user.is_staff:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("您只能删除自己的文章。")
        instance.delete()

    @extend_schema(
        tags=['文章'],
        operation_id='post_history',
        summary='获取文章历史记录',
        description='获取文章的编辑历史记录，只有作者和管理员可以查看'
    )
    @action(detail=True, methods=['get'], url_path='history', permission_classes=[permissions.IsAuthenticated])
    def history(self, request, slug=None):
        """
        获取一篇文章的历史版本记录。
        只有文章作者和管理员可以查看。
        """
        post = self.get_object()
        if post.author != request.user and not request.user.is_staff:
            return Response(
                {"detail": "您没有权限查看此文章的历史记录。"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        history = post.history.all()
        serializer = self.get_serializer(history, many=True)
        return Response(serializer.data)

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
