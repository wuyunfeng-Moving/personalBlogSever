# 多阶段构建
# 第一阶段：构建应用
FROM node:18-alpine AS builder

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 第二阶段：Nginx服务器
FROM nginx:alpine

# 复制构建产物到nginx目录
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制nginx配置文件
COPY nginx.conf /etc/nginx/nginx.conf

# 暴露端口
EXPOSE 80

# 启动nginx
CMD ["nginx", "-g", "daemon off;"] 