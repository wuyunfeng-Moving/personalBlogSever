# 个人博客系统 - Windows 健康检查脚本

param(
    [switch]$AutoFix,
    [switch]$Report,
    [switch]$QuickFix,
    [switch]$Help
)

# 配置
$LogFile = "logs\health_check.log"
$AlertEmail = "admin@yourdomain.com"
$ApiUrl = "http://localhost:8000/api/v1/posts/"
$FrontendUrl = "http://localhost:5173"

# 确保日志目录存在
if (-not (Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" | Out-Null
}

# 日志函数
function Write-LogMessage {
    param(
        [string]$Level,
        [string]$Message
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "$timestamp [$Level] $Message"
    Write-Host $logEntry
    $logEntry | Add-Content -Path $LogFile -Encoding UTF8
}

function Write-LogInfo {
    param([string]$Message)
    Write-LogMessage "INFO" "✓ $Message"
}

function Write-LogWarn {
    param([string]$Message)
    Write-Host "⚠️ $Message" -ForegroundColor Yellow
    Write-LogMessage "WARN" "⚠ $Message"
}

function Write-LogError {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
    Write-LogMessage "ERROR" "✗ $Message"
}

function Write-Section {
    param([string]$Title)
    Write-Host "`n=== $Title ===" -ForegroundColor Blue
}

# 检查 Python 服务状态
function Test-PythonServices {
    Write-Section "检查 Python 服务状态"
    
    # 检查 Django 开发服务器
    $djangoProcess = Get-Process | Where-Object { $_.ProcessName -eq "python" -and $_.CommandLine -like "*manage.py*runserver*" }
    
    if ($djangoProcess) {
        Write-LogInfo "Django 开发服务器运行正常 (PID: $($djangoProcess.Id))"
    } else {
        Write-LogError "Django 开发服务器未运行"
        if ($AutoFix) {
            Write-LogInfo "尝试启动 Django 服务器..."
            Start-Process -FilePath "powershell" -ArgumentList "-File", "scripts\start_backend.ps1" -WindowStyle Hidden
            Start-Sleep -Seconds 3
            $newProcess = Get-Process | Where-Object { $_.ProcessName -eq "python" -and $_.CommandLine -like "*manage.py*runserver*" }
            if ($newProcess) {
                Write-LogInfo "Django 服务器启动成功"
            } else {
                Write-LogError "Django 服务器启动失败"
            }
        }
    }
}

# 检查 Node.js 服务状态
function Test-NodeServices {
    Write-Section "检查 Node.js 服务状态"
    
    # 检查 Vite 开发服务器
    $nodeProcess = Get-Process | Where-Object { $_.ProcessName -eq "node" -and $_.CommandLine -like "*vite*" }
    
    if ($nodeProcess) {
        Write-LogInfo "React 开发服务器运行正常 (PID: $($nodeProcess.Id))"
    } else {
        Write-LogError "React 开发服务器未运行"
        if ($AutoFix) {
            Write-LogInfo "尝试启动 React 服务器..."
            Start-Process -FilePath "powershell" -ArgumentList "-File", "scripts\start_frontend.ps1" -WindowStyle Hidden
            Start-Sleep -Seconds 3
            $newProcess = Get-Process | Where-Object { $_.ProcessName -eq "node" -and $_.CommandLine -like "*vite*" }
            if ($newProcess) {
                Write-LogInfo "React 服务器启动成功"
            } else {
                Write-LogError "React 服务器启动失败"
            }
        }
    }
}

# 检查端口状态
function Test-Ports {
    Write-Section "检查端口状态"
    
    $ports = @{
        "8000" = "Django API"
        "5173" = "React 开发服务器"
    }
    
    foreach ($port in $ports.Keys) {
        $service = $ports[$port]
        $connection = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        
        if ($connection) {
            Write-LogInfo "$service 端口 $port 开放"
        } else {
            Write-LogWarn "$service 端口 $port 未开放或未监听"
        }
    }
}

# 检查磁盘空间
function Test-DiskSpace {
    Write-Section "检查磁盘空间"
    
    $drives = Get-WmiObject -Class Win32_LogicalDisk | Where-Object { $_.DriveType -eq 3 }
    
    foreach ($drive in $drives) {
        $usedPercent = [math]::Round(($drive.Size - $drive.FreeSpace) / $drive.Size * 100, 1)
        $freeGB = [math]::Round($drive.FreeSpace / 1GB, 1)
        
        if ($usedPercent -ge 90) {
            Write-LogError "磁盘使用率过高: $($drive.DeviceID) ($usedPercent%, 剩余: ${freeGB}GB)"
        } elseif ($usedPercent -ge 80) {
            Write-LogWarn "磁盘使用率较高: $($drive.DeviceID) ($usedPercent%, 剩余: ${freeGB}GB)"
        } else {
            Write-LogInfo "磁盘空间正常: $($drive.DeviceID) ($usedPercent%, 剩余: ${freeGB}GB)"
        }
    }
}

# 检查内存使用率
function Test-Memory {
    Write-Section "检查内存使用率"
    
    $memory = Get-WmiObject -Class Win32_OperatingSystem
    $totalMemory = $memory.TotalVisibleMemorySize
    $freeMemory = $memory.FreePhysicalMemory
    $usedMemory = $totalMemory - $freeMemory
    $usagePercent = [math]::Round($usedMemory / $totalMemory * 100, 1)
    
    if ($usagePercent -ge 90) {
        Write-LogError "内存使用率过高: $usagePercent%"
    } elseif ($usagePercent -ge 80) {
        Write-LogWarn "内存使用率较高: $usagePercent%"
    } else {
        Write-LogInfo "内存使用率正常: $usagePercent%"
    }
}

# 检查 CPU 使用率
function Test-CPU {
    Write-Section "检查 CPU 使用率"
    
    $cpu = Get-WmiObject -Class Win32_Processor | Measure-Object -Property LoadPercentage -Average
    $cpuUsage = $cpu.Average
    
    if ($cpuUsage -ge 80) {
        Write-LogError "CPU 使用率过高: $cpuUsage%"
    } elseif ($cpuUsage -ge 60) {
        Write-LogWarn "CPU 使用率较高: $cpuUsage%"
    } else {
        Write-LogInfo "CPU 使用率正常: $cpuUsage%"
    }
}

# 检查数据库连接
function Test-Database {
    Write-Section "检查数据库连接"
    
    try {
        if (Test-Path "recipeServerPython\db.sqlite3") {
            $dbSize = (Get-Item "recipeServerPython\db.sqlite3").Length
            $dbSizeMB = [math]::Round($dbSize / 1MB, 2)
            Write-LogInfo "SQLite 数据库连接正常，大小: ${dbSizeMB}MB"
        } else {
            Write-LogWarn "未找到 SQLite 数据库文件"
        }
    } catch {
        Write-LogError "数据库检查失败: $($_.Exception.Message)"
    }
}

# 检查 API 响应
function Test-API {
    Write-Section "检查 API 响应"
    
    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-WebRequest -Uri $ApiUrl -Method GET -TimeoutSec 10
        $stopwatch.Stop()
        $responseTime = $stopwatch.Elapsed.TotalSeconds
        
        if ($response.StatusCode -eq 200) {
            Write-LogInfo "API 响应正常 (HTTP $($response.StatusCode))"
            
            if ($responseTime -gt 3.0) {
                Write-LogWarn "API 响应时间较慢: $($responseTime.ToString('F2'))s"
            } else {
                Write-LogInfo "API 响应时间: $($responseTime.ToString('F2'))s"
            }
        } else {
            Write-LogError "API 响应异常 (HTTP $($response.StatusCode))"
        }
    } catch {
        Write-LogError "无法连接到 API 服务: $($_.Exception.Message)"
    }
}

# 检查虚拟环境
function Test-VirtualEnvironment {
    Write-Section "检查 Python 虚拟环境"
    
    if (Test-Path "recipeServerPython\venv") {
        Write-LogInfo "Python 虚拟环境存在"
        
        if (Test-Path "recipeServerPython\venv\Scripts\python.exe") {
            Write-LogInfo "虚拟环境 Python 解释器正常"
        } else {
            Write-LogError "虚拟环境 Python 解释器缺失"
        }
    } else {
        Write-LogError "Python 虚拟环境不存在"
    }
}

# 检查依赖包
function Test-Dependencies {
    Write-Section "检查依赖包"
    
    # 检查 Python 依赖
    if (Test-Path "recipeServerPython\requirements.txt") {
        Write-LogInfo "Python requirements.txt 文件存在"
    } else {
        Write-LogError "Python requirements.txt 文件缺失"
    }
    
    # 检查 Node.js 依赖
    if (Test-Path "recipeServerWeb\package.json") {
        Write-LogInfo "Node.js package.json 文件存在"
        
        if (Test-Path "recipeServerWeb\node_modules") {
            Write-LogInfo "Node.js 依赖包已安装"
        } else {
            Write-LogWarn "Node.js 依赖包未安装"
        }
    } else {
        Write-LogError "Node.js package.json 文件缺失"
    }
}

# 检查日志文件
function Test-LogFiles {
    Write-Section "检查日志文件"
    
    if (Test-Path "logs") {
        $logFiles = Get-ChildItem -Path "logs" -Filter "*.log"
        Write-LogInfo "找到 $($logFiles.Count) 个日志文件"
        
        foreach ($logFile in $logFiles) {
            $sizeMB = [math]::Round($logFile.Length / 1MB, 2)
            if ($sizeMB -gt 100) {
                Write-LogWarn "日志文件过大: $($logFile.Name) (${sizeMB}MB)"
            }
        }
    } else {
        Write-LogWarn "日志目录不存在"
    }
}

# 性能统计
function Show-PerformanceStats {
    Write-Section "性能统计"
    
    # 系统运行时间
    $uptime = (Get-Date) - (Get-CimInstance -ClassName Win32_OperatingSystem).LastBootUpTime
    Write-LogInfo "系统运行时间: $($uptime.Days) 天 $($uptime.Hours) 小时 $($uptime.Minutes) 分钟"
    
    # 进程数量
    $processCount = (Get-Process).Count
    Write-LogInfo "当前运行进程数: $processCount"
    
    # Python 进程数
    $pythonProcesses = (Get-Process | Where-Object { $_.ProcessName -eq "python" }).Count
    Write-LogInfo "Python 进程数: $pythonProcesses"
    
    # Node.js 进程数
    $nodeProcesses = (Get-Process | Where-Object { $_.ProcessName -eq "node" }).Count
    Write-LogInfo "Node.js 进程数: $nodeProcesses"
}

# 快速修复
function Invoke-QuickFix {
    Write-Section "执行快速修复"
    
    # 清理大日志文件
    $logFiles = Get-ChildItem -Path "logs" -Filter "*.log" | Where-Object { $_.Length -gt 100MB }
    foreach ($logFile in $logFiles) {
        Write-LogInfo "清理大日志文件: $($logFile.Name)"
        Clear-Content -Path $logFile.FullName
    }
    
    # 重启有问题的服务
    $djangoProcess = Get-Process | Where-Object { $_.ProcessName -eq "python" -and $_.CommandLine -like "*manage.py*runserver*" }
    if (-not $djangoProcess) {
        Write-LogInfo "重启 Django 服务..."
        Start-Process -FilePath "powershell" -ArgumentList "-File", "scripts\start_backend.ps1" -WindowStyle Hidden
    }
    
    $nodeProcess = Get-Process | Where-Object { $_.ProcessName -eq "node" -and $_.CommandLine -like "*vite*" }
    if (-not $nodeProcess) {
        Write-LogInfo "重启 React 服务..."
        Start-Process -FilePath "powershell" -ArgumentList "-File", "scripts\start_frontend.ps1" -WindowStyle Hidden
    }
    
    Write-LogInfo "快速修复完成"
}

# 生成报告
function New-HealthReport {
    Write-Section "生成健康检查报告"
    
    $reportFile = "logs\health_report_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"
    
    $reportContent = @"
个人博客系统健康检查报告
生成时间: $(Get-Date)
==================================

系统信息:
  操作系统: $(Get-WmiObject -Class Win32_OperatingSystem).Caption
  计算机名: $env:COMPUTERNAME
  用户名: $env:USERNAME
  PowerShell 版本: $($PSVersionTable.PSVersion)

"@
    
    # 添加最近的日志内容
    if (Test-Path $LogFile) {
        $reportContent += "`n最近的健康检查日志:`n"
        $reportContent += "=================================="
        $reportContent += "`n"
        $reportContent += (Get-Content $LogFile -Tail 50 | Out-String)
    }
    
    $reportContent | Out-File -FilePath $reportFile -Encoding UTF8
    Write-LogInfo "健康检查报告已生成: $reportFile"
}

# 显示帮助
function Show-Help {
    Write-Host "个人博客系统健康检查脚本" -ForegroundColor Blue
    Write-Host ""
    Write-Host "用法: .\scripts\health_check.ps1 [选项]" -ForegroundColor White
    Write-Host ""
    Write-Host "选项:" -ForegroundColor Yellow
    Write-Host "  -AutoFix     自动修复发现的问题" -ForegroundColor White
    Write-Host "  -Report      生成详细报告" -ForegroundColor White
    Write-Host "  -QuickFix    执行快速修复" -ForegroundColor White
    Write-Host "  -Help        显示此帮助信息" -ForegroundColor White
    Write-Host ""
    Write-Host "示例:" -ForegroundColor Yellow
    Write-Host "  .\scripts\health_check.ps1                    # 执行基本健康检查" -ForegroundColor White
    Write-Host "  .\scripts\health_check.ps1 -AutoFix           # 检查并自动修复问题" -ForegroundColor White
    Write-Host "  .\scripts\health_check.ps1 -Report            # 生成详细报告" -ForegroundColor White
    Write-Host "  .\scripts\health_check.ps1 -QuickFix          # 执行快速修复" -ForegroundColor White
}

# 主函数
function Main {
    if ($Help) {
        Show-Help
        return
    }
    
    if ($QuickFix) {
        Invoke-QuickFix
        return
    }
    
    Write-Host "个人博客系统健康检查" -ForegroundColor Blue
    Write-Host "检查时间: $(Get-Date)" -ForegroundColor White
    Write-Host "========================================" -ForegroundColor Blue
    
    try {
        # 执行所有检查
        Test-PythonServices
        Test-NodeServices
        Test-Ports
        Test-DiskSpace
        Test-Memory
        Test-CPU
        Test-Database
        Test-API
        Test-VirtualEnvironment
        Test-Dependencies
        Test-LogFiles
        Show-PerformanceStats
        
        # 生成报告
        if ($Report) {
            New-HealthReport
        }
        
        Write-Host ""
        Write-Section "健康检查完成"
        Write-LogInfo "详细日志保存在: $LogFile"
        
        # 检查是否有错误需要警报
        if (Select-String -Path $LogFile -Pattern "ERROR" -Quiet) {
            $errorCount = (Select-String -Path $LogFile -Pattern "ERROR").Count
            Write-LogWarn "发现 $errorCount 个错误，请检查系统状态"
        }
        
    } catch {
        Write-LogError "健康检查过程中发生错误: $($_.Exception.Message)"
    }
}

# 运行主函数
Main 