#!/usr/bin/env python3
"""
测试API是否正确返回标签信息
"""

import requests
import json

def test_posts_api():
    """测试文章API返回的标签信息"""
    
    print("🧪 测试文章API标签数据...")
    
    try:
        response = requests.get('http://127.0.0.1:8000/api/v1/posts/')
        response.raise_for_status()
        
        data = response.json()
        posts = data.get('results', [])
        
        print(f"✅ API响应正常，文章数量: {len(posts)}")
        print()
        
        for i, post in enumerate(posts, 1):
            title = post.get('title', '无标题')
            tags = post.get('tags', [])
            categories = post.get('categories', [])
            location = post.get('location_name', '无位置')
            latitude = post.get('latitude')
            longitude = post.get('longitude')
            
            print(f"{i}. 📝 {title}")
            print(f"   📍 位置: {location}")
            if latitude and longitude:
                print(f"   🌍 坐标: [{longitude}, {latitude}]")
            
            if tags:
                tag_names = [tag.get('name', '未知') for tag in tags]
                print(f"   🏷️  标签: {', '.join(tag_names)} ({len(tags)}个)")
            else:
                print(f"   🏷️  标签: 无标签")
            
            if categories:
                category_names = [cat.get('name', '未知') for cat in categories]
                print(f"   📂 分类: {', '.join(category_names)} ({len(categories)}个)")
            else:
                print(f"   📂 分类: 无分类")
            
            print("-" * 60)
        
        # 统计信息
        posts_with_tags = [p for p in posts if p.get('tags')]
        posts_with_location = [p for p in posts if p.get('latitude') and p.get('longitude')]
        total_tags = sum(len(p.get('tags', [])) for p in posts)
        
        print("\n📊 统计信息:")
        print(f"   总文章数: {len(posts)}")
        print(f"   有标签的文章: {len(posts_with_tags)}")
        print(f"   有位置的文章: {len(posts_with_location)}")
        print(f"   标签总数: {total_tags}")
        
        if posts_with_tags and posts_with_location:
            print("\n🎉 地图标签功能数据准备完成！")
            print("   现在可以在地图上看到带标签的文章标记了")
        else:
            print("\n⚠️  数据可能不完整")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ API请求失败: {e}")
    except Exception as e:
        print(f"❌ 测试失败: {e}")

if __name__ == '__main__':
    test_posts_api() 