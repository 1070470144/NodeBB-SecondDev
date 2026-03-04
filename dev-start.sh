#!/bin/bash
# NodeBB 本地开发一键启动脚本 (Linux/macOS)
# 使用方法: ./dev-start.sh [选项]
# 选项:
#   --docker     使用 Docker Compose 启动数据库服务
#   --mongo      使用 MongoDB (需要 Docker)
#   --postgres   使用 PostgreSQL (需要 Docker)
#   --local      使用本地已安装的数据库（不启动 Docker）

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# 解析参数
USE_DOCKER=false
DB_TYPE=""
LOCAL_MODE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --docker)
            USE_DOCKER=true
            DB_TYPE="mongo"
            shift
            ;;
        --mongo)
            USE_DOCKER=true
            DB_TYPE="mongo"
            shift
            ;;
        --postgres)
            USE_DOCKER=true
            DB_TYPE="postgres"
            shift
            ;;
        --local)
            LOCAL_MODE=true
            shift
            ;;
        *)
            echo -e "${RED}未知选项: $1${NC}"
            echo "使用方法: $0 [--docker|--mongo|--postgres|--local]"
            exit 1
            ;;
    esac
done

echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  NodeBB 本地开发环境启动脚本${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""

# 检查 Node.js 版本
echo -e "${YELLOW}[1/5] 检查 Node.js 版本...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}  ❌ 错误: 未检测到 Node.js，请先安装 Node.js >= 20${NC}"
    echo -e "${YELLOW}  下载地址: https://nodejs.org/${NC}"
    exit 1
fi

NODE_VERSION=$(node --version)
NODE_MAJOR_VERSION=$(echo $NODE_VERSION | sed 's/v\([0-9]*\).*/\1/')
echo -e "${GREEN}  检测到 Node.js 版本: $NODE_VERSION${NC}"

if [ "$NODE_MAJOR_VERSION" -lt 20 ]; then
    echo -e "${RED}  ❌ 错误: Node.js 版本必须 >= 20，当前版本: $NODE_VERSION${NC}"
    echo -e "${YELLOW}  请访问 https://nodejs.org/ 下载最新版本${NC}"
    exit 1
fi

# 检查 npm
echo -e "${YELLOW}[2/5] 检查 npm...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}  ❌ 错误: 未检测到 npm${NC}"
    exit 1
fi

NPM_VERSION=$(npm --version)
echo -e "${GREEN}  检测到 npm 版本: $NPM_VERSION${NC}"

# 检查并安装依赖
echo -e "${YELLOW}[3/5] 检查项目依赖...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}  未找到 node_modules，开始安装依赖...${NC}"
    echo -e "${YELLOW}  这可能需要几分钟时间，请耐心等待...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}  ❌ 依赖安装失败，请检查错误信息${NC}"
        exit 1
    fi
    echo -e "${GREEN}  ✓ 依赖安装完成${NC}"
else
    echo -e "${GREEN}  ✓ 依赖已存在${NC}"
fi

# 处理数据库选项
echo -e "${YELLOW}[4/5] 配置数据库...${NC}"
if [ "$LOCAL_MODE" = true ]; then
    echo -e "${YELLOW}  使用本地数据库模式...${NC}"
    echo -e "${YELLOW}  请确保已配置好本地数据库连接（config.json）${NC}"
elif [ "$USE_DOCKER" = true ]; then
    # 检查 Docker 和 Docker Compose
    echo -e "${YELLOW}  检查 Docker 环境...${NC}"
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}  ❌ 错误: 未检测到 Docker，请先安装 Docker${NC}"
        echo -e "${YELLOW}  安装指南: https://docs.docker.com/get-docker/${NC}"
        exit 1
    fi
    
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}  ✓ $DOCKER_VERSION${NC}"
    
    if ! docker compose version &> /dev/null; then
        echo -e "${RED}  ❌ 错误: Docker Compose 不可用${NC}"
        exit 1
    fi
    echo -e "${GREEN}  ✓ Docker Compose 可用${NC}"
    
    # 确定数据库类型
    if [ -z "$DB_TYPE" ]; then
        DB_TYPE="mongo"
    fi
    
    if [ "$DB_TYPE" = "mongo" ]; then
        echo -e "${CYAN}  使用 MongoDB + Redis${NC}"
        echo -e "${YELLOW}  启动数据库服务...${NC}"
        docker compose -f docker-compose.yml up -d mongo redis
    elif [ "$DB_TYPE" = "postgres" ]; then
        echo -e "${CYAN}  使用 PostgreSQL + Redis${NC}"
        echo -e "${YELLOW}  启动数据库服务...${NC}"
        docker compose -f docker-compose-pgsql.yml up -d postgres redis
    fi
    
    echo -e "${YELLOW}  等待数据库服务就绪...${NC}"
    sleep 5
    
    echo -e "${GREEN}  ✓ 数据库服务已启动${NC}"
    echo -e "${GRAY}  提示: 使用 'docker compose down' 停止数据库服务${NC}"
else
    # 默认使用本地模式
    echo -e "${YELLOW}  未指定数据库选项，将使用本地模式${NC}"
    echo -e "${GRAY}  如需使用 Docker，请运行: ./dev-start.sh --docker${NC}"
    echo -e "${GRAY}  或指定数据库: ./dev-start.sh --mongo 或 ./dev-start.sh --postgres${NC}"
fi

# 检查配置文件
echo -e "${YELLOW}[5/5] 检查配置文件...${NC}"
if [ ! -f "config.json" ]; then
    echo -e "${YELLOW}  ⚠ 未找到 config.json，NodeBB 将启动安装向导${NC}"
    echo -e "${YELLOW}  首次运行需要在浏览器中完成安装配置${NC}"
else
    echo -e "${GREEN}  ✓ 配置文件已存在${NC}"
fi

# 启动 NodeBB 开发模式
echo ""
echo -e "${CYAN}========================================${NC}"
echo -e "${CYAN}  启动 NodeBB 开发服务器...${NC}"
echo -e "${CYAN}========================================${NC}"
echo ""
echo -e "${GREEN}  访问地址: http://localhost:4567${NC}"
echo -e "${YELLOW}  按 Ctrl+C 停止服务器${NC}"
echo ""

# 启动 NodeBB
node ./nodebb dev

