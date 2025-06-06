#!/usr/bin/env python
import requests
import json

# API基础URL
BASE_URL = 'http://127.0.0.1:8000/api/v1'

def test_blog_api():
    """测试博客API"""
    
    print("🧪 测试博客API...")
    
    # 1. 测试获取分类列表
    print("\n1. 测试获取分类列表...")
    try:
        response = requests.get(f'{BASE_URL}/categories/')
        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            categories = response.json()
            print(f"分类数量: {len(categories)}")
            for cat in categories:
                print(f"  - {cat['name']} (slug: {cat['slug']})")
        else:
            print(f"错误: {response.text}")
    except Exception as e:
        print(f"请求失败: {e}")
    
    # 2. 测试获取标签列表
    print("\n2. 测试获取标签列表...")
    try:
        response = requests.get(f'{BASE_URL}/tags/')
        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            tags = response.json()
            print(f"标签数量: {len(tags)}")
            for tag in tags[:5]:  # 只显示前5个
                print(f"  - {tag['name']} (slug: {tag['slug']})")
        else:
            print(f"错误: {response.text}")
    except Exception as e:
        print(f"请求失败: {e}")
    
    # 3. 测试获取文章列表
    print("\n3. 测试获取文章列表...")
    try:
        response = requests.get(f'{BASE_URL}/posts/')
        print(f"状态码: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"文章数量: {data.get('count', 0)}")
            posts = data.get('results', [])
            for post in posts:
                print(f"  - {post['title']} (作者: {post['author']['username']})")
        else:
            print(f"错误: {response.text}")
    except Exception as e:
        print(f"请求失败: {e}")
    
    # 4. 测试用户认证
    print("\n4. 测试用户认证...")
    try:
        # 尝试登录
        login_data = {
            'username': 'wuyunfeng1',
            'password': 'password123'
        }
        response = requests.post(f'{BASE_URL}/auth/token/', json=login_data)
        print(f"登录状态码: {response.status_code}")
        
        if response.status_code == 200:
            tokens = response.json()
            access_token = tokens['access']
            print("登录成功！")
            
            # 5. 测试创建文章
            print("\n5. 测试创建文章...")
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            post_data = {
                'title': '测试文章',
                'content': '这是一篇测试文章的内容。',
                'excerpt': '这是测试文章的摘要。',
                'status': 'published',
                'category_ids': [1],  # 技术分类
                'tag_names': ['测试', 'API']
            }
            
            response = requests.post(f'{BASE_URL}/posts/', json=post_data, headers=headers)
            print(f"创建文章状态码: {response.status_code}")
            
            if response.status_code == 201:
                post = response.json()
                print(f"文章创建成功: {post['title']} (slug: {post['slug']})")
            else:
                print(f"创建失败: {response.text}")
        else:
            print(f"登录失败: {response.text}")
    
    except Exception as e:
        print(f"认证测试失败: {e}")
    
    print("\n✅ API测试完成！")

if __name__ == '__main__':
    test_blog_api() 