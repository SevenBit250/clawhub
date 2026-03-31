<p align="center">
  <img src="frontend/public/favicon.png" alt="Skills Hub" width="120">
</p>

<h1 align="center">Skills Hub</h1>

<p align="center">
  AI Agent 技能市场的私有化部署版本<br>
</p>

---

## 功能特性

- **技能管理** — 浏览、发布、更新、版本控制（SKILL.md 格式）
- **向量搜索** — 基于 pgvector 的语义搜索，快速找到相关技能
- **收藏 & 评论** — 社区互动，发现优质技能
- **灵魂市场** — Agent 灵魂包管理（SOUL.md 格式）
- **CLI 工具** — 完整的命令行界面，发布和管理技能
- **OAuth 认证** — 支持多种 OAuth 提供商（默认 Authing/WeCom）
- **完全私有化** — 无需依赖任何第三方云服务

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vite + Vue 3 + Ant Design Vue 4 |
| 后端 | Fastify |
| 数据库 | PostgreSQL + pgvector |
| ORM | Drizzle |
| 认证 | JWT Session |
| 共享类型 | ArkType |

---

## 快速开始

### 前置要求

- [Bun](https://bun.sh/)
- Docker 和 Docker Compose

### 1. 启动基础设施

```bash
docker compose -f docker-compose.dev.yml up -d
```

### 2. 后端设置

```bash
cd backend
bun install
cp .env.example .env  # 编辑 .env 配置数据库连接
bun run db:generate   # 生成数据库迁移
bun run db:migrate    # 执行迁移
bun run dev           # 启动开发服务器 (http://localhost:3001)
```

### 3. 前端设置

```bash
cd frontend
bun install
cp .env.example .env  # 编辑 .env 配置 API 地址
bun run dev           # 启动开发服务器 (http://localhost:3000)
```

### 4. 初始化数据

```bash
# 启用 pgvector 扩展（首次）
docker exec clawhub-postgres psql -U clawhub -d clawhub -c "CREATE EXTENSION IF NOT EXISTS vector;"

# 创建测试数据
cd backend && bun run scripts/seed-test-data.ts

# 模拟登录
curl "http://localhost:3001/auth/callback?code=mock_admin"
```

---

## 项目结构

```
clawhub/
├── backend/              # Fastify 后端
│   └── src/
│       ├── auth/         # 认证模块 (JWT, OAuth)
│       ├── db/           # Drizzle schema
│       ├── lib/          # 业务逻辑 (skills, souls, search, ...)
│       └── routes/       # API 路由 (v1/, legacy/)
├── frontend/            # Vite + Vue 3 前端
│   ├── pages/           # 页面组件
│   ├── composables/    # Vue 组合式函数
│   └── layouts/        # 布局
├── packages/
│   ├── schema/         # 共享 ArkType 类型
│   └── clawdhub/       # CLI 工具
└── docker-compose.dev.yml
```

---

## CLI 使用

```bash
# 登录
clawhub login

# 搜索技能
clawhub search <关键词>

# 发布技能
clawhub publish <路径>

# 查看详情
clawhub inspect <slug>

# 收藏
clawhub stars add <slug>
clawhub stars remove <slug>
```

---

## 环境变量

### 后端 (`backend/.env`)

```env
DATABASE_URL=postgresql://user:password@localhost:5432/clawhub
JWT_SECRET=your-secret-key-min-32-chars
STORAGE_DIR=./storage
API_BASE=http://localhost:3001
```

### 前端 (`frontend/.env`)

```env
VITE_API_BASE=http://localhost:3001
```

---

## 与原版 ClawHub 的差异

| 功能 | 原版 ClawHub | Skills Hub |
|------|-------------|------------|
| 部署 | Convex 托管 | 完全自托管 |
| 数据库 | Convex (云) | PostgreSQL |
| 文件存储 | Convex Storage | 本地文件系统 |
| 前端部署 | Convex | 任意静态托管 |

---

## 许可证

MIT License
