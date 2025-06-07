#!/usr/bin/env python3
"""
为博客文章添加地理位置数据的脚本
用于演示地图标签功能
"""

import os
import sys
import django

# 添加项目路径
sys.path.append(os.path.join(os.path.dirname(__file__), 'recipeServerPython'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'recipe_server.settings')
django.setup()

from blog.models import BlogPost, Tag, Category
from django.contrib.auth.models import User

def add_location_data():
    """为示例文章添加地理位置和标签数据"""
    
    print("🗺️  开始为文章添加地理位置数据...")
    
    # 示例地理位置数据
    locations = [
        {
            'title': '北京游记',
            'location_name': '北京天安门广场',
            'latitude': 39.90469,
            'longitude': 116.40717,
            'tags': ['旅行', '北京', '历史', '摄影'],
            'categories': ['旅行']
        },
        {
            'title': '上海外滩夜景',
            'location_name': '上海外滩',
            'latitude': 31.23394,
            'longitude': 121.49269,
            'tags': ['旅行', '上海', '夜景', '摄影', '都市'],
            'categories': ['旅行']
        },
        {
            'title': '杭州西湖印象',
            'location_name': '杭州西湖',
            'latitude': 30.24480,
            'longitude': 120.14042,
            'tags': ['旅行', '杭州', '西湖', '自然', '诗意'],
            'categories': ['旅行']
        },
        {
            'title': '深圳科技园见闻',
            'location_name': '深圳南山科技园',
            'latitude': 22.53386,
            'longitude': 113.93463,
            'tags': ['科技', '深圳', '创新', '工作'],
            'categories': ['技术']
        },
        {
            'title': '成都美食探索',
            'location_name': '成都宽窄巷子',
            'latitude': 30.67368,
            'longitude': 104.05755,
            'tags': ['美食', '成都', '火锅', '生活'],
            'categories': ['生活']
        },
        {
            'title': '青岛海边漫步',
            'location_name': '青岛栈桥',
            'latitude': 36.05956,
            'longitude': 120.32842,
            'tags': ['旅行', '青岛', '海边', '休闲'],
            'categories': ['旅行']
        },
        {
            'title': '西安古城文化',
            'location_name': '西安古城墙',
            'latitude': 34.26667,
            'longitude': 108.95000,
            'tags': ['历史', '西安', '古建筑', '文化'],
            'categories': ['旅行']
        },
        {
            'title': '厦门鼓浪屿之旅',
            'location_name': '厦门鼓浪屿',
            'latitude': 24.44826,
            'longitude': 118.06885,
            'tags': ['旅行', '厦门', '海岛', '音乐', '文艺'],
            'categories': ['旅行']
        }
    ]
    
    # 确保默认用户存在
    try:
        author = User.objects.get(username='admin')
    except User.DoesNotExist:
        print("❌ 未找到admin用户，正在创建...")
        author = User.objects.create_user(
            username='admin',
            email='admin@example.com',
            password='admin123',
            is_staff=True,
            is_superuser=True
        )
        print("✅ 创建admin用户成功")
    
    updated_count = 0
    created_count = 0
    
    for location_data in locations:
        # 尝试更新现有文章或创建新文章
        post, created = BlogPost.objects.get_or_create(
            title=location_data['title'],
            defaults={
                'author': author,
                'content': f"这是关于{location_data['location_name']}的文章内容...",
                'excerpt': f"探索{location_data['location_name']}的美丽与魅力",
                'latitude': location_data['latitude'],
                'longitude': location_data['longitude'],
                'location_name': location_data['location_name'],
                'status': 'published'
            }
        )
        
        if not created:
            # 更新现有文章的地理位置信息
            post.latitude = location_data['latitude']
            post.longitude = location_data['longitude']
            post.location_name = location_data['location_name']
            if not post.excerpt:
                post.excerpt = f"探索{location_data['location_name']}的美丽与魅力"
            post.save()
            updated_count += 1
        else:
            created_count += 1
        
        # 添加标签 - 使用try/except处理可能的重复
        for tag_name in location_data['tags']:
            try:
                tag, tag_created = Tag.objects.get_or_create(name=tag_name)
                post.tags.add(tag)
                if tag_created:
                    print(f"   ✅ 创建新标签: {tag_name}")
            except Exception as e:
                print(f"   ⚠️ 标签处理失败: {tag_name} - {str(e)}")
                # 尝试通过名称查找现有标签
                try:
                    existing_tag = Tag.objects.get(name=tag_name)
                    post.tags.add(existing_tag)
                    print(f"   🔄 使用现有标签: {tag_name}")
                except Tag.DoesNotExist:
                    print(f"   ❌ 无法处理标签: {tag_name}")
        
        # 添加分类
        for category_name in location_data['categories']:
            try:
                category, category_created = Category.objects.get_or_create(name=category_name)
                post.categories.add(category)
                if category_created:
                    print(f"   ✅ 创建新分类: {category_name}")
            except Exception as e:
                print(f"   ⚠️ 分类处理失败: {category_name} - {str(e)}")
                # 尝试通过名称查找现有分类
                try:
                    existing_category = Category.objects.get(name=category_name)
                    post.categories.add(existing_category)
                    print(f"   🔄 使用现有分类: {category_name}")
                except Category.DoesNotExist:
                    print(f"   ❌ 无法处理分类: {category_name}")
        
        print(f"{'✅ 创建' if created else '🔄 更新'} 文章: {post.title} - {location_data['location_name']}")
        print(f"   标签: {', '.join(location_data['tags'])}")
        print(f"   位置: [{location_data['longitude']}, {location_data['latitude']}]")
        print()
    
    print(f"🎉 完成！创建了 {created_count} 篇新文章，更新了 {updated_count} 篇文章")
    
    # 统计信息
    total_posts = BlogPost.objects.count()
    posts_with_location = BlogPost.objects.filter(
        latitude__isnull=False, 
        longitude__isnull=False
    ).count()
    total_tags = Tag.objects.count()
    
    print(f"\n📊 当前数据统计:")
    print(f"   总文章数: {total_posts}")
    print(f"   有位置信息的文章: {posts_with_location}")
    print(f"   总标签数: {total_tags}")

if __name__ == '__main__':
    add_location_data() 