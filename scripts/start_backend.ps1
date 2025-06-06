# 个人博客系统 - Windows 后端启动脚本

param(
    [switch]$Production,
    [string]$Host = "127.0.0.1",
    [int]$Port = 8000,
    [switch]$Help
)

# 显示帮助
function Show-Help {
    Write-Host "个人博客系统后端启动脚本" -ForegroundColor Blue
    Write-Host ""
    Write-Host "用法: .\scripts\start_backend.ps1 [选项]" -ForegroundColor White
    Write-Host ""
    Write-Host "选项:" -ForegroundColor Yellow
    Write-Host "  -Production      生产模式启动 (使用 Gunicorn)" -ForegroundColor White
    Write-Host "  -Host <地址>     指定绑定地址 (默认: 127.0.0.1)" -ForegroundColor White
    Write-Host "  -Port <端口>     指定端口 (默认: 8000)" -ForegroundColor White
    Write-Host "  -Help            显示此帮助信息" -ForegroundColor White
    Write-Host ""
    Write-Host "示例:" -ForegroundColor Yellow
    Write-Host "  .\scripts\start_backend.ps1              # 开发模式启动" -ForegroundColor White
    Write-Host "  .\scripts\start_backend.ps1 -Production  # 生产模式启动" -ForegroundColor White
    Write-Host "  .\scripts\start_backend.ps1 -Port 8080   # 指定端口" -ForegroundColor White
}

# 主函数
function Main {
    if ($Help) {
        Show-Help
        return
    }
    
    Write-Host "🚀 启动个人博客系统后端..." -ForegroundColor Green
    
    # 检查后端目录
    if (-not (Test-Path "recipeServerPython")) {
        Write-Host "❌ 错误: 未找到后端目录 'recipeServerPython'" -ForegroundColor Red
        Write-Host "请确保在项目根目录下运行此脚本" -ForegroundColor Yellow
        exit 1
    }
    
    # 进入后端目录
    Push-Location "recipeServerPython"
    
    try {
        # 检查虚拟环境
        if (-not (Test-Path "venv")) {
            Write-Host "❌ 错误: 未找到虚拟环境" -ForegroundColor Red
            Write-Host "请先运行 .\scripts\dev_setup.ps1 设置开发环境" -ForegroundColor Yellow
            exit 1
        }
        
        # 激活虚拟环境
        Write-Host "📋 激活虚拟环境..." -ForegroundColor Yellow
        & ".\venv\Scripts\Activate.ps1"
        
        # 检查环境配置文件
        if (-not (Test-Path ".env")) {
            Write-Host "⚠️  警告: 未找到 .env 配置文件" -ForegroundColor Yellow
            if (Test-Path ".env.example") {
                Write-Host "📝 从 .env.example 创建配置文件..." -ForegroundColor Cyan
                Copy-Item ".env.example" ".env"
            }
        }
        
        # 应用数据库迁移
        Write-Host "🗄️  检查数据库迁移..." -ForegroundColor Cyan
        python manage.py migrate --check 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "📝 应用数据库迁移..." -ForegroundColor Cyan
            python manage.py migrate
        }
        
        # 收集静态文件（生产模式）
        if ($Production) {
            Write-Host "📦 收集静态文件..." -ForegroundColor Cyan
            python manage.py collectstatic --noinput
        }
        
        # 启动服务器
        Write-Host "🌐 启动后端服务器..." -ForegroundColor Green
        Write-Host "📍 地址: http://${Host}:${Port}" -ForegroundColor Cyan
        Write-Host "🛑 按 Ctrl+C 停止服务器" -ForegroundColor Yellow
        Write-Host "========================================" -ForegroundColor Blue
        
        if ($Production) {
            # 生产模式 - 检查是否安装了 gunicorn
            $gunicornCheck = pip show gunicorn 2>$null
            if ($LASTEXITCODE -eq 0) {
                gunicorn recipeServer.wsgi:application --bind "${Host}:${Port}" --workers 3 --timeout 120
            } else {
                Write-Host "⚠️  警告: 未安装 gunicorn，使用 Django 开发服务器" -ForegroundColor Yellow
                python manage.py runserver "${Host}:${Port}"
            }
        } else {
            # 开发模式
            python manage.py runserver "${Host}:${Port}"
        }
        
    } catch {
        Write-Host "❌ 启动失败: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    } finally {
        # 返回原目录
        Pop-Location
    }
}

# 运行主函数
Main 