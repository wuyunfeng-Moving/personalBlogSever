#!/usr/bin/env python3
"""
为现有文章添加标签的脚本
"""

import os
import sys
import django
import random

# 添加项目路径
sys.path.append(os.path.join(os.path.dirname(__file__), 'recipeServerPython'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'recipe_server.settings')
django.setup()

from blog.models import BlogPost, Tag, Category

def add_tags_to_posts():
    """为现有文章添加标签"""
    
    print("🏷️  开始为现有文章添加标签...")
    
    # 获取现有标签
    existing_tags = list(Tag.objects.all())
    print(f'现有标签数量: {len(existing_tags)}')
    print('标签列表:', [t.name for t in existing_tags])
    
    # 获取有位置信息的文章
    posts_with_location = BlogPost.objects.filter(
        latitude__isnull=False, 
        longitude__isnull=False
    )
    print(f'有位置信息的文章: {posts_with_location.count()}篇')
    
    if not existing_tags:
        print("❌ 没有现有标签，请先创建一些标签")
        return
    
    updated_count = 0
    
    for post in posts_with_location:
        # 为每篇文章随机添加2-4个标签
        num_tags = random.randint(2, min(4, len(existing_tags)))
        selected_tags = random.sample(existing_tags, num_tags)
        
        # 清除现有标签并添加新标签
        post.tags.clear()
        for tag in selected_tags:
            post.tags.add(tag)
        
        tag_names = [t.name for t in selected_tags]
        print(f'✅ 文章「{post.title}」({post.location_name}) 添加标签: {", ".join(tag_names)}')
        updated_count += 1
    
    print(f"\n🎉 完成！为 {updated_count} 篇文章添加了标签")
    
    # 验证结果
    print("\n📊 验证结果:")
    for post in posts_with_location:
        tags = post.tags.all()
        print(f"   {post.title}: {[t.name for t in tags]} ({len(tags)}个标签)")

if __name__ == '__main__':
    add_tags_to_posts() 