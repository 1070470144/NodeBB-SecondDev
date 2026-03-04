# NodeBB 本地开发一键启动脚本 (Windows PowerShell)
# 使用方法: .\dev-start.ps1 [选项]
# 选项:
#   --docker     使用 Docker Compose 启动数据库服务
#   --mongo      使用 MongoDB (需要 Docker)
#   --postgres   使用 PostgreSQL (需要 Docker)
#   --local      使用本地已安装的数据库（不启动 Docker）

param(
    [switch]$Docker = $false,
    [switch]$Mongo = $false,
    [switch]$Postgres = $false,
    [switch]$Local = $false
)

$ErrorActionPreference = "Stop"

# 确保脚本始终在项目根目录运行（避免从其它目录执行导致找不到 package.json/node_modules）
Set-Location -LiteralPath $PSScriptRoot

# 尽量使用 UTF-8 输出，避免中文/符号在 Windows PowerShell 下乱码
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}
try { $OutputEncoding = [System.Text.Encoding]::UTF8 } catch {}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  NodeBB 本地开发环境启动脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Node.js 版本
Write-Host "[1/5] 检查 Node.js 版本..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    $nodeMajorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    Write-Host "  检测到 Node.js 版本: $nodeVersion" -ForegroundColor Green
    
    if ($nodeMajorVersion -lt 20) {
        Write-Host "  ❌ 错误: Node.js 版本必须 >= 20，当前版本: $nodeVersion" -ForegroundColor Red
        Write-Host "  请访问 https://nodejs.org/ 下载最新版本" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "  ❌ 错误: 未检测到 Node.js，请先安装 Node.js >= 20" -ForegroundColor Red
    Write-Host "  下载地址: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# 检查 npm
Write-Host "[2/5] 检查 npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "  检测到 npm 版本: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "  ❌ 错误: 未检测到 npm" -ForegroundColor Red
    exit 1
}

# 检查并安装依赖
Write-Host "[3/5] 检查项目依赖..." -ForegroundColor Yellow
if (-not (Test-Path "node_modules")) {
    Write-Host "  未找到 node_modules，开始安装依赖..." -ForegroundColor Yellow
    Write-Host "  这可能需要几分钟时间，请耐心等待..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ❌ 依赖安装失败，请检查错误信息" -ForegroundColor Red
        exit 1
    }
    Write-Host "  ✓ 依赖安装完成" -ForegroundColor Green
} else {
    Write-Host "  ✓ 依赖已存在" -ForegroundColor Green
}

# 处理数据库选项
$useDocker = $false
$dbType = ""

if ($Local) {
    Write-Host "[4/5] 使用本地数据库模式..." -ForegroundColor Yellow
    Write-Host "  请确保已配置好本地数据库连接（config.json）" -ForegroundColor Yellow
} elseif ($Docker -or $Mongo -or $Postgres) {
    $useDocker = $true
    
    # 检查 Docker 和 Docker Compose
    Write-Host "[4/5] 检查 Docker 环境..." -ForegroundColor Yellow

    function Ensure-DockerOnPath {
        # Docker Desktop 默认安装路径（Windows）
        $dockerBin = Join-Path $Env:ProgramFiles "Docker\Docker\resources\bin"
        if (Test-Path -LiteralPath $dockerBin) {
            $dockerExe = Join-Path $dockerBin "docker.exe"
            if (Test-Path -LiteralPath $dockerExe) {
                # 如果当前会话找不到 docker 命令，则临时加入 PATH（避免需要重开终端）
                if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
                    $env:PATH = "$dockerBin;$env:PATH"
                }
            }
        }
    }

    function Wait-DockerDaemon {
        param(
            [int]$TimeoutSeconds = 120
        )

        $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
        while ((Get-Date) -lt $deadline) {
            docker info *> $null
            if ($LASTEXITCODE -eq 0) { return $true }
            Start-Sleep -Seconds 2
        }
        return $false
    }

    function Start-DockerDesktopIfPresent {
        $exe = Join-Path $Env:ProgramFiles "Docker\Docker\Docker Desktop.exe"
        if (Test-Path -LiteralPath $exe) {
            try {
                Start-Process -FilePath $exe -WindowStyle Minimized | Out-Null
                return $true
            } catch {
                return $false
            }
        }
        return $false
    }

    Ensure-DockerOnPath
    try {
        $dockerVersion = docker --version
        Write-Host "  ✓ $dockerVersion" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ 错误: 未检测到 Docker，请先安装 Docker Desktop" -ForegroundColor Red
        Write-Host "  下载地址: https://www.docker.com/products/docker-desktop" -ForegroundColor Yellow
        exit 1
    }

    # 确保 Docker 守护进程已就绪（Docker Desktop 有时需要一些启动时间）
    if (-not (Wait-DockerDaemon -TimeoutSeconds 30)) {
        Write-Host "  Docker 守护进程未就绪，尝试启动 Docker Desktop..." -ForegroundColor Yellow
        Start-DockerDesktopIfPresent | Out-Null
        if (-not (Wait-DockerDaemon -TimeoutSeconds 120)) {
            Write-Host "  ❌ 错误: Docker 守护进程未启动或启动超时（请确认 Docker Desktop 已运行）" -ForegroundColor Red
            exit 1
        }
    }
    
    try {
        $dockerComposeVersion = docker compose version
        Write-Host "  ✓ Docker Compose 可用" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ 错误: Docker Compose 不可用" -ForegroundColor Red
        exit 1
    }
    
    # 确定数据库类型
    if ($Mongo) {
        $dbType = "mongo"
        Write-Host "  使用 MongoDB + Redis" -ForegroundColor Cyan
    } elseif ($Postgres) {
        $dbType = "postgres"
        Write-Host "  使用 PostgreSQL + Redis" -ForegroundColor Cyan
    } else {
        $dbType = "mongo"
        Write-Host "  默认使用 MongoDB + Redis" -ForegroundColor Cyan
    }
    
    # 启动数据库服务
    Write-Host "  启动数据库服务..." -ForegroundColor Yellow
    if ($dbType -eq "mongo") {
        docker compose -f docker-compose.yml up -d mongo redis
    } elseif ($dbType -eq "postgres") {
        docker compose -f docker-compose-pgsql.yml up -d postgres redis
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ❌ 错误: Docker Compose 启动数据库服务失败（请确认 Docker Desktop 已启动且当前用户有权限连接 Docker Engine）" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "  等待数据库服务就绪..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
    
    Write-Host "  ✓ 数据库服务已启动" -ForegroundColor Green
    Write-Host "  提示: 使用 'docker compose down' 停止数据库服务" -ForegroundColor Gray
} else {
    # 默认询问用户
    Write-Host "[4/5] 选择数据库模式..." -ForegroundColor Yellow
    Write-Host "  未指定数据库选项，将使用本地模式" -ForegroundColor Yellow
    Write-Host "  如需使用 Docker，请运行: .\dev-start.ps1 --docker" -ForegroundColor Gray
    Write-Host "  或指定数据库: .\dev-start.ps1 --mongo 或 .\dev-start.ps1 --postgres" -ForegroundColor Gray
}

# 检查配置文件
Write-Host "[5/5] 检查配置文件..." -ForegroundColor Yellow
if (-not (Test-Path "config.json")) {
    Write-Host "  ⚠ 未找到 config.json，NodeBB 将启动安装向导" -ForegroundColor Yellow
    Write-Host "  首次运行需要在浏览器中完成安装配置" -ForegroundColor Yellow
} else {
    Write-Host "  ✓ 配置文件已存在" -ForegroundColor Green
}

# 启动 NodeBB 开发模式
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  启动 NodeBB 开发服务器..." -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  访问地址: http://localhost:4567" -ForegroundColor Green
Write-Host "  按 Ctrl+C 停止服务器" -ForegroundColor Yellow
Write-Host ""

# 启动 NodeBB
node ./nodebb dev


