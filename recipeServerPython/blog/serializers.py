from rest_framework import serializers
from django.contrib.auth.models import User
from .models import BlogPost, Category, Tag, Comment

class AuthorSerializer(serializers.ModelSerializer):
    """作者序列化器"""
    display_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'display_name', 'email', 'first_name', 'last_name', 'date_joined']
    
    def get_display_name(self, obj):
        if obj.first_name and obj.last_name:
            return f"{obj.first_name} {obj.last_name}"
        return obj.username

class CategorySerializer(serializers.ModelSerializer):
    """分类序列化器"""
    post_count = serializers.ReadOnlyField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description', 'post_count']

class TagSerializer(serializers.ModelSerializer):
    """标签序列化器"""
    post_count = serializers.ReadOnlyField()
    
    class Meta:
        model = Tag
        fields = ['id', 'name', 'slug', 'post_count']

class CommentSerializer(serializers.ModelSerializer):
    """评论序列化器"""
    replies = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = ['id', 'author_name', 'author_email', 'author_url', 'content', 'created_at', 'is_approved', 'parent', 'replies']
        read_only_fields = ['id', 'created_at', 'is_approved']
    
    def get_replies(self, obj):
        if hasattr(obj, 'replies'):
            return CommentSerializer(obj.replies.filter(is_approved=True), many=True).data
        return []

class HistoricalBlogPostSerializer(serializers.ModelSerializer):
    history_user = AuthorSerializer(read_only=True)
    history_type_display = serializers.SerializerMethodField()

    class Meta:
        model = BlogPost.history.model
        fields = [
            'history_id',
            'history_date',
            'history_type',
            'history_type_display',
            'history_user',
            'id',
            'title',
            'content',
            'status'
        ]

    def get_history_type_display(self, obj):
        return obj.get_history_type_display()

class BlogPostSerializer(serializers.ModelSerializer):
    """博客文章序列化器"""
    author = AuthorSerializer(read_only=True)
    categories = CategorySerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    category_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    tag_names = serializers.ListField(
        child=serializers.CharField(max_length=50),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = BlogPost
        fields = [
            'id', 'title', 'slug', 'excerpt', 'content', 'featured_image',
            'author', 'categories', 'tags', 'category_ids', 'tag_names',
            'status', 'is_featured', 'allow_comments', 'view_count',
            'latitude', 'longitude', 'location_name',
            'created_at', 'updated_at', 'published_at',
            'meta_title', 'meta_description', 'meta_keywords'
        ]
        read_only_fields = ['id', 'slug', 'author', 'view_count', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # 提取分类和标签数据
        category_ids = validated_data.pop('category_ids', [])
        tag_names = validated_data.pop('tag_names', [])
        
        # 创建文章
        post = BlogPost.objects.create(**validated_data)
        
        # 设置分类
        if category_ids:
            categories = Category.objects.filter(id__in=category_ids)
            post.categories.set(categories)
        
        # 设置标签
        if tag_names:
            tags = []
            for tag_name in tag_names:
                tag, created = Tag.objects.get_or_create(name=tag_name.strip())
                tags.append(tag)
            post.tags.set(tags)
        
        return post
    
    def update(self, instance, validated_data):
        # 提取分类和标签数据
        category_ids = validated_data.pop('category_ids', None)
        tag_names = validated_data.pop('tag_names', None)
        
        # 更新文章基本信息
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # 更新分类
        if category_ids is not None:
            categories = Category.objects.filter(id__in=category_ids)
            instance.categories.set(categories)
        
        # 更新标签
        if tag_names is not None:
            tags = []
            for tag_name in tag_names:
                tag, created = Tag.objects.get_or_create(name=tag_name.strip())
                tags.append(tag)
            instance.tags.set(tags)
        
        return instance

class BlogPostListSerializer(serializers.ModelSerializer):
    """博客文章列表序列化器（简化版）"""
    author = AuthorSerializer(read_only=True)
    categories = CategorySerializer(many=True, read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    
    class Meta:
        model = BlogPost
        fields = [
            'id', 'title', 'slug', 'excerpt', 'featured_image',
            'author', 'categories', 'tags',
            'status', 'is_featured', 'view_count',
            'latitude', 'longitude', 'location_name',
            'created_at', 'updated_at', 'published_at'
        ] 