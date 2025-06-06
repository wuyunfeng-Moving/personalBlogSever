# 个人博客系统 - Windows 前后端同时启动脚本

param(
    [switch]$Production,
    [string]$BackendHost = "127.0.0.1",
    [int]$BackendPort = 8000,
    [string]$FrontendHost = "localhost",
    [int]$FrontendPort = 5173,
    [int]$DelaySeconds = 3,
    [switch]$Help
)

# 显示帮助
function Show-Help {
    Write-Host "个人博客系统前后端同时启动脚本" -ForegroundColor Blue
    Write-Host ""
    Write-Host "用法: .\scripts\start_all.ps1 [选项]" -ForegroundColor White
    Write-Host ""
    Write-Host "选项:" -ForegroundColor Yellow
    Write-Host "  -Production          生产模式启动" -ForegroundColor White
    Write-Host "  -BackendHost <地址>  后端绑定地址 (默认: 127.0.0.1)" -ForegroundColor White
    Write-Host "  -BackendPort <端口>  后端端口 (默认: 8000)" -ForegroundColor White
    Write-Host "  -FrontendHost <地址> 前端绑定地址 (默认: localhost)" -ForegroundColor White
    Write-Host "  -FrontendPort <端口> 前端端口 (默认: 5173)" -ForegroundColor White
    Write-Host "  -DelaySeconds <秒>   前端启动延迟 (默认: 3)" -ForegroundColor White
    Write-Host "  -Help                显示此帮助信息" -ForegroundColor White
    Write-Host ""
    Write-Host "示例:" -ForegroundColor Yellow
    Write-Host "  .\scripts\start_all.ps1                    # 开发模式启动" -ForegroundColor White
    Write-Host "  .\scripts\start_all.ps1 -Production        # 生产模式启动" -ForegroundColor White
    Write-Host "  .\scripts\start_all.ps1 -DelaySeconds 5    # 增加启动延迟" -ForegroundColor White
    Write-Host ""
    Write-Host "注意:" -ForegroundColor Yellow
    Write-Host "  - 此脚本会启动两个独立的进程" -ForegroundColor White
    Write-Host "  - 按 Ctrl+C 将同时停止前后端服务" -ForegroundColor White
    Write-Host "  - 可以分别运行 start_backend.ps1 和 start_frontend.ps1 获得更多控制" -ForegroundColor White
}

# 清理函数 - 停止子进程
function Stop-Services {
    Write-Host "`n🛑 正在停止服务..." -ForegroundColor Yellow
    
    # 停止所有相关的后台作业
    Get-Job | Where-Object { $_.Name -like "Backend*" -or $_.Name -like "Frontend*" } | ForEach-Object {
        Write-Host "停止作业: $($_.Name)" -ForegroundColor Cyan
        Stop-Job $_ -PassThru | Remove-Job
    }
    
    # 尝试停止可能的端口占用进程
    try {
        $backendPid = netstat -ano | findstr ":$BackendPort " | ForEach-Object { $_.Split()[-1] } | Select-Object -First 1
        if ($backendPid) {
            taskkill /PID $backendPid /F 2>$null
        }
    } catch { }
    
    try {
        $frontendPid = netstat -ano | findstr ":$FrontendPort " | ForEach-Object { $_.Split()[-1] } | Select-Object -First 1
        if ($frontendPid) {
            taskkill /PID $frontendPid /F 2>$null
        }
    } catch { }
    
    Write-Host "✅ 服务已停止" -ForegroundColor Green
}

# 检查端口是否被占用
function Test-PortAvailable {
    param([int]$Port)
    
    try {
        $listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $Port)
        $listener.Start()
        $listener.Stop()
        return $true
    } catch {
        return $false
    }
}

# 主函数
function Main {
    if ($Help) {
        Show-Help
        return
    }
    
    Write-Host "🚀 启动个人博客系统..." -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Blue
    
    # 注册清理函数
    Register-EngineEvent PowerShell.Exiting -Action { Stop-Services }
    
    try {
        # 检查端口可用性
        if (-not (Test-PortAvailable -Port $BackendPort)) {
            Write-Host "❌ 后端端口 $BackendPort 已被占用" -ForegroundColor Red
            Write-Host "请使用其他端口或停止占用该端口的程序" -ForegroundColor Yellow
            exit 1
        }
        
        if (-not (Test-PortAvailable -Port $FrontendPort)) {
            Write-Host "❌ 前端端口 $FrontendPort 已被占用" -ForegroundColor Red
            Write-Host "请使用其他端口或停止占用该端口的程序" -ForegroundColor Yellow
            exit 1
        }
        
        # 检查必要的脚本文件
        $requiredScripts = @(
            "scripts\start_backend.ps1",
            "scripts\start_frontend.ps1"
        )
        
        foreach ($script in $requiredScripts) {
            if (-not (Test-Path $script)) {
                Write-Host "❌ 未找到必需的脚本: $script" -ForegroundColor Red
                exit 1
            }
        }
        
        # 启动后端
        Write-Host "🔧 启动后端服务..." -ForegroundColor Cyan
        $backendArgs = @(
            "-Host", $BackendHost,
            "-Port", $BackendPort
        )
        
        if ($Production) {
            $backendArgs += "-Production"
        }
        
        $backendJob = Start-Job -Name "BackendServer" -ScriptBlock {
            param($ScriptPath, $Args)
            & $ScriptPath @Args
        } -ArgumentList (Resolve-Path "scripts\start_backend.ps1"), $backendArgs
        
        # 等待后端启动
        Write-Host "⏳ 等待后端启动 ($DelaySeconds 秒)..." -ForegroundColor Yellow
        Start-Sleep -Seconds $DelaySeconds
        
        # 检查后端是否成功启动
        $backendRunning = $false
        for ($i = 0; $i -lt 10; $i++) {
            try {
                $response = Invoke-WebRequest -Uri "http://${BackendHost}:${BackendPort}/api/" -TimeoutSec 2 -UseBasicParsing
                if ($response.StatusCode -eq 200) {
                    $backendRunning = $true
                    break
                }
            } catch {
                Start-Sleep -Seconds 1
            }
        }
        
        if (-not $backendRunning) {
            Write-Host "⚠️  警告: 后端可能未正常启动，继续启动前端..." -ForegroundColor Yellow
        } else {
            Write-Host "✅ 后端启动成功" -ForegroundColor Green
        }
        
        # 启动前端
        Write-Host "🎨 启动前端服务..." -ForegroundColor Cyan
        $frontendArgs = @(
            "-Host", $FrontendHost,
            "-Port", $FrontendPort
        )
        
        if ($Production) {
            $frontendArgs += "-Build"
        }
        
        $frontendJob = Start-Job -Name "FrontendServer" -ScriptBlock {
            param($ScriptPath, $Args)
            & $ScriptPath @Args
        } -ArgumentList (Resolve-Path "scripts\start_frontend.ps1"), $frontendArgs
        
        # 显示访问信息
        Write-Host ""
        Write-Host "🎉 系统启动完成！" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Blue
        Write-Host "📱 前端应用: http://${FrontendHost}:${FrontendPort}" -ForegroundColor Cyan
        Write-Host "🔧 后端 API: http://${BackendHost}:${BackendPort}/api/" -ForegroundColor Cyan
        Write-Host "⚙️  管理后台: http://${BackendHost}:${BackendPort}/admin/" -ForegroundColor Cyan
        
        if ($Production) {
            Write-Host ""
            Write-Host "🚀 生产模式运行中" -ForegroundColor Yellow
        } else {
            Write-Host ""
            Write-Host "🔥 开发模式运行中" -ForegroundColor Yellow
            Write-Host "🔄 支持热重载" -ForegroundColor Cyan
        }
        
        Write-Host ""
        Write-Host "🛑 按 Ctrl+C 停止所有服务" -ForegroundColor Yellow
        Write-Host "========================================" -ForegroundColor Blue
        
        # 监控作业状态
        Write-Host "📊 服务监控 (每30秒更新一次):`n" -ForegroundColor Magenta
        
        while ($true) {
            # 检查作业状态
            $backendStatus = Get-Job -Name "BackendServer" -ErrorAction SilentlyContinue
            $frontendStatus = Get-Job -Name "FrontendServer" -ErrorAction SilentlyContinue
            
            $timestamp = Get-Date -Format "HH:mm:ss"
            Write-Host "[$timestamp] " -ForegroundColor Gray -NoNewline
            
            if ($backendStatus -and $backendStatus.State -eq "Running") {
                Write-Host "后端: " -ForegroundColor White -NoNewline
                Write-Host "运行中 " -ForegroundColor Green -NoNewline
            } else {
                Write-Host "后端: " -ForegroundColor White -NoNewline
                Write-Host "已停止 " -ForegroundColor Red -NoNewline
            }
            
            Write-Host "| " -ForegroundColor Gray -NoNewline
            
            if ($frontendStatus -and $frontendStatus.State -eq "Running") {
                Write-Host "前端: " -ForegroundColor White -NoNewline
                Write-Host "运行中" -ForegroundColor Green
            } else {
                Write-Host "前端: " -ForegroundColor White -NoNewline
                Write-Host "已停止" -ForegroundColor Red
            }
            
            # 如果任一服务停止，退出监控
            if ((-not $backendStatus -or $backendStatus.State -ne "Running") -or 
                (-not $frontendStatus -or $frontendStatus.State -ne "Running")) {
                Write-Host ""
                Write-Host "⚠️  检测到服务停止，退出监控..." -ForegroundColor Yellow
                break
            }
            
            Start-Sleep -Seconds 30
        }
        
    } catch {
        Write-Host ""
        Write-Host "❌ 启动失败: $($_.Exception.Message)" -ForegroundColor Red
        Stop-Services
        exit 1
    } finally {
        # 显示作业输出（如果有错误）
        Get-Job | Where-Object { $_.Name -like "Backend*" -or $_.Name -like "Frontend*" } | ForEach-Object {
            if ($_.State -eq "Failed") {
                Write-Host "`n❌ $($_.Name) 执行失败:" -ForegroundColor Red
                Receive-Job $_ | Write-Host -ForegroundColor Red
            }
        }
        
        Stop-Services
    }
}

# 捕获 Ctrl+C
trap {
    Write-Host "`n`n🛑 收到停止信号..." -ForegroundColor Yellow
    Stop-Services
    exit 0
}

# 运行主函数
Main 