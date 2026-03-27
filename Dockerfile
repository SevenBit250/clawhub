# ──────────────────────────────────────────────
# Stage 1: Build
# ──────────────────────────────────────────────
FROM node:24 AS builder

WORKDIR /app

# 复制 package.json，先安装依赖（利用 Docker 缓存层）
COPY backend/package.json backend/
COPY frontend/package.json frontend/

# 使用淘宝 npm 镜像加速
RUN npm config set registry https://registry.npmmirror.com

# 安装所有依赖（包含 devDependencies，用于构建）
RUN npm install --prefix backend && \
    npm install --prefix frontend

# 复制源码
COPY . .

# 构建前端（输出到 frontend/dist）
RUN cd frontend && npm run build

# 编译后端 TypeScript（输出到 backend/dist）
RUN cd backend && npm run build

# 清理 devDependencies（减小镜像体积）
RUN npm prune --prefix backend --production && \
    npm prune --prefix frontend --production

# ──────────────────────────────────────────────
# Stage 2: Runtime
# ──────────────────────────────────────────────
FROM pgvector/pgvector:pg17 AS runtime

# pgvector/pgvector:pg17 基于 Debian Bookworm，已包含 PostgreSQL 17 + pgvector
# 从 NodeSource 添加 Node.js 24
RUN apt-get update && apt-get install -y ca-certificates curl gnupg \
    && mkdir -p /etc/apt/keyrings \
    && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
    && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_24.x nodistro main" > /etc/apt/sources.list.d/nodesource.list \
    && apt-get update && apt-get install -y --no-install-recommends \
        nodejs \
        redis-server \
        curl \
        gosu \
    && rm -rf /var/lib/apt/lists/* \
    && npm config set registry https://registry.npmmirror.com

# postgres:17 镜像已有 postgres 用户 (UID 999)，复用
# 但 Node 应用用独立用户
RUN groupadd -g 1002 nodeapp && \
    useradd -u 1002 -g nodeapp -s /bin/bash nodeapp

WORKDIR /app

# 从 builder 阶段复制构建产物
COPY --from=builder --chown=nodeapp:nodeapp /app/backend ./backend
COPY --from=builder --chown=nodeapp:nodeapp /app/frontend/dist ./frontend/dist
# 复制迁移 SQL 文件（Drizzle migration）到 backend/dist/drizzle
COPY --from=builder --chown=nodeapp:nodeapp /app/backend/drizzle ./backend/dist/drizzle

# 初始化 PostgreSQL 数据目录（pgvector/pgvector:pg17 镜像数据目录为空，需 initdb）
# 数据在 Docker volume 中持久化，initdb 只在首次执行（目录非空时跳过）
RUN mkdir -p /var/run/postgresql && \
    chown -R postgres:postgres /var/lib/postgresql /var/run/postgresql && \
    gosu postgres /usr/lib/postgresql/17/bin/initdb -D /var/lib/postgresql/data > /dev/null 2>&1 || \
    rm -rf /var/lib/postgresql/data/* && gosu postgres /usr/lib/postgresql/17/bin/initdb -D /var/lib/postgresql/data > /dev/null 2>&1 || true

# 创建文件存储目录
RUN mkdir -p /app/backend/storage && chown nodeapp:nodeapp /app/backend/storage

# 配置环境变量
ENV NODE_ENV=production
ENV PORT=3001
ENV DATABASE_URL=postgresql://clawhub:clawhub@localhost:5432/clawhub
ENV REDIS_URL=redis://localhost:6379
ENV STORAGE_DIR=/app/backend/storage
ENV PGDATA=/var/lib/postgresql/data

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
    CMD curl -sf http://localhost:3001/health || exit 1

EXPOSE 3001 5432 6379

# 启动所有服务（使用 bash 脚本管理多进程）
# 容器以 root 身份启动（CMD 默认），使用 gosu postgres 切换到 postgres 用户启动数据库
# 然后以 nodeapp 用户运行 Node.js 应用
CMD ["/bin/bash", "-c", "\
    mkdir -p /var/run/postgresql && \
    mkdir -p $PGDATA && \
    chown -R postgres:postgres $PGDATA && \
    chmod 700 $PGDATA && \
    gosu postgres /usr/lib/postgresql/17/bin/initdb -D $PGDATA > /dev/null 2>&1 || true && \
    gosu postgres /usr/lib/postgresql/17/bin/pg_ctl -D $PGDATA -o '-c listen_addresses=localhost -c port=5432' -l /var/lib/postgresql/data/logfile start && \
    echo 'Waiting for PostgreSQL...' && \
    until gosu postgres psql -lqt > /dev/null 2>&1; do sleep 1; done && \
    gosu postgres psql -tc \"SELECT 1 FROM pg_database WHERE datname='clawhub'\" | grep -q 1 || gosu postgres psql -c \"CREATE DATABASE clawhub\" && \
    gosu postgres psql -tc \"SELECT 1 FROM pg_roles WHERE rolname='clawhub'\" | grep -q 1 || gosu postgres psql -c \"CREATE USER clawhub WITH PASSWORD 'clawhub'\" && \
    gosu postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE clawhub TO clawhub\" && \
    gosu postgres psql -c \"ALTER DATABASE clawhub OWNER TO clawhub\" && \
    gosu postgres psql -c \"ALTER SCHEMA public OWNER TO clawhub\" && \
    gosu postgres psql -d clawhub -c \"CREATE EXTENSION IF NOT EXISTS vector\" && \
    echo 'Running database migrations...' && \
    gosu nodeapp node backend/dist/scripts/migrate.js && \
    redis-server --daemonize yes && \
    echo 'All services started. Launching app...' && \
    exec gosu nodeapp node backend/dist/index.js"]
