# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

ClawHub 是一个 AI Agent 技能市场的私有化部署版本，包含：
- **Backend**: Fastify API 服务端，使用 Drizzle ORM + PostgreSQL + pgvector
- **Frontend**: Nuxt 3 + Vue 3 应用，使用 Ant Design Vue
- **packages/schema**: 使用 ArkType 的共享 API 类型定义
- **packages/clawdhub**: 用于发布和管理技能的 CLI 工具

## 常用命令

### 后端 (Fastify + Drizzle)
```bash
cd backend
bun install
bun run dev              # 启动开发服务器 http://localhost:3001
bun run build            # TypeScript 编译
bun run db:generate      # 生成 Drizzle 迁移
bun run db:migrate       # 执行数据库迁移
bun run test:run         # 运行测试（单次执行）
bun run test             # 监视模式
bun run test:ui          # UI 模式
bun run test:coverage    # 覆盖率报告
```

### 前端 (Nuxt 3)
```bash
cd frontend
bun install && bun run dev   # 启动开发服务器 http://localhost:3000
bun run build                 # 生产构建
```

### TypeScript 类型检查
```bash
bunx tsc --noEmit
bunx tsc -p packages/schema --noEmit
bunx tsc -p packages/clawdhub --noEmit
```

### 开发环境
```bash
docker compose -f docker-compose.dev.yml up -d  # PostgreSQL + Redis
# 模拟 OAuth 登录：
curl http://localhost:3001/auth/url
curl "http://localhost:3001/auth/callback?code=mock_admin"
```

## 架构

### 后端路由
- `routes/v1/` — RESTful API（skills, souls, users, search, storage）
- `routes/legacy/` — CLI 兼容接口
- 认证：JWT Session + WeCom OAuth（支持模拟登录）

### 前端结构
```
frontend/
├── pages/           # index.vue, search.vue, dashboard.vue, login.vue, skills/, souls/
├── composables/     # useApi.ts, useAuth.ts, useSearch.ts
├── layouts/         # default.vue
└── assets/css/      # main.css
```

### 数据库 Schema
- `backend/src/db/schema.ts` — Drizzle ORM schema
- 主要表：users, skills, skill_versions, souls, soul_versions, skill_embeddings, auth_sessions, stars, comments
- 文件存储：`POST /storage/upload`，存储在 `STORAGE_DIR`，路径格式 `{id[:2]}/{id}`

### 共享类型
- `packages/schema/` — ArkType 类型定义，供 backend 和 CLI 共用

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Nuxt 3 + Vue 3 + Ant Design Vue 4 |
| 后端 | Fastify |
| 数据库 | PostgreSQL + pgvector |
| ORM | Drizzle |
| 任务队列 | BullMQ (Redis) |
| 认证 | JWT Session |
| 共享类型 | ArkType |

## 代码风格

### TypeScript
- strict mode — 禁止 `any`，禁止隐式 any
- ESM 模块（`"type": "module"`），Target ES2022
- 使用 `import type` 导入仅类型的导入

### 格式化
- 2 空格缩进，单引号，始终使用尾随逗号，不加分号
- **禁止使用 `as any`**

### 命名规范
| 模式 | 规范 | 示例 |
|------|------|------|
| 后端路由 | kebab-case | `create-skill` |
| 数据库表 | snake_case | `skill_versions` |
| Vue 组件 | PascalCase | `SkillCard` |
| 前端文件 | kebab-case | `skill-card.vue` |
| 类型/接口 | PascalCase | `PublicSkill` |
| 常量 | SCREAMING_SNAKE | `MAX_FILE_SIZE` |

### 导入模式
```typescript
// Backend - Node 内置模块
import { copyFile, mkdir } from "node:fs/promises";

// Backend - Drizzle
import { db } from "./db/index.js";
import { skills, users } from "./db/schema.js";
import { eq, and, isNull } from "drizzle-orm";

// Backend - Fastify
import Fastify from "fastify";
```

### 错误处理
- Backend: `throw { statusCode: xxx, message: "..." }` 或 `throw new Error()`
- HTTP handlers: 返回适当的状态码
- **禁止吞掉错误** — 必须处理或重新抛出
- **禁止空 catch 块**

## 关键 API 端点

| 端点 | 方法 | 认证 | 描述 |
|------|------|------|------|
| `/health` | GET | 否 | 健康检查 |
| `/auth/url` | GET | 否 | 获取 OAuth URL |
| `/auth/callback` | GET | 否 | OAuth 回调 |
| `/auth/session` | GET | 可选 | 获取当前会话 |
| `/skills` | GET | 否 | 技能列表 |
| `/skills` | POST | 是 | 创建技能 |
| `/skills/:slug` | GET | 否 | 技能详情 |
| `/skills/:id` | PATCH/DELETE | 是 | 更新/删除 |
| `/search` | GET | 否 | 搜索 |
| `/storage/upload` | POST | 是 | 上传文件 |

## Git 规范

- 提交信息：Conventional Commits（`feat:`、`fix:`、`chore:`、`docs:`）
- **提交信息语言：中文** — 所有提交信息使用中文撰写
- PR：聚焦单一变更，包含测试命令，UI 变更需截图
- **禁止提交** `.env` 或凭据信息

## 测试规范

### 测试框架
- 后端使用 **Vitest**
- 配置文件：`backend/vitest.config.ts`
- 测试文件位置：`backend/tests/`

### 测试类型
- **单元测试**: `tests/*.test.ts` — 纯函数、工具函数、存储逻辑
- **回归测试**: `tests/api.test.ts` — API 端点、CLI 兼容性

### 强制要求 ⚠️

| 修改内容 | 必须执行的测试 |
|---------|---------------|
| `src/lib/*.ts` | `bun run test:run` |
| `src/routes/` | `bun run dev` + `bun run test:run` |
| 数据库 Schema | `bun run build && bun run test:run` |
| **所有提交前** | `bun run build && bun run test:run` |

### 测试通过标准
- `bun run test:run` exit code 0
- TypeScript 编译通过（`bun run build`）
