#!/usr/bin/env python3
"""
CORS问题修复脚本
解决前端访问后端API时的跨域问题
"""

import subprocess
import sys
import os

def run_command(command, cwd=None):
    """运行命令并返回结果"""
    try:
        result = subprocess.run(command, shell=True, cwd=cwd, capture_output=True, text=True)
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        return False, "", str(e)

def main():
    print("🔧 开始修复CORS问题...")
    
    # 检查是否在正确的目录
    if not os.path.exists('recipeServerPython'):
        print("❌ 请在项目根目录运行此脚本")
        sys.exit(1)
    
    # 进入后端目录
    backend_dir = 'recipeServerPython'
    
    # 检查虚拟环境
    venv_path = os.path.join(backend_dir, 'venv')
    if not os.path.exists(venv_path):
        print("❌ 虚拟环境不存在，请先运行开发环境设置脚本")
        sys.exit(1)
    
    # 激活虚拟环境并安装包
    if os.name == 'nt':  # Windows
        pip_command = f"{venv_path}\\Scripts\\pip.exe"
        python_command = f"{venv_path}\\Scripts\\python.exe"
    else:  # Unix/Linux/macOS
        pip_command = f"{venv_path}/bin/pip"
        python_command = f"{venv_path}/bin/python"
    
    print("📦 安装 django-cors-headers...")
    success, stdout, stderr = run_command(f"{pip_command} install django-cors-headers>=3.13", cwd=backend_dir)
    
    if not success:
        print(f"❌ 安装失败: {stderr}")
        sys.exit(1)
    
    print("✅ django-cors-headers 安装成功")
    
    # 检查数据库迁移
    print("🔄 检查数据库迁移...")
    success, stdout, stderr = run_command(f"{python_command} manage.py migrate", cwd=backend_dir)
    
    if success:
        print("✅ 数据库迁移完成")
    else:
        print(f"⚠️ 数据库迁移警告: {stderr}")
    
    print("\n🎉 CORS问题修复完成！")
    print("\n📋 接下来的步骤:")
    print("1. 重启Django开发服务器")
    print("2. 重启前端开发服务器")
    print("\n💡 如果问题仍然存在，请检查:")
    print("- 前端是否运行在 localhost:8001")
    print("- 后端是否运行在 127.0.0.1:8000 或 localhost:8000")
    print("- 浏览器控制台是否还有其他错误")

if __name__ == "__main__":
    main() 