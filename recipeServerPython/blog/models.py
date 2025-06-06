from django.db import models
from django.contrib.auth.models import User
from django.utils.text import slugify
from django.urls import reverse
import uuid
from simple_history.models import HistoricalRecords

class Category(models.Model):
    """博客分类模型"""
    name = models.CharField('分类名称', max_length=100, unique=True)
    slug = models.SlugField('URL别名', max_length=100, unique=True, blank=True)
    description = models.TextField('分类描述', blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    
    class Meta:
        verbose_name = '分类'
        verbose_name_plural = '分类'
        ordering = ['name']
    
    def save(self, *args, **kwargs):
        if not self.slug:
            # 对中文名称进行特殊处理
            if self.name:
                # 为中文分类创建英文slug
                name_map = {
                    '技术': 'tech',
                    '生活': 'life', 
                    '旅行': 'travel',
                    '随笔': 'thoughts',
                    '教程': 'tutorials'
                }
                self.slug = name_map.get(self.name, slugify(self.name) or f'category-{self.pk or "new"}')
            else:
                self.slug = f'category-{self.pk or "new"}'
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name
    
    @property
    def post_count(self):
        return self.posts.filter(status='published').count()

class Tag(models.Model):
    """博客标签模型"""
    name = models.CharField('标签名称', max_length=50, unique=True)
    slug = models.SlugField('URL别名', max_length=50, unique=True, blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    
    class Meta:
        verbose_name = '标签'
        verbose_name_plural = '标签'
        ordering = ['name']
    
    def save(self, *args, **kwargs):
        if not self.slug:
            # 对中文标签进行特殊处理
            if self.name:
                tag_map = {
                    '前端': 'frontend',
                    '后端': 'backend', 
                    '数据库': 'database',
                    '算法': 'algorithm',
                    '设计模式': 'design-pattern',
                    '生活感悟': 'life-thoughts',
                    '读书笔记': 'reading-notes',
                    '电影': 'movie',
                    '音乐': 'music',
                    '摄影': 'photography',
                    '美食': 'food'
                }
                self.slug = tag_map.get(self.name, slugify(self.name) or f'tag-{self.pk or "new"}')
            else:
                self.slug = f'tag-{self.pk or "new"}'
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name
    
    @property
    def post_count(self):
        return self.posts.filter(status='published').count()

class BlogPost(models.Model):
    """博客文章模型"""
    STATUS_CHOICES = [
        ('draft', '草稿'),
        ('pending', '待审核'),
        ('published', '已发布'),
        ('rejected', '已拒绝'),
    ]
    
    title = models.CharField('标题', max_length=200)
    slug = models.SlugField('URL别名', max_length=200, unique=True, blank=True)
    excerpt = models.TextField('摘要', max_length=500, blank=True)
    content = models.TextField('内容')
    featured_image = models.ImageField('特色图片', upload_to='blog/images/', blank=True, null=True)
    
    author = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name='作者', related_name='blog_posts')
    categories = models.ManyToManyField(Category, verbose_name='分类', related_name='posts', blank=True)
    tags = models.ManyToManyField(Tag, verbose_name='标签', related_name='posts', blank=True)
    
    status = models.CharField('状态', max_length=20, choices=STATUS_CHOICES, default='draft')
    is_featured = models.BooleanField('推荐文章', default=False)
    allow_comments = models.BooleanField('允许评论', default=True)
    
    view_count = models.PositiveIntegerField('浏览次数', default=0)
    
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    published_at = models.DateTimeField('发布时间', blank=True, null=True)
    
    # SEO相关字段
    meta_title = models.CharField('SEO标题', max_length=60, blank=True)
    meta_description = models.CharField('SEO描述', max_length=160, blank=True)
    meta_keywords = models.CharField('SEO关键词', max_length=100, blank=True)
    
    # 地理位置相关字段
    latitude = models.FloatField(blank=True, null=True, verbose_name='纬度')
    longitude = models.FloatField(blank=True, null=True, verbose_name='经度')
    location_name = models.CharField(max_length=255, blank=True, null=True, verbose_name='位置名称')
    
    history = HistoricalRecords()

    class Meta:
        verbose_name = '博客文章'
        verbose_name_plural = '博客文章'
        ordering = ['-created_at']
    
    def save(self, *args, **kwargs):
        if not self.slug:
            # 生成唯一的slug
            base_slug = slugify(self.title)
            if not base_slug:
                base_slug = str(uuid.uuid4())[:8]
            
            slug = base_slug
            counter = 1
            while BlogPost.objects.filter(slug=slug).exclude(pk=self.pk).exists():
                slug = f"{base_slug}-{counter}"
                counter += 1
            self.slug = slug
        
        # 如果状态改为已发布且还没有发布时间，设置发布时间
        if self.status == 'published' and not self.published_at:
            from django.utils import timezone
            self.published_at = timezone.now()
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.title
    
    def get_absolute_url(self):
        return reverse('blog:post_detail', kwargs={'slug': self.slug})

class Comment(models.Model):
    """评论模型"""
    post = models.ForeignKey(BlogPost, on_delete=models.CASCADE, verbose_name='文章', related_name='comments')
    author_name = models.CharField('作者姓名', max_length=100)
    author_email = models.EmailField('作者邮箱')
    author_url = models.URLField('作者网站', blank=True)
    content = models.TextField('评论内容')
    
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    is_approved = models.BooleanField('已审核', default=False)
    
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, verbose_name='父评论', related_name='replies')
    
    class Meta:
        verbose_name = '评论'
        verbose_name_plural = '评论'
        ordering = ['created_at']
    
    def __str__(self):
        return f'{self.author_name} 对 {self.post.title} 的评论'
