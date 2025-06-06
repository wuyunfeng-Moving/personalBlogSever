#!/usr/bin/env python
"""
测试Swagger文档端点
"""
import requests
import json

BASE_URL = 'http://127.0.0.1:8000'

def test_swagger_endpoints():
    """测试Swagger相关端点"""
    
    print("🧪 测试Swagger文档端点...")
    
    endpoints = [
        {
            'name': 'OpenAPI Schema',
            'url': f'{BASE_URL}/api/schema/',
            'expected_content_type': 'application/vnd.oai.openapi'
        },
        {
            'name': 'Swagger UI',
            'url': f'{BASE_URL}/api/docs/',
            'expected_content_type': 'text/html'
        },
        {
            'name': 'ReDoc',
            'url': f'{BASE_URL}/api/redoc/',
            'expected_content_type': 'text/html'
        }
    ]
    
    for endpoint in endpoints:
        print(f"\n📋 测试 {endpoint['name']}...")
        try:
            response = requests.get(endpoint['url'])
            print(f"   状态码: {response.status_code}")
            print(f"   内容类型: {response.headers.get('content-type', 'unknown')}")
            
            if response.status_code == 200:
                print(f"   ✅ {endpoint['name']} 可正常访问")
            else:
                print(f"   ❌ {endpoint['name']} 访问失败")
                
        except requests.exceptions.ConnectionError:
            print(f"   ❌ 无法连接到服务器，请确保Django服务器正在运行")
        except Exception as e:
            print(f"   ❌ 测试失败: {e}")

if __name__ == '__main__':
    test_swagger_endpoints()
    print("\n✅ Swagger文档测试完成！")
    print("\n📖 访问文档:")
    print(f"   Swagger UI: {BASE_URL}/api/docs/")
    print(f"   ReDoc: {BASE_URL}/api/redoc/")
    print(f"   OpenAPI Schema: {BASE_URL}/api/schema/") 