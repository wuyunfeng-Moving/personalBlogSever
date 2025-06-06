# 个人博客系统 - Windows 开发环境快速设置脚本

param(
    [switch]$SkipDependencyCheck,
    [switch]$NoSampleData,
    [switch]$NoSuperUser
)

# 设置错误处理
$ErrorActionPreference = "Stop"

Write-Host "🚀 开始设置个人博客系统开发环境..." -ForegroundColor Green

# 检查系统依赖
function Test-Dependencies {
    Write-Host "📋 检查系统依赖..." -ForegroundColor Yellow
    
    $dependencies = @()
    
    # 检查 Python
    try {
        $pythonVersion = python --version 2>$null
        if ($pythonVersion -match "Python (\d+)\.(\d+)") {
            $major = [int]$matches[1]
            $minor = [int]$matches[2]
            if ($major -ge 3 -and $minor -ge 8) {
                Write-Host "✅ Python $pythonVersion" -ForegroundColor Green
            } else {
                $dependencies += "Python 3.8+"
            }
        }
    } catch {
        $dependencies += "Python 3.8+"
    }
    
    # 检查 Node.js
    try {
        $nodeVersion = node --version 2>$null
        if ($nodeVersion -match "v(\d+)\.(\d+)") {
            $major = [int]$matches[1]
            if ($major -ge 16) {
                Write-Host "✅ Node.js $nodeVersion" -ForegroundColor Green
            } else {
                $dependencies += "Node.js 16+"
            }
        }
    } catch {
        $dependencies += "Node.js 16+"
    }
    
    # 检查 npm
    try {
        $npmVersion = npm --version 2>$null
        Write-Host "✅ npm $npmVersion" -ForegroundColor Green
    } catch {
        $dependencies += "npm"
    }
    
    if ($dependencies.Length -gt 0) {
        Write-Host "❌ 缺少以下依赖:" -ForegroundColor Red
        foreach ($dep in $dependencies) {
            Write-Host "   - $dep" -ForegroundColor Red
        }
        Write-Host "请安装后重新运行此脚本。" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "✅ 系统依赖检查通过" -ForegroundColor Green
}

# 设置后端
function Setup-Backend {
    Write-Host "🐍 设置 Django 后端..." -ForegroundColor Yellow
    
    if (-not (Test-Path "recipeServerPython")) {
        Write-Host "❌ 未找到 recipeServerPython 目录" -ForegroundColor Red
        exit 1
    }
    
    Set-Location "recipeServerPython"
    
    # 创建虚拟环境
    if (-not (Test-Path "venv")) {
        Write-Host "创建 Python 虚拟环境..." -ForegroundColor Cyan
        python -m venv venv
        Write-Host "✅ 创建虚拟环境" -ForegroundColor Green
    }
    
    # 激活虚拟环境
    & "venv\Scripts\Activate.ps1"
    
    # 安装依赖
    Write-Host "安装 Python 依赖..." -ForegroundColor Cyan
    pip install -r requirements.txt
    Write-Host "✅ 安装 Python 依赖" -ForegroundColor Green
    
    # 创建环境配置文件
    if (-not (Test-Path ".env")) {
        $envContent = @"
DEBUG=True
SECRET_KEY=dev-secret-key-$(Get-Date -Format "yyyyMMddHHmmss")
DATABASE_URL=sqlite:///db.sqlite3
ALLOWED_HOSTS=localhost,127.0.0.1
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
CORS_ALLOW_ALL_ORIGINS=True
"@
        Set-Content -Path ".env" -Value $envContent -Encoding UTF8
        Write-Host "✅ 创建后端环境配置" -ForegroundColor Green
    }
    
    # 数据库迁移
    Write-Host "执行数据库迁移..." -ForegroundColor Cyan
    python manage.py migrate
    Write-Host "✅ 执行数据库迁移" -ForegroundColor Green
    
    # 创建示例数据
    if (-not $NoSampleData) {
        $createSampleData = Read-Host "📊 是否创建示例数据? (y/n)"
        if ($createSampleData -match "^[Yy]") {
            try {
                python manage.py create_sample_blog_data
                Write-Host "✅ 创建示例数据" -ForegroundColor Green
            } catch {
                Write-Host "⚠️ 创建示例数据失败，可能命令不存在" -ForegroundColor Yellow
            }
        }
    }
    
    # 创建超级用户
    if (-not $NoSuperUser) {
        $createSuperuser = Read-Host "👤 是否创建超级用户? (y/n)"
        if ($createSuperuser -match "^[Yy]") {
            python manage.py createsuperuser
            Write-Host "✅ 创建超级用户" -ForegroundColor Green
        }
    }
    
    Set-Location ".."
}

# 设置前端
function Setup-Frontend {
    Write-Host "⚛️ 设置 React 前端..." -ForegroundColor Yellow
    
    if (-not (Test-Path "recipeServerWeb")) {
        Write-Host "❌ 未找到 recipeServerWeb 目录" -ForegroundColor Red
        exit 1
    }
    
    Set-Location "recipeServerWeb"
    
    # 安装依赖
    Write-Host "安装 Node.js 依赖..." -ForegroundColor Cyan
    npm install
    Write-Host "✅ 安装 Node.js 依赖" -ForegroundColor Green
    
    # 创建环境配置文件
    if (-not (Test-Path ".env")) {
        $envContent = @"
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_APP_TITLE=个人博客系统 - 开发环境
VITE_APP_DESCRIPTION=基于 React + Django 的个人博客系统
VITE_NODE_ENV=development
"@
        Set-Content -Path ".env" -Value $envContent -Encoding UTF8
        Write-Host "✅ 创建前端环境配置" -ForegroundColor Green
    }
    
    Set-Location ".."
}

# 创建启动脚本
function New-StartupScripts {
    Write-Host "📝 创建启动脚本..." -ForegroundColor Yellow
    
    # 后端启动脚本
    $backendScript = @"
# Django 后端启动脚本
Set-Location "recipeServerPython"
& "venv\Scripts\Activate.ps1"
Write-Host "🐍 启动 Django 开发服务器..." -ForegroundColor Green
python manage.py runserver
"@
    Set-Content -Path "scripts\start_backend.ps1" -Value $backendScript -Encoding UTF8
    
    # 前端启动脚本
    $frontendScript = @"
# React 前端启动脚本
Set-Location "recipeServerWeb"
Write-Host "⚛️ 启动 React 开发服务器..." -ForegroundColor Green
npm run dev
"@
    Set-Content -Path "scripts\start_frontend.ps1" -Value $frontendScript -Encoding UTF8
    
    Write-Host "✅ 创建启动脚本" -ForegroundColor Green
}

# 创建项目目录
function New-ProjectDirectories {
    Write-Host "📁 创建项目目录..." -ForegroundColor Yellow
    
    $directories = @("logs", "scripts", "backup")
    
    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir | Out-Null
        }
    }
    
    Write-Host "✅ 创建项目目录" -ForegroundColor Green
}

# 主函数
function Main {
    try {
        if (-not $SkipDependencyCheck) {
            Test-Dependencies
        }
        
        New-ProjectDirectories
        Setup-Backend
        Setup-Frontend
        New-StartupScripts
        
        Write-Host "`n🎉 开发环境设置完成!" -ForegroundColor Green
        Write-Host "`n📋 接下来你可以:" -ForegroundColor Cyan
        Write-Host "   1. 运行后端: .\scripts\start_backend.ps1" -ForegroundColor White
        Write-Host "   2. 运行前端: .\scripts\start_frontend.ps1" -ForegroundColor White
        Write-Host "`n🌐 访问地址:" -ForegroundColor Cyan
        Write-Host "   - 前端应用: http://localhost:5173" -ForegroundColor White
        Write-Host "   - 后端 API: http://localhost:8000/api/v1" -ForegroundColor White
        Write-Host "   - 管理后台: http://localhost:8000/admin" -ForegroundColor White
        Write-Host "`n💡 提示:" -ForegroundColor Yellow
        Write-Host "   - 如需重新设置，请删除 venv 目录和 .env 文件" -ForegroundColor White
        Write-Host "   - 使用 -NoSampleData 跳过示例数据创建" -ForegroundColor White
        Write-Host "   - 使用 -NoSuperUser 跳过超级用户创建" -ForegroundColor White
        
    } catch {
        Write-Host "`n❌ 设置过程中发生错误: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "请检查错误信息并重试。" -ForegroundColor Yellow
        exit 1
    }
}

# 运行主函数
Main 