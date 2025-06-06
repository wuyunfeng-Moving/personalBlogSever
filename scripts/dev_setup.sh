#!/bin/bash

# 个人博客系统 - 开发环境快速设置脚本

set -e

echo "🚀 开始设置个人博客系统开发环境..."

# 检查系统依赖
check_dependencies() {
    echo "📋 检查系统依赖..."
    
    # 检查 Python
    if ! command -v python3 &> /dev/null; then
        echo "❌ Python 3 未安装"
        exit 1
    fi
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js 未安装"
        exit 1
    fi
    
    echo "✅ 系统依赖检查完成"
}

# 设置后端
setup_backend() {
    echo "🐍 设置 Django 后端..."
    
    cd recipeServerPython
    
    # 创建虚拟环境
    if [ ! -d "venv" ]; then
        python3 -m venv venv
        echo "✅ 创建虚拟环境"
    fi
    
    # 激活虚拟环境
    source venv/bin/activate
    
    # 安装依赖
    pip install -r requirements.txt
    echo "✅ 安装 Python 依赖"
    
    # 创建环境配置文件
    if [ ! -f ".env" ]; then
        cat > .env << EOF
DEBUG=True
SECRET_KEY=dev-secret-key-$(date +%s)
DATABASE_URL=sqlite:///db.sqlite3
ALLOWED_HOSTS=localhost,127.0.0.1
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
CORS_ALLOW_ALL_ORIGINS=True
EOF
        echo "✅ 创建后端环境配置"
    fi
    
    # 数据库迁移
    python manage.py migrate
    echo "✅ 执行数据库迁移"
    
    # 创建示例数据
    echo "📊 是否创建示例数据? (y/n)"
    read -r create_sample_data
    if [[ $create_sample_data =~ ^[Yy]$ ]]; then
        python manage.py create_sample_blog_data
        echo "✅ 创建示例数据"
    fi
    
    # 创建超级用户
    echo "👤 是否创建超级用户? (y/n)"
    read -r create_superuser
    if [[ $create_superuser =~ ^[Yy]$ ]]; then
        python manage.py createsuperuser
        echo "✅ 创建超级用户"
    fi
    
    cd ..
}

# 设置前端
setup_frontend() {
    echo "⚛️  设置 React 前端..."
    
    cd recipeServerWeb
    
    # 安装依赖
    npm install
    echo "✅ 安装 Node.js 依赖"
    
    # 创建环境配置文件
    if [ ! -f ".env" ]; then
        cat > .env << EOF
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_APP_TITLE=个人博客 - 开发环境
VITE_APP_DESCRIPTION=基于 React + Django 的博客系统
VITE_NODE_ENV=development
EOF
        echo "✅ 创建前端环境配置"
    fi
    
    cd ..
}

# 创建启动脚本
create_scripts() {
    echo "📝 创建启动脚本..."
    
    # 后端启动脚本
    cat > scripts/start_backend.sh << 'EOF'
#!/bin/bash
cd recipeServerPython
source venv/bin/activate
echo "🐍 启动 Django 开发服务器..."
python manage.py runserver
EOF
    chmod +x scripts/start_backend.sh
    
    # 前端启动脚本
    cat > scripts/start_frontend.sh << 'EOF'
#!/bin/bash
cd recipeServerWeb
echo "⚛️ 启动 React 开发服务器..."
npm run dev
EOF
    chmod +x scripts/start_frontend.sh
    
    # 全栈启动脚本
    cat > scripts/start_all.sh << 'EOF'
#!/bin/bash
echo "🚀 启动全栈开发环境..."

# 启动后端 (后台运行)
cd recipeServerPython
source venv/bin/activate
nohup python manage.py runserver > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
echo "🐍 Django 服务器已启动 (PID: $BACKEND_PID)"
cd ..

# 等待后端启动
sleep 3

# 启动前端
cd recipeServerWeb
echo "⚛️ 启动 React 开发服务器..."
npm run dev
EOF
    chmod +x scripts/start_all.sh
    
    echo "✅ 创建启动脚本"
}

# 创建日志目录
create_directories() {
    echo "📁 创建项目目录..."
    
    mkdir -p logs
    mkdir -p scripts
    mkdir -p backup
    
    echo "✅ 创建项目目录"
}

# 主函数
main() {
    check_dependencies
    create_directories
    setup_backend
    setup_frontend
    create_scripts
    
    echo ""
    echo "🎉 开发环境设置完成!"
    echo ""
    echo "📋 接下来你可以:"
    echo "   1. 运行后端: ./scripts/start_backend.sh"
    echo "   2. 运行前端: ./scripts/start_frontend.sh"
    echo "   3. 同时运行: ./scripts/start_all.sh"
    echo ""
    echo "🌐 访问地址:"
    echo "   - 前端应用: http://localhost:5173"
    echo "   - 后端 API: http://localhost:8000/api/v1"
    echo "   - 管理后台: http://localhost:8000/admin"
    echo ""
}

main 