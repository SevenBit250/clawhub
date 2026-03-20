# 仓库指南

本文档为在此仓库中工作的 AI 编程助手提供指导。

## 项目结构与模块组织

- `backend/` — Fastify API 服务器（Drizzle ORM + PostgreSQL）
- `frontend/` — Nuxt 3 前端（Vue 3）
- `packages/schema/` — 共享的 API 类型定义
- `docs/` — 产品/规格文档
- `docker-compose.dev.yml` — 开发环境 Docker 配置

## 构建、测试和开发命令

```bash
# 后端开发
cd backend && bun run dev        # Fastify 开发服务器 http://localhost:3001

# 前端开发
cd frontend && npm run dev       # Nuxt 开发服务器 http://localhost:3000

# Docker 开发环境
docker compose -f docker-compose.dev.yml up -d    # PostgreSQL + Redis
docker compose -f docker-compose.dev.yml down      # 停止服务

# 数据库迁移
cd backend && bun run db:generate    # 生成迁移文件
npx drizzle-kit migrate               # 执行迁移

# 数据库 Studio（可选）
cd backend && bun run db:studio      # Drizzle Studio
```

## 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | Nuxt 3 + Vue 3 | SSR/SSG 支持 |
| 后端框架 | Fastify | 高性能 Node.js 框架 |
| 数据库 | PostgreSQL + pgvector | 向量搜索支持 |
| ORM | Drizzle | 轻量级类型安全 ORM |
| 任务队列 | BullMQ (Redis) | 定时任务 |
| 文件存储 | 本地文件系统 | 开发环境默认 |
| 认证 | JWT Session | WeCom OAuth 接口预留 |

## 代码风格与约定

### TypeScript
- **严格模式** — 禁止 `any`，禁止隐式 any
- ESM 模块（`"type": "module"`）
- 目标：ES2022
- 类型仅导入时使用 `import type`

### 格式化和代码检查
- 后端：手动格式化（遵循项目约定）
- 前端：Nuxt 默认格式化
- 缩进：2 空格
- 引号：单引号
- 尾随逗号：始终保留
- 语句末尾不加分号
- **禁止使用 `as any`**
- **禁止抑制 lint 错误**

### 命名约定
| 模式 | 约定 | 示例 |
|---------|------------|---------|
| 后端函数/路由 | kebab-case | `create-skill`, `get-user` |
| 数据库表 | snake_case | `skill_versions`, `skill_embeddings` |
| Vue 组件 | PascalCase | `SkillCard`, `UserProfile` |
| 前端文件 | kebab-case | `skill-card.vue`, `use-auth.ts` |
| 类型/接口 | PascalCase | `PublicSkill`, `SkillMetadata` |
| 常量 | SCREAMING_SNAKE | `MAX_FILE_SIZE` |
| CSS 类名 | kebab-case | `flex items-center gap-2` |

### 导入模式
```typescript
// 后端 - Node 内置模块
import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";

// 后端 - Drizzle
import { db } from "./db/index.js";
import { skills, users } from "./db/schema.js";
import { eq, and, isNull } from "drizzle-orm";

// 后端 - Fastify
import Fastify from "fastify";

// 前端 - Nuxt composables
const { data } = await useAsyncData("key", () => api.get("/skills"));
```

### 错误处理
- 后端：使用 `throw { statusCode: xxx, message: "..." }` 或 `throw new Error()`
- HTTP 处理器：返回适当状态码的错误响应
- **绝不吞掉错误**：始终处理或重新抛出
- **禁止空 catch 块**

## 数据库

### Schema 位置
- `backend/src/db/schema.ts` — 所有表定义（Drizzle ORM）

### 主要表
| 表名 | 说明 |
|------|------|
| `users` | 用户信息 |
| `skills` | Skill 元数据 |
| `skill_versions` | Skill 版本 + files JSON |
| `souls` | Soul 元数据 |
| `soul_versions` | Soul 版本 |
| `skill_embeddings` | 向量索引数据 |
| `auth_sessions` | JWT Session 存储 |
| `stars`, `comments` | 社交功能 |

### 文件存储
- 上传通过 `POST /storage/upload`
- 文件存储在 `STORAGE_DIR` 环境变量指定目录（默认 `./storage`）
- 路径格式：`{storageId[:2]}/{storageId}`

## API 设计

### 路由约定
- RESTful 风格
- 认证路由：`/auth/*`
- 资源路由：`/skills`, `/souls`, `/users`
- 查询参数：kebab-case (`sort-by`, `limit`)

### 主要端点
| 端点 | 方法 | 说明 | 认证 |
|------|------|------|------|
| `/health` | GET | 健康检查 | ❌ |
| `/auth/url` | GET | 获取 OAuth URL | ❌ |
| `/auth/callback` | GET | OAuth 回调 | ❌ |
| `/auth/session` | GET | 获取当前会话 | 可选 |
| `/auth/logout` | POST | 登出 | 可选 |
| `/skills` | GET | 列表 | ❌ |
| `/skills` | POST | 创建 | ✅ |
| `/skills/:slug` | GET | 详情 | ❌ |
| `/skills/:id` | PATCH/DELETE | 更新/删除 | ✅ |
| `/search` | GET | 搜索 | ❌ |
| `/storage/upload` | POST | 上传文件 | ✅ |
| `/storage/:id` | GET | 下载文件 | ❌ |

## 前端开发

### 页面结构
```
frontend/pages/
├── index.vue           # 首页
├── search.vue         # 搜索页
├── dashboard.vue       # 用户仪表盘
├── skills/
│   ├── index.vue     # 技能列表
│   └── [slug].vue    # 技能详情
└── souls/
    └── index.vue     # Soul 列表
```

### Composables
```
frontend/composables/
├── useApi.ts    # API 客户端封装
├── useAuth.ts  # 认证状态管理
└── useSearch.ts # 搜索功能
```

### 布局
- `frontend/layouts/default.vue` — 默认布局（含导航栏搜索框）

## 提交和 Pull Request 指南

- **提交信息**：遵循 Conventional Commits（`feat:`、`fix:`、`chore:`、`docs:`…）
- **PR**：小范围更改，包含所运行的测试命令
- **合并前**：类型检查通过
- **密钥**：绝不提交 `.env` 或凭证信息

## 配置与安全

- **后端环境变量**：`backend/.env`
- **前端环境变量**：`.env.local`（Nuxt）
- **Docker**：开发环境通过 `docker-compose.dev.yml` 管理
- **OAuth**：WeCom OAuth 接口预留（mock 实现可用）

## 开发提示

### 启动开发环境
```bash
# 1. 启动数据库
docker compose -f docker-compose.dev.yml up -d

# 2. 启动后端
cd backend && bun run dev

# 3. 启动前端（新终端）
cd frontend && npm run dev
```

### 测试 OAuth Mock
```bash
# 获取 mock 登录 URL
curl http://localhost:3001/auth/url

# 使用 mock code 登录
curl "http://localhost:3001/auth/callback?code=mock_admin"
```

### 数据库操作
```bash
# 生成迁移
cd backend && bun run db:generate

# 执行迁移
npx drizzle-kit migrate

# 查看数据
docker exec -it clawhub-postgres psql -U clawhub -d clawhub
```

## URL 参考

- 本地后端：`http://localhost:3001`
- 本地前端：`http://localhost:3000`
- PostgreSQL：`localhost:5432`（用户/密码：clawhub/clawhub_dev）
- Redis：`localhost:6379`
