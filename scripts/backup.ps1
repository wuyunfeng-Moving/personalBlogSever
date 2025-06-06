# 个人博客系统 - Windows 备份脚本

param(
    [string]$BackupPath = "backup",
    [switch]$AutoCleanup,
    [int]$RetentionDays = 7,
    [switch]$IncludeVenv,
    [switch]$Verbose,
    [switch]$Help
)

# 配置
$LogFile = "logs\backup.log"

# 确保目录存在
function Ensure-Directory {
    param([string]$Path)
    if (-not (Test-Path $Path)) {
        New-Item -ItemType Directory -Path $Path -Force | Out-Null
    }
}

# 日志函数
function Write-BackupLog {
    param(
        [string]$Level,
        [string]$Message
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "$timestamp [$Level] $Message"
    
    if ($Verbose -or $Level -eq "ERROR") {
        Write-Host $logEntry -ForegroundColor $(
            switch ($Level) {
                "INFO" { "Green" }
                "WARN" { "Yellow" }
                "ERROR" { "Red" }
                default { "White" }
            }
        )
    }
    
    Ensure-Directory (Split-Path $LogFile -Parent)
    $logEntry | Add-Content -Path $LogFile -Encoding UTF8
}

# 备份数据库
function Backup-Database {
    param([string]$BackupDir)
    
    Write-BackupLog "INFO" "开始备份数据库..."
    
    $dbPath = "recipeServerPython\db.sqlite3"
    if (Test-Path $dbPath) {
        $backupFileName = "db_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sqlite3"
        $backupDbPath = Join-Path $BackupDir $backupFileName
        
        try {
            Copy-Item $dbPath $backupDbPath -Force
            $dbSize = (Get-Item $backupDbPath).Length
            $dbSizeMB = [math]::Round($dbSize / 1MB, 2)
            Write-BackupLog "INFO" "数据库备份成功: $backupFileName (${dbSizeMB}MB)"
            return $backupDbPath
        } catch {
            Write-BackupLog "ERROR" "数据库备份失败: $($_.Exception.Message)"
            return $null
        }
    } else {
        Write-BackupLog "WARN" "未找到 SQLite 数据库文件"
        return $null
    }
}

# 备份媒体文件
function Backup-MediaFiles {
    param([string]$BackupDir)
    
    Write-BackupLog "INFO" "开始备份媒体文件..."
    
    $mediaPath = "recipeServerPython\media"
    if (Test-Path $mediaPath) {
        $backupFileName = "media_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').zip"
        $backupMediaPath = Join-Path $BackupDir $backupFileName
        
        try {
            # 使用 PowerShell 5.0+ 的 Compress-Archive
            Compress-Archive -Path "$mediaPath\*" -DestinationPath $backupMediaPath -Force
            $mediaSize = (Get-Item $backupMediaPath).Length
            $mediaSizeMB = [math]::Round($mediaSize / 1MB, 2)
            Write-BackupLog "INFO" "媒体文件备份成功: $backupFileName (${mediaSizeMB}MB)"
            return $backupMediaPath
        } catch {
            Write-BackupLog "ERROR" "媒体文件备份失败: $($_.Exception.Message)"
            return $null
        }
    } else {
        Write-BackupLog "WARN" "未找到媒体文件目录"
        return $null
    }
}

# 备份静态文件
function Backup-StaticFiles {
    param([string]$BackupDir)
    
    Write-BackupLog "INFO" "开始备份静态文件..."
    
    $staticPath = "recipeServerPython\static"
    if (Test-Path $staticPath) {
        $backupFileName = "static_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').zip"
        $backupStaticPath = Join-Path $BackupDir $backupFileName
        
        try {
            Compress-Archive -Path "$staticPath\*" -DestinationPath $backupStaticPath -Force
            $staticSize = (Get-Item $backupStaticPath).Length
            $staticSizeMB = [math]::Round($staticSize / 1MB, 2)
            Write-BackupLog "INFO" "静态文件备份成功: $backupFileName (${staticSizeMB}MB)"
            return $backupStaticPath
        } catch {
            Write-BackupLog "ERROR" "静态文件备份失败: $($_.Exception.Message)"
            return $null
        }
    } else {
        Write-BackupLog "WARN" "未找到静态文件目录"
        return $null
    }
}

# 备份配置文件
function Backup-ConfigFiles {
    param([string]$BackupDir)
    
    Write-BackupLog "INFO" "开始备份配置文件..."
    
    $configFiles = @(
        "recipeServerPython\.env",
        "recipeServerWeb\.env",
        "recipeServerWeb\package.json",
        "recipeServerPython\requirements.txt",
        ".gitignore",
        "docker-compose.yml"
    )
    
    $configBackupDir = Join-Path $BackupDir "config_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Ensure-Directory $configBackupDir
    
    $backedUpFiles = 0
    foreach ($configFile in $configFiles) {
        if (Test-Path $configFile) {
            try {
                $fileName = Split-Path $configFile -Leaf
                $destPath = Join-Path $configBackupDir $fileName
                Copy-Item $configFile $destPath -Force
                $backedUpFiles++
                Write-BackupLog "INFO" "配置文件备份: $fileName"
            } catch {
                Write-BackupLog "ERROR" "配置文件备份失败 $configFile : $($_.Exception.Message)"
            }
        }
    }
    
    if ($backedUpFiles -gt 0) {
        # 压缩配置文件目录
        $configZipPath = "$configBackupDir.zip"
        try {
            Compress-Archive -Path "$configBackupDir\*" -DestinationPath $configZipPath -Force
            Remove-Item $configBackupDir -Recurse -Force
            Write-BackupLog "INFO" "配置文件备份完成: $(Split-Path $configZipPath -Leaf) ($backedUpFiles 个文件)"
            return $configZipPath
        } catch {
            Write-BackupLog "ERROR" "配置文件压缩失败: $($_.Exception.Message)"
            return $null
        }
    } else {
        Write-BackupLog "WARN" "没有找到需要备份的配置文件"
        Remove-Item $configBackupDir -Recurse -Force -ErrorAction SilentlyContinue
        return $null
    }
}

# 备份虚拟环境信息
function Backup-VenvInfo {
    param([string]$BackupDir)
    
    Write-BackupLog "INFO" "开始备份虚拟环境信息..."
    
    $venvInfoFile = Join-Path $BackupDir "venv_info_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"
    
    try {
        $venvInfo = @"
虚拟环境信息备份
生成时间: $(Get-Date)
================================

Python 版本:
$(python --version 2>&1)

已安装的 Python 包:
"@
        
        # 如果虚拟环境存在，激活并获取包列表
        if (Test-Path "recipeServerPython\venv") {
            Push-Location "recipeServerPython"
            try {
                & "venv\Scripts\Activate.ps1"
                $packages = pip list 2>&1 | Out-String
                $venvInfo += "`n$packages"
                deactivate 2>$null
            } catch {
                $venvInfo += "`n获取包列表失败: $($_.Exception.Message)"
            } finally {
                Pop-Location
            }
        } else {
            $venvInfo += "`n未找到虚拟环境"
        }
        
        $venvInfo += @"

Node.js 版本:
$(node --version 2>&1)

npm 版本:
$(npm --version 2>&1)
"@
        
        $venvInfo | Out-File -FilePath $venvInfoFile -Encoding UTF8
        Write-BackupLog "INFO" "虚拟环境信息备份成功: $(Split-Path $venvInfoFile -Leaf)"
        return $venvInfoFile
    } catch {
        Write-BackupLog "ERROR" "虚拟环境信息备份失败: $($_.Exception.Message)"
        return $null
    }
}

# 清理旧备份
function Remove-OldBackups {
    param(
        [string]$BackupDir,
        [int]$RetentionDays
    )
    
    Write-BackupLog "INFO" "开始清理 $RetentionDays 天前的旧备份..."
    
    $cutoffDate = (Get-Date).AddDays(-$RetentionDays)
    $oldFiles = Get-ChildItem $BackupDir | Where-Object { 
        $_.LastWriteTime -lt $cutoffDate -and 
        ($_.Name -like "*backup*" -or $_.Name -like "*config_*" -or $_.Name -like "*venv_info*")
    }
    
    $removedCount = 0
    $freedSpace = 0
    
    foreach ($file in $oldFiles) {
        try {
            $fileSize = $file.Length
            Remove-Item $file.FullName -Force
            $removedCount++
            $freedSpace += $fileSize
            Write-BackupLog "INFO" "删除旧备份: $($file.Name)"
        } catch {
            Write-BackupLog "ERROR" "删除旧备份失败 $($file.Name): $($_.Exception.Message)"
        }
    }
    
    if ($removedCount -gt 0) {
        $freedSpaceMB = [math]::Round($freedSpace / 1MB, 2)
        Write-BackupLog "INFO" "清理完成: 删除 $removedCount 个文件，释放 ${freedSpaceMB}MB 空间"
    } else {
        Write-BackupLog "INFO" "没有需要清理的旧备份"
    }
}

# 创建备份摘要
function New-BackupSummary {
    param(
        [string]$BackupDir,
        [array]$BackupFiles
    )
    
    $summaryFile = Join-Path $BackupDir "backup_summary_$(Get-Date -Format 'yyyyMMdd_HHmmss').txt"
    
    $summary = @"
个人博客系统备份摘要
备份时间: $(Get-Date)
================================

备份文件列表:
"@
    
    $totalSize = 0
    foreach ($file in $BackupFiles) {
        if ($file -and (Test-Path $file)) {
            $fileInfo = Get-Item $file
            $fileSizeMB = [math]::Round($fileInfo.Length / 1MB, 2)
            $totalSize += $fileInfo.Length
            $summary += "`n  - $($fileInfo.Name) (${fileSizeMB}MB)"
        }
    }
    
    $totalSizeMB = [math]::Round($totalSize / 1MB, 2)
    $summary += "`n`n总备份大小: ${totalSizeMB}MB"
    $summary += "`n备份位置: $BackupDir"
    
    # 添加系统信息
    $summary += @"

系统信息:
  计算机名: $env:COMPUTERNAME
  用户名: $env:USERNAME
  操作系统: $((Get-WmiObject Win32_OperatingSystem).Caption)
  PowerShell 版本: $($PSVersionTable.PSVersion)
"@
    
    try {
        $summary | Out-File -FilePath $summaryFile -Encoding UTF8
        Write-BackupLog "INFO" "备份摘要已生成: $(Split-Path $summaryFile -Leaf)"
    } catch {
        Write-BackupLog "ERROR" "生成备份摘要失败: $($_.Exception.Message)"
    }
}

# 显示帮助
function Show-Help {
    Write-Host "个人博客系统备份脚本" -ForegroundColor Blue
    Write-Host ""
    Write-Host "用法: .\scripts\backup.ps1 [选项]" -ForegroundColor White
    Write-Host ""
    Write-Host "选项:" -ForegroundColor Yellow
    Write-Host "  -BackupPath <路径>    指定备份目录 (默认: backup)" -ForegroundColor White
    Write-Host "  -AutoCleanup          自动清理旧备份" -ForegroundColor White
    Write-Host "  -RetentionDays <天数> 保留备份的天数 (默认: 7)" -ForegroundColor White
    Write-Host "  -IncludeVenv          包含虚拟环境目录 (谨慎使用)" -ForegroundColor White
    Write-Host "  -Verbose              显示详细信息" -ForegroundColor White
    Write-Host "  -Help                 显示此帮助信息" -ForegroundColor White
    Write-Host ""
    Write-Host "示例:" -ForegroundColor Yellow
    Write-Host "  .\scripts\backup.ps1                         # 基本备份" -ForegroundColor White
    Write-Host "  .\scripts\backup.ps1 -Verbose -AutoCleanup   # 详细输出并自动清理" -ForegroundColor White
    Write-Host "  .\scripts\backup.ps1 -BackupPath D:\backups  # 指定备份路径" -ForegroundColor White
    Write-Host ""
    Write-Host "备份内容:" -ForegroundColor Yellow
    Write-Host "  - SQLite 数据库文件" -ForegroundColor White
    Write-Host "  - 媒体文件 (media/)" -ForegroundColor White
    Write-Host "  - 静态文件 (static/)" -ForegroundColor White
    Write-Host "  - 配置文件 (.env, package.json 等)" -ForegroundColor White
    Write-Host "  - 虚拟环境信息" -ForegroundColor White
}

# 主函数
function Main {
    if ($Help) {
        Show-Help
        return
    }
    
    Write-Host "个人博客系统备份工具" -ForegroundColor Blue
    Write-Host "开始时间: $(Get-Date)" -ForegroundColor White
    Write-Host "========================================" -ForegroundColor Blue
    
    try {
        # 确保备份目录存在
        Ensure-Directory $BackupPath
        Write-BackupLog "INFO" "备份开始，目标目录: $BackupPath"
        
        # 执行各项备份
        $backupFiles = @()
        
        # 备份数据库
        $dbBackup = Backup-Database $BackupPath
        if ($dbBackup) { $backupFiles += $dbBackup }
        
        # 备份媒体文件
        $mediaBackup = Backup-MediaFiles $BackupPath
        if ($mediaBackup) { $backupFiles += $mediaBackup }
        
        # 备份静态文件
        $staticBackup = Backup-StaticFiles $BackupPath
        if ($staticBackup) { $backupFiles += $staticBackup }
        
        # 备份配置文件
        $configBackup = Backup-ConfigFiles $BackupPath
        if ($configBackup) { $backupFiles += $configBackup }
        
        # 备份虚拟环境信息
        $venvInfoBackup = Backup-VenvInfo $BackupPath
        if ($venvInfoBackup) { $backupFiles += $venvInfoBackup }
        
        # 生成备份摘要
        New-BackupSummary $BackupPath $backupFiles
        
        # 清理旧备份
        if ($AutoCleanup) {
            Remove-OldBackups $BackupPath $RetentionDays
        }
        
        Write-BackupLog "INFO" "备份完成"
        Write-Host "`n🎉 备份完成!" -ForegroundColor Green
        Write-Host "📁 备份位置: $BackupPath" -ForegroundColor Cyan
        Write-Host "📝 备份日志: $LogFile" -ForegroundColor Cyan
        
        if ($backupFiles.Count -gt 0) {
            Write-Host "`n📦 备份文件:" -ForegroundColor Yellow
            foreach ($file in $backupFiles) {
                if ($file -and (Test-Path $file)) {
                    $fileInfo = Get-Item $file
                    $fileSizeMB = [math]::Round($fileInfo.Length / 1MB, 2)
                    Write-Host "   - $($fileInfo.Name) (${fileSizeMB}MB)" -ForegroundColor White
                }
            }
        }
        
    } catch {
        Write-BackupLog "ERROR" "备份过程中发生错误: $($_.Exception.Message)"
        Write-Host "`n❌ 备份失败: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# 运行主函数
Main 