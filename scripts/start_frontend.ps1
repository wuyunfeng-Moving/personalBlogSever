# 个人博客系统 - Windows 前端启动脚本

param(
    [switch]$Production,
    [switch]$Build,
    [switch]$Preview,
    [string]$Host = "localhost",
    [int]$Port = 5173,
    [switch]$Help
)

# 显示帮助
function Show-Help {
    Write-Host "个人博客系统前端启动脚本" -ForegroundColor Blue
    Write-Host ""
    Write-Host "用法: .\scripts\start_frontend.ps1 [选项]" -ForegroundColor White
    Write-Host ""
    Write-Host "选项:" -ForegroundColor Yellow
    Write-Host "  -Production      生产模式构建" -ForegroundColor White
    Write-Host "  -Build           仅构建不启动" -ForegroundColor White
    Write-Host "  -Preview         预览生产构建结果" -ForegroundColor White
    Write-Host "  -Host <地址>     指定绑定地址 (默认: localhost)" -ForegroundColor White
    Write-Host "  -Port <端口>     指定端口 (默认: 5173)" -ForegroundColor White
    Write-Host "  -Help            显示此帮助信息" -ForegroundColor White
    Write-Host ""
    Write-Host "示例:" -ForegroundColor Yellow
    Write-Host "  .\scripts\start_frontend.ps1             # 开发模式启动" -ForegroundColor White
    Write-Host "  .\scripts\start_frontend.ps1 -Build      # 仅构建" -ForegroundColor White
    Write-Host "  .\scripts\start_frontend.ps1 -Preview    # 预览构建结果" -ForegroundColor White
    Write-Host "  .\scripts\start_frontend.ps1 -Port 3000  # 指定端口" -ForegroundColor White
}

# 主函数
function Main {
    if ($Help) {
        Show-Help
        return
    }
    
    Write-Host "🚀 启动个人博客系统前端..." -ForegroundColor Green
    
    # 检查前端目录
    if (-not (Test-Path "recipeServerWeb")) {
        Write-Host "❌ 错误: 未找到前端目录 'recipeServerWeb'" -ForegroundColor Red
        Write-Host "请确保在项目根目录下运行此脚本" -ForegroundColor Yellow
        exit 1
    }
    
    # 进入前端目录
    Push-Location "recipeServerWeb"
    
    try {
        # 检查 package.json
        if (-not (Test-Path "package.json")) {
            Write-Host "❌ 错误: 未找到 package.json 文件" -ForegroundColor Red
            Write-Host "请确保这是一个有效的 Node.js 项目" -ForegroundColor Yellow
            exit 1
        }
        
        # 检查 node_modules
        if (-not (Test-Path "node_modules")) {
            Write-Host "📦 未找到 node_modules，开始安装依赖..." -ForegroundColor Yellow
            npm install
            if ($LASTEXITCODE -ne 0) {
                Write-Host "❌ 依赖安装失败" -ForegroundColor Red
                exit 1
            }
        }
        
        # 检查环境配置文件
        if (-not (Test-Path ".env")) {
            Write-Host "⚠️  警告: 未找到 .env 配置文件" -ForegroundColor Yellow
            if (Test-Path ".env.example") {
                Write-Host "📝 从 .env.example 创建配置文件..." -ForegroundColor Cyan
                Copy-Item ".env.example" ".env"
            } else {
                Write-Host "📝 创建默认 .env 配置文件..." -ForegroundColor Cyan
                $defaultEnv = @"
VITE_API_URL=http://localhost:8000/api/v1
VITE_APP_TITLE=个人博客系统
VITE_APP_DESCRIPTION=基于 Django + React 的现代化博客系统
"@
                $defaultEnv | Out-File -FilePath ".env" -Encoding UTF8
            }
        }
        
        # 根据参数选择操作
        if ($Build -or $Production) {
            # 构建生产版本
            Write-Host "🏗️  构建生产版本..." -ForegroundColor Green
            Write-Host "========================================" -ForegroundColor Blue
            
            npm run build
            if ($LASTEXITCODE -ne 0) {
                Write-Host "❌ 构建失败" -ForegroundColor Red
                exit 1
            }
            
            Write-Host "✅ 构建完成！" -ForegroundColor Green
            Write-Host "📁 构建文件位于: dist/" -ForegroundColor Cyan
            
            if (-not $Build) {
                # 如果不是仅构建模式，显示部署提示
                Write-Host ""
                Write-Host "🚀 部署提示:" -ForegroundColor Yellow
                Write-Host "  - 将 dist/ 目录内容部署到 Web 服务器" -ForegroundColor White
                Write-Host "  - 或使用 .\scripts\start_frontend.ps1 -Preview 预览" -ForegroundColor White
            }
            
        } elseif ($Preview) {
            # 预览生产构建结果
            if (-not (Test-Path "dist")) {
                Write-Host "❌ 未找到构建文件，请先运行构建" -ForegroundColor Red
                Write-Host "运行: .\scripts\start_frontend.ps1 -Build" -ForegroundColor Yellow
                exit 1
            }
            
            Write-Host "👀 预览生产构建结果..." -ForegroundColor Green
            Write-Host "📍 地址: http://${Host}:${Port}" -ForegroundColor Cyan
            Write-Host "🛑 按 Ctrl+C 停止服务器" -ForegroundColor Yellow
            Write-Host "========================================" -ForegroundColor Blue
            
            npm run preview -- --host $Host --port $Port
            
        } else {
            # 开发模式
            Write-Host "🔥 启动开发服务器..." -ForegroundColor Green
            Write-Host "📍 地址: http://${Host}:${Port}" -ForegroundColor Cyan
            Write-Host "🛑 按 Ctrl+C 停止服务器" -ForegroundColor Yellow
            Write-Host "🔄 支持热重载" -ForegroundColor Cyan
            Write-Host "========================================" -ForegroundColor Blue
            
            # 设置环境变量
            $env:NODE_ENV = "development"
            
            npm run dev -- --host $Host --port $Port
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