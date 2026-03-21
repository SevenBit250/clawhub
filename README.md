<p align="center">
  <img src="public/clawd-logo.png" alt="ClawHub" width="120">
</p>

<h1 align="center">ClawHub (私有部署版)</h1>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="MIT License"></a>
</p>

## 项目说明

本项目基于 [ClawHub](https://github.com/openclaw/clawhub) 改造而来，旨在方便企业和个人私有部署 ClawHub。

**主要改动：**
- 将 Convex 替换为自托管的 Fastify 后端
- 使用 PostgreSQL + pgvector 替代 Convex 数据库
- 使用 Redis (BullMQ) 替代 Convex 函数队列
- 保留 Nuxt 3 前端，无需 Convex 部署
- 支持完整的 CLI API 兼容

## 功能特性

- 浏览、搜索、发布技能包 (SKILL.md)
- 技能版本管理与更新
- 技能重命名、合并（不破坏已有链接）
- 浏览和管理灵魂包 (SOUL.md)
- 收藏、评论功能
- 向量搜索（pgvector）
- 完整的 CLI 支持
- 支持 WeCom OAuth（可配置为其他 OAuth 提供商）

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Nuxt 3 + Vue 3 |
| 后端 | Fastify |
| 数据库 | PostgreSQL + pgvector |
| ORM | Drizzle |
| 任务队列 | BullMQ (Redis) |
| 认证 | JWT Session |

## 快速开始

### 前置要求

- [Bun](https://bun.sh/)
- Docker 和 Docker Compose

### 1. 启动基础设施

```bash
docker compose -f docker-compose.dev.yml up -d
```

这将启动：
- PostgreSQL (端口 5432)
- Redis (端口 6379)

### 2. 后端设置

```bash
cd backend

# 安装依赖
bun install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等

# 生成数据库迁移
bun run db:generate

# 运行迁移
bun run db:migrate

# 启动开发服务器 (http://localhost:3001)
bun run dev
```

### 3. 前端设置

```bash
cd frontend

# 安装依赖
bun install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 文件

# 启动开发服务器 (http://localhost:3000)
bun run dev
```

### 4. 模拟登录

```bash
# 获取 OAuth URL
curl http://localhost:3001/auth/url

# 使用模拟账号登录
curl "http://localhost:3001/auth/callback?code=mock_admin"
```

## API 接口

### v1 API (CLI 兼容)

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/v1/whoami` | GET | 获取当前用户 |
| `/api/v1/users` | GET | 用户搜索 |
| `/api/v1/skills` | GET | 技能列表 |
| `/api/v1/skills/:slug` | GET | 技能详情 |
| `/api/v1/skills` | POST | 发布技能 |
| `/api/v1/search` | GET | 搜索技能 |
| `/api/v1/resolve` | GET | 解析版本 |
| `/api/v1/download` | GET | 下载技能包 |
| `/api/v1/stars` | POST/DELETE | 收藏操作 |
| `/api/v1/transfers` | GET/POST | 所有权转移 |
| `/api/v1/souls` | GET | 灵魂列表 |

### 遗留兼容接口

```bash
/api/cli/whoami
/api/cli/publish
/api/cli/skill/delete
/api/skill
/api/search
```

## CLI 使用

```bash
# 登录
clawhub login

# 查看当前用户
clawhub whoami

# 搜索技能
clawhub search <关键词>

# 查看技能详情
clawhub inspect <slug>

# 发布技能
clawhub publish <路径>

# 删除技能（软删除）
clawhub delete <slug>

# 重命名技能
clawhub skill rename <slug> <新slug>

# 合并技能
clawhub skill merge <源slug> <目标slug>
```

## 项目结构

```
clawhub/
├── backend/              # Fastify 后端服务
│   └── src/
│       ├── auth/        # 认证模块 (JWT, OAuth)
│       ├── db/          # Drizzle 数据库 schema
│       ├── lib/         # 业务逻辑
│       └── routes/      # API 路由
│           ├── v1/      # v1 API 端点
│           └── legacy/  # CLI 兼容接口
├── frontend/            # Nuxt 3 前端应用
│   ├── pages/           # 页面路由
│   ├── composables/     # Vue 组合式函数
│   └── layouts/         # 布局组件
├── packages/
│   ├── schema/          # 共享 API 类型定义
│   └── clawdhub/        # CLI 工具
├── docs/               # 项目文档
└── docker-compose.dev.yml  # 开发环境配置
```

## 环境变量

### 后端 (`backend/.env`)

```env
# 数据库
DATABASE_URL=postgresql://user:password@localhost:5432/clawhub

# Redis
REDIS_URL=redis://localhost:6379

# JWT 认证
JWT_SECRET=your-secret-key-min-32-chars

# 服务器
PORT=3001

# 文件存储
STORAGE_DIR=./storage
```

### 前端 (`.env.local`)

```env
NUXT_PUBLIC_API_URL=http://localhost:3001
```

## 常用命令

```bash
# 后端
cd backend
bun run dev              # 启动开发服务器
bun run build            # TypeScript 构建
bun run db:generate      # 生成数据库迁移
bun run db:migrate       # 执行数据库迁移
bun run db:studio        # 数据库管理工具

# 前端
cd frontend
bun run dev              # 启动开发服务器
bun run build            # 生产构建

# 类型检查
bunx tsc --noEmit
```

## 数据库

使用 Drizzle ORM，支持 PostgreSQL + pgvector（向量搜索）。

主要数据表：
- `users` - 用户
- `skills` / `skill_versions` - 技能和版本
- `souls` / `soul_versions` - 灵魂和版本
- `stars` - 收藏
- `comments` - 评论
- `skill_embeddings` - 向量索引

## 与原版 ClawHub 的差异

| 功能 | 原版 ClawHub | 私有部署版 |
|------|-------------|-----------|
| 部署方式 | 需要 Convex 托管 | 完全自托管 |
| 数据库 | Convex (云) | PostgreSQL (本地) | 
| 文件存储 | Convex Storage | 本地文件系统 |
| 任务队列 | Convex Functions | BullMQ (Redis) |
| 前端部署 | 需要 Convex | 任意静态托管 |
| OAuth | 仅 GitHub | 可配置任意 OAuth |

## 许可证

MIT License
