#!/usr/bin/env python
import os
import sys
import django

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'recipe_server.settings')
django.setup()

from blog.models import Category, Tag

def create_initial_data():
    """创建初始分类和标签数据"""
    
    # 创建分类
    categories = [
        {'name': '技术', 'description': '技术相关文章'},
        {'name': '生活', 'description': '生活感悟和日常'},
        {'name': '旅行', 'description': '旅行见闻和攻略'},
        {'name': '随笔', 'description': '随想随写'},
        {'name': '教程', 'description': '技术教程和指南'},
    ]
    
    for cat_data in categories:
        category, created = Category.objects.get_or_create(
            name=cat_data['name'],
            defaults={'description': cat_data['description']}
        )
        if created:
            print(f"创建分类: {category.name}")
        else:
            print(f"分类已存在: {category.name}")
    
    # 创建标签
    tags = [
        '前端', '后端', 'JavaScript', 'Python', 'React', 'Django',
        'Vue', 'Node.js', '数据库', 'Linux', '算法', '设计模式',
        '生活感悟', '读书笔记', '电影', '音乐', '摄影', '美食'
    ]
    
    for tag_name in tags:
        tag, created = Tag.objects.get_or_create(name=tag_name)
        if created:
            print(f"创建标签: {tag.name}")
        else:
            print(f"标签已存在: {tag.name}")
    
    print("初始数据创建完成！")

if __name__ == '__main__':
    create_initial_data() 