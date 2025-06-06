# 个人博客系统 - Windows 快速开始指南

## 🚀 简介

这是一个基于 Django + React 的现代化个人博客系统的 Windows 版本设置指南。

- **后端**: Django + Django REST Framework + PostgreSQL + Redis
- **前端**: React 18 + TypeScript + Vite + Tailwind CSS
- **平台**: Windows 10/11 + PowerShell

---

## 📋 系统要求

### 开发环境
- Windows 10/11
- PowerShell 5.1+ (推荐 PowerShell 7+)
- Python 3.8+
- Node.js 18+
- Git for Windows

### 可选工具
- [Chocolatey](https://chocolatey.org/) (包管理器)
- [Windows Terminal](https://aka.ms/terminal) (更好的终端体验)
- [VS Code](https://code.visualstudio.com/) (推荐编辑器)

---

## 🛠️ 环境准备

### 方式一：使用 Chocolatey 安装（推荐）

```powershell
# 首先安装 Chocolatey（以管理员身份运行 PowerShell）
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# 安装开发依赖
choco install python nodejs git -y

# 可选：安装其他有用工具
choco install vscode windows-terminal -y
```

### 方式二：手动安装

1. **Python 3.8+**: https://www.python.org/downloads/
2. **Node.js 18+**: https://nodejs.org/
3. **Git for Windows**: https://git-scm.com/download/win

### PowerShell 执行策略设置

```powershell
# 允许执行本地脚本（以管理员身份运行）
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope LocalMachine

# 或者仅为当前用户设置
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 🚀 快速开始

### 步骤 1：克隆项目

```powershell
# 克隆项目到本地
git clone <your-repository-url>
cd personalBlogSever
```

### 步骤 2：自动环境设置

```powershell
# 运行 PowerShell 版本的设置脚本
.\scripts\dev_setup.ps1

# 或者使用参数跳过某些步骤
.\scripts\dev_setup.ps1 -NoSampleData -NoSuperUser
```

### 步骤 3：启动开发环境

```powershell
# 方式 A: 分别启动前后端
.\scripts\start_backend.ps1   # 新开一个 PowerShell 窗口运行
.\scripts\start_frontend.ps1  # 再开一个 PowerShell 窗口运行

# 方式 B: 同时启动前后端
.\scripts\start_all.ps1
```

---

## 🌐 访问地址

开发环境启动后，可以通过以下地址访问：

- **前端应用**: http://localhost:5173
- **后端 API**: http://localhost:8000/api/v1
- **管理后台**: http://localhost:8000/admin

---

## 🔧 常用 PowerShell 命令

### 项目管理

```powershell
# 检查系统状态
.\scripts\health_check.ps1

# 自动修复问题
.\scripts\health_check.ps1 -AutoFix

# 生成状态报告
.\scripts\health_check.ps1 -Report

# 快速修复
.\scripts\health_check.ps1 -QuickFix
```

### 后端管理

```powershell
# 进入后端目录并激活虚拟环境
cd recipeServerPython
.\venv\Scripts\Activate.ps1

# Django 命令
python manage.py migrate                    # 应用数据库迁移
python manage.py createsuperuser            # 创建超级用户
python manage.py runserver                  # 启动开发服务器
python manage.py shell                      # Django shell
python manage.py collectstatic              # 收集静态文件
python manage.py create_sample_blog_data    # 创建示例数据

# 退出虚拟环境
deactivate
```

### 前端管理

```powershell
# 进入前端目录
cd recipeServerWeb

# npm 命令
npm run dev         # 启动开发服务器
npm run build       # 构建生产版本
npm run preview     # 预览构建结果
npm run type-check  # TypeScript 类型检查
npm run lint        # ESLint 检查
npm install         # 安装依赖
```

### 备份管理

```powershell
# 基本备份
.\scripts\backup.ps1

# 详细备份并自动清理
.\scripts\backup.ps1 -Verbose -AutoCleanup

# 指定备份路径
.\scripts\backup.ps1 -BackupPath "D:\backups"

# 显示备份帮助
.\scripts\backup.ps1 -Help
```

---

## 🛠️ 手动设置（如果自动脚本失败）

### 后端设置

```powershell
cd recipeServerPython

# 创建虚拟环境
python -m venv venv

# 激活虚拟环境
.\venv\Scripts\Activate.ps1

# 安装依赖
pip install -r requirements.txt

# 创建环境配置文件
Copy-Item .env.example .env
# 编辑 .env 文件设置数据库连接等

# 数据库迁移
python manage.py migrate

# 创建超级用户
python manage.py createsuperuser

# 启动开发服务器
python manage.py runserver
```

### 前端设置

```powershell
cd recipeServerWeb

# 安装依赖
npm install

# 创建环境配置文件
Copy-Item .env.example .env
# 编辑 .env 文件设置 API 地址等

# 启动开发服务器
npm run dev
```

---

## 🐛 故障排除

### 常见问题及解决方案

#### 1. PowerShell 执行策略错误

```powershell
# 错误: 无法执行脚本，因为在此系统上禁止运行脚本
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### 2. Python 虚拟环境激活失败

```powershell
# 如果 Activate.ps1 失败，尝试使用批处理文件
.\venv\Scripts\activate.bat

# 或者手动设置环境变量
$env:PATH = "$(Get-Location)\venv\Scripts;$env:PATH"
```

#### 3. 端口占用问题

```powershell
# 查看端口占用情况
netstat -ano | findstr :8000
netstat -ano | findstr :5173

# 杀死占用端口的进程
taskkill /PID <进程ID> /F
```

#### 4. 权限问题

```powershell
# 以管理员身份运行 PowerShell
# 或者修改文件权限
icacls "path\to\file" /grant Users:F
```

### 系统检查命令

```powershell
# 检查 Python 版本
python --version

# 检查 Node.js 版本
node --version

# 检查 npm 版本
npm --version

# 检查 Git 版本
git --version

# 检查 PowerShell 版本
$PSVersionTable.PSVersion
```

---

## 📚 Windows 特定配置

### 环境变量设置

```powershell
# 临时设置环境变量
$env:DJANGO_DEBUG = "True"
$env:NODE_ENV = "development"

# 永久设置环境变量（用户级别）
[Environment]::SetEnvironmentVariable("DJANGO_DEBUG", "True", "User")

# 查看环境变量
Get-ChildItem Env:
```

### 防火墙配置

```powershell
# 如果需要允许外部访问开发服务器
New-NetFirewallRule -DisplayName "Django Dev Server" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow
New-NetFirewallRule -DisplayName "React Dev Server" -Direction Inbound -Protocol TCP -LocalPort 5173 -Action Allow
```

### 任务计划配置

```powershell
# 创建定时备份任务
$action = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-File C:\path\to\personalBlogSever\scripts\backup.ps1 -AutoCleanup"
$trigger = New-ScheduledTaskTrigger -Daily -At "02:00"
Register-ScheduledTask -Action $action -Trigger $trigger -TaskName "BlogBackup" -Description "Daily blog backup"
```

---

## 🚀 性能优化

### PowerShell 性能

```powershell
# 使用 PowerShell 7+ 获得更好性能
winget install Microsoft.PowerShell

# 启用 PSReadLine 自动补全
Install-Module PSReadLine -Force
```

### 开发工具推荐

```powershell
# 安装有用的 PowerShell 模块
Install-Module posh-git -Force          # Git 集成
Install-Module Terminal-Icons -Force     # 文件图标
Install-Module PSFzf -Force             # 模糊搜索
```

---

## 📝 生产环境部署

Windows 环境下的生产部署建议：

1. **使用 Docker Desktop**：最简单的部署方式
2. **IIS + FastCGI**：与 Windows 生态系统集成
3. **云服务**：Azure、AWS、阿里云等

### Docker Desktop 部署

```powershell
# 安装 Docker Desktop for Windows
winget install Docker.DockerDesktop

# 使用 Docker Compose 部署
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🆘 获取帮助

### 脚本帮助

```powershell
# 查看脚本参数说明
Get-Help .\scripts\dev_setup.ps1 -Full
.\scripts\health_check.ps1 -Help
.\scripts\backup.ps1 -Help
```

### 常用资源

- [PowerShell 文档](https://docs.microsoft.com/zh-cn/powershell/)
- [Python on Windows](https://docs.python.org/3/using/windows.html)
- [Node.js on Windows](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

---

## 🎯 开发技巧

### PowerShell 配置文件

```powershell
# 编辑 PowerShell 配置文件
notepad $PROFILE

# 添加常用别名
Set-Alias ll Get-ChildItem
Set-Alias grep Select-String

# 添加项目快捷函数
function Start-BlogDev {
    Set-Location "C:\path\to\personalBlogSever"
    .\scripts\start_all.ps1
}
```

### VS Code 集成

安装推荐的 VS Code 扩展：
- Python
- PowerShell
- TypeScript and JavaScript Language Features
- ES7+ React/Redux/React-Native snippets

---

**祝你在 Windows 上开发愉快！** 🎉

> 💡 **提示**: 如果遇到问题，请首先运行 `.\scripts\health_check.ps1` 来诊断系统状态。 