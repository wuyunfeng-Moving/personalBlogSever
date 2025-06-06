#!/bin/bash

# Personal Blog 部署脚本
# 用法: ./deploy.sh

set -e  # 遇到错误时退出

echo "🚀 开始部署个人博客系统..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目路径
PROJECT_ROOT="/var/www/personalBlog"
BACKEND_PATH="$PROJECT_ROOT/recipeServerPython"
FRONTEND_PATH="$PROJECT_ROOT/recipeServerWeb"

# 检查是否在正确的目录
if [ ! -d "$PROJECT_ROOT" ]; then
    echo -e "${RED}错误: 项目目录不存在: $PROJECT_ROOT${NC}"
    exit 1
fi

cd $PROJECT_ROOT

echo -e "${YELLOW}1. 拉取最新代码...${NC}"
git pull origin main

echo -e "${YELLOW}2. 更新后端依赖...${NC}"
cd $BACKEND_PATH
source venv/bin/activate
pip install -r requirements.txt

echo -e "${YELLOW}3. 数据库迁移...${NC}"
# 导入环境变量
set -a; source $PROJECT_ROOT/.env; set +a
python manage.py migrate
python manage.py collectstatic --noinput

echo -e "${YELLOW}4. 构建前端应用...${NC}"
cd $FRONTEND_PATH
npm install
npm run build

echo -e "${YELLOW}5. 重启服务...${NC}"
sudo supervisorctl restart personal_blog
sudo systemctl reload nginx

echo -e "${YELLOW}6. 检查服务状态...${NC}"
sleep 3
if sudo supervisorctl status personal_blog | grep -q "RUNNING"; then
    echo -e "${GREEN}✅ Django后端服务运行正常${NC}"
else
    echo -e "${RED}❌ Django后端服务启动失败${NC}"
    sudo supervisorctl status personal_blog
    exit 1
fi

if sudo systemctl is-active --quiet nginx; then
    echo -e "${GREEN}✅ Nginx服务运行正常${NC}"
else
    echo -e "${RED}❌ Nginx服务异常${NC}"
    sudo systemctl status nginx
    exit 1
fi

echo -e "${GREEN}🎉 部署完成！${NC}"
echo -e "${GREEN}访问您的博客: http://your-domain.com${NC}"
echo -e "${GREEN}管理后台: http://your-domain.com/admin/${NC}"

# 显示服务状态
echo -e "\n${YELLOW}服务状态:${NC}"
sudo supervisorctl status personal_blog
echo ""
sudo systemctl status nginx --no-pager -l 