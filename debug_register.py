#!/usr/bin/env python3
"""
注册API调试脚本
用于测试和调试用户注册功能
"""

import requests
import json
import time

BASE_URL = 'http://127.0.0.1:8000/api/v1'

def test_register_api():
    """测试注册API"""
    print("🔧 调试注册API...")
    
    # 测试数据
    test_user = {
        'username': f'testuser{int(time.time())}',
        'email': 'test@example.com',
        'password': 'testpassword123',
        'password2': 'testpassword123',
        'first_name': 'Test',
        'last_name': 'User'
    }
    
    print(f"📤 发送注册数据: {json.dumps(test_user, indent=2, ensure_ascii=False)}")
    
    try:
        response = requests.post(
            f'{BASE_URL}/auth/register/',
            json=test_user,
            headers={
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            timeout=10
        )
        
        print(f"📊 响应状态码: {response.status_code}")
        print(f"📋 响应头: {dict(response.headers)}")
        
        try:
            response_data = response.json()
            print(f"📝 响应内容: {json.dumps(response_data, indent=2, ensure_ascii=False)}")
        except:
            print(f"📝 响应内容 (原始): {response.text}")
        
        if response.status_code == 201:
            print("✅ 注册成功!")
            return True
        else:
            print(f"❌ 注册失败: {response.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ 连接失败 - Django服务器可能没有运行")
        return False
    except requests.exceptions.Timeout:
        print("❌ 请求超时")
        return False
    except Exception as e:
        print(f"❌ 请求异常: {str(e)}")
        return False

def test_different_passwords():
    """测试密码不匹配的情况"""
    print("\n🔧 测试密码不匹配...")
    
    test_user = {
        'username': f'testuser{int(time.time())}',
        'email': 'test2@example.com',
        'password': 'password123',
        'password2': 'differentpassword',  # 故意不匹配
        'first_name': 'Test',
        'last_name': 'User'
    }
    
    try:
        response = requests.post(
            f'{BASE_URL}/auth/register/',
            json=test_user,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        print(f"📊 响应状态码: {response.status_code}")
        response_data = response.json()
        print(f"📝 错误信息: {json.dumps(response_data, indent=2, ensure_ascii=False)}")
        
    except Exception as e:
        print(f"❌ 请求异常: {str(e)}")

def test_missing_fields():
    """测试缺少字段的情况"""
    print("\n🔧 测试缺少必填字段...")
    
    test_user = {
        'username': f'testuser{int(time.time())}',
        # 故意缺少email
        'password': 'password123',
        'password2': 'password123',
    }
    
    try:
        response = requests.post(
            f'{BASE_URL}/auth/register/',
            json=test_user,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        
        print(f"📊 响应状态码: {response.status_code}")
        response_data = response.json()
        print(f"📝 错误信息: {json.dumps(response_data, indent=2, ensure_ascii=False)}")
        
    except Exception as e:
        print(f"❌ 请求异常: {str(e)}")

def check_server_status():
    """检查服务器状态"""
    print("🔍 检查Django服务器状态...")
    
    try:
        response = requests.get(f'{BASE_URL}/', timeout=5)
        print(f"✅ 服务器运行正常 (状态码: {response.status_code})")
        return True
    except requests.exceptions.ConnectionError:
        print("❌ 无法连接到Django服务器")
        print("请确保运行: python manage.py runserver")
        return False
    except Exception as e:
        print(f"❌ 服务器检查失败: {str(e)}")
        return False

def main():
    print("🚀 开始注册API调试...\n")
    
    # 检查服务器状态
    if not check_server_status():
        return
    
    print("\n" + "="*50)
    
    # 测试正常注册
    test_register_api()
    
    print("\n" + "="*50)
    
    # 测试密码不匹配
    test_different_passwords()
    
    print("\n" + "="*50)
    
    # 测试缺少字段
    test_missing_fields()
    
    print("\n🎉 调试完成!")

if __name__ == "__main__":
    main() 