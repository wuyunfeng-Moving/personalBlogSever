#!/usr/bin/env python3
"""
专门测试密码不匹配的脚本
"""

import requests
import json
import time

BASE_URL = 'http://127.0.0.1:8000/api/v1'

def test_password_mismatch():
    """测试密码不匹配的具体情况"""
    print("🔧 测试密码不匹配...")
    
    test_user = {
        'username': f'mismatchuser{int(time.time())}',  # 确保用户名唯一
        'email': f'mismatch{int(time.time())}@example.com',  # 确保邮箱唯一
        'password': 'password123',
        'password2': 'password456',  # 故意不匹配
        'first_name': 'Test',
        'last_name': 'User'
    }
    
    print(f"📤 发送数据: {json.dumps(test_user, indent=2, ensure_ascii=False)}")
    
    try:
        response = requests.post(
            f'{BASE_URL}/auth/register/',
            json=test_user,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        print(f"📊 响应状态码: {response.status_code}")
        
        try:
            response_data = response.json()
            print(f"📝 响应内容: {json.dumps(response_data, indent=2, ensure_ascii=False)}")
        except:
            print(f"📝 响应内容 (原始): {response.text}")
        
        return response.status_code == 400
        
    except Exception as e:
        print(f"❌ 请求异常: {str(e)}")
        return False

def test_correct_registration():
    """测试正确的注册"""
    print("\n🔧 测试正确注册...")
    
    test_user = {
        'username': f'correctuser{int(time.time())}',
        'email': f'correct{int(time.time())}@example.com',
        'password': 'correctpassword123',
        'password2': 'correctpassword123',  # 匹配的密码
        'first_name': 'Correct',
        'last_name': 'User'
    }
    
    print(f"📤 发送数据: {json.dumps(test_user, indent=2, ensure_ascii=False)}")
    
    try:
        response = requests.post(
            f'{BASE_URL}/auth/register/',
            json=test_user,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        print(f"📊 响应状态码: {response.status_code}")
        
        try:
            response_data = response.json()
            print(f"📝 响应内容: {json.dumps(response_data, indent=2, ensure_ascii=False)}")
        except:
            print(f"📝 响应内容 (原始): {response.text}")
        
        return response.status_code == 201
        
    except Exception as e:
        print(f"❌ 请求异常: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 开始密码匹配测试...\n")
    
    # 测试密码不匹配
    result1 = test_password_mismatch()
    
    # 测试正确注册
    result2 = test_correct_registration()
    
    print(f"\n📊 测试结果:")
    print(f"密码不匹配测试: {'✅ 通过' if result1 else '❌ 失败'}")
    print(f"正确注册测试: {'✅ 通过' if result2 else '❌ 失败'}") 