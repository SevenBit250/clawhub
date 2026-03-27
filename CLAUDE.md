# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

ClawHub 是一个 AI Agent 技能市场的私有化部署版本，包含：
- **Backend**: Fastify API 服务端，使用 Drizzle ORM + PostgreSQL + pgvector
- **Frontend**: Vite + Vue 3 SPA 应用，使用 Ant Design Vue
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
bun run db:studio        # 数据库管理工具 (Drizzle Studio)
bun run test:run         # 运行测试（单次执行）
bun run test:run -- tests/auth.test.ts  # 运行单个测试文件
bun run test             # 监视模式
bun run test:ui          # UI 模式
bun run test:coverage    # 覆盖率报告
```

### 前端 (Vite + Vue 3)
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
# 首次启动后需要在数据库中启用 pgvector 扩展（只需执行一次）
docker exec clawhub-postgres psql -U clawhub -d clawhub -c "CREATE EXTENSION IF NOT EXISTS vector;"
# 首次启动后创建测试数据（用于本地开发和测试）
cd backend && bun run scripts/seed-test-data.ts
# 模拟 OAuth 登录：
curl http://localhost:3001/auth/url
curl "http://localhost:3001/auth/callback?code=mock_admin"
```

### CLI 本地测试
```bash
# 测试 clawdhub CLI 指向本地实例
CLAWHUB_REGISTRY=http://localhost:3001 CLAWHUB_SITE=http://localhost:3000 clawdhub search "padel"
```

### 后端环境变量 (`backend/.env`)
```env
DATABASE_URL=postgresql://clawhub:clawhub@localhost:5432/clawhub
JWT_SECRET=your-jwt-secret
STORAGE_DIR=./storage
DEMANDS_SERVICE_URL=https://your-demands-service.com  # 可选
# Authing SSO
AUTHING_DOMAIN=your-domain.authing.cn
AUTHING_APP_ID=your-app-id
AUTHING_REDIRECT_URI=http://localhost:3000/auth/callback
AUTHING_USER_POOL_ID=your-user-pool-id
```

### 前端环境变量 (`frontend/.env`)
```env
VITE_AUTHING_DOMAIN=your-domain.authing.cn
VITE_AUTHING_APP_ID=your-app-id
VITE_AUTHING_USER_POOL_ID=your-user-pool-id
VITE_AUTHING_REDIRECT_URI=http://localhost:3000/auth/callback
```
API 请求默认发往 `http://localhost:3001`，可通过 `VITE_API_BASE` 覆盖。

## 架构

### 后端路由
- `routes/v1/` — RESTful API（skills, souls, users, search, stars, transfers, admin, whoami, resolve, download, demands）
- `routes/legacy/` — CLI 兼容接口
- 认证：JWT Session + Authing SSO（支持模拟登录）

### 前端结构
```
frontend/
├── src/
│   ├── pages/           # index.vue, search.vue, dashboard.vue, skills/, souls/, demands/, auth/
│   │   ├── skills/       # index.vue, [slug].vue, create.vue, edit.vue
│   │   ├── souls/       # index.vue
│   │   ├── demands/     # index.vue (代理外部需求服务)
│   │   └── auth/        # callback.vue (OAuth 回调)
│   ├── composables/     # useApi.ts, useAuth.ts, useSearch.ts, useTheme.ts
│   ├── plugins/         # antdv.ts, i18n.ts
│   ├── router/          # Vue Router 配置
│   ├── layouts/         # default.vue
│   ├── assets/css/      # main.css
│   └── main.ts          # Vite 入口
├── auto-imports.d.ts    # unplugin-auto-import 自动生成的类型
├── components.d.ts       # unplugin-vue-components 自动生成的类型
├── vite.config.ts
└── index.html
```

### 后端结构
```
backend/src/
├── index.ts              # Fastify 入口，含 auth/storage/comment 路由
├── auth/                 # 认证模块（与 index.ts 同级）
│   ├── session.ts        # JWT Session 管理
│   ├── authing.ts        # Authing OAuth 集成
│   └── mock.ts           # 开发环境模拟登录（支持 mock_admin/mock_test）
├── db/
│   ├── index.ts          # Drizzle 客户端
│   └── schema.ts         # 表结构定义
├── lib/                  # 业务逻辑
│   ├── skills.ts         # 技能 CRUD
│   ├── souls.ts          # 灵魂 CRUD
│   ├── search.ts         # 向量搜索
│   ├── searchText.ts     # 文本搜索
│   ├── comments.ts       # 评论
│   ├── stars.ts          # 收藏
│   └── storage.ts        # 文件存储
├── routes/
│   ├── v1/               # v1 RESTful API
│   └── legacy/           # CLI 兼容接口
backend/scripts/
└── seed-test-data.ts     # 测试数据初始化脚本
```

### 认证
- **前端**：使用 Authing SSO SDK（`@authing/web`）处理登录 UI，登录成功后携带 code 回调到 `/auth/callback`
- **后端**：使用 Authing OAuth 兑换 code 获取用户信息并创建 Session；开发环境使用 MockAuth（`mock.ts`）
- JWT Session 管理，Session 存储在数据库 `auth_sessions` 表
- 开发环境支持模拟登录：`curl "http://localhost:3001/auth/callback?code=mock_admin"`（admin）或 `code=mock_test`（user）
- 前端环境变量不配置 Authing 时，通过 `mock=true` 的 `/auth/url` 返回 mock 登录 URL

### CLI 结构 — `packages/clawdhub/src/`
```
src/
├── cli.ts               # CLI 入口
├── http.ts              # HTTP 客户端
├── config.ts            # 配置文件解析
├── discovery.ts         # 工作区/技能发现
├── skills.ts            # 技能安装/更新逻辑
├── schema/              # 技能格式解析 (ArkType)
├── cli/
│   ├── commands/        # 命令实现 (publish, sync, auth, stars, ...)
│   ├── registry.ts      # Registry 发现
│   └── ui.ts            # CLI 界面样式
```

### 数据库 Schema
- `backend/src/db/schema.ts` — Drizzle ORM schema
- 主要表：users, skills, skill_versions, souls, soul_versions, skill_embeddings, auth_sessions, stars, comments
- 文件存储：`POST /storage/upload`，存储在 `STORAGE_DIR`，路径格式 `{id[:2]}/{id}`

**JSON 列序列化注意事项**：以下列存储 JSON 数据为文本，需要手动序列化：
- `skill_versions.files` — 文件对象数组
- `skill_versions.frontmatter` — 对象
- `skill_versions.metadata` — 混合对象
- `skill_versions.clawdis` — 对象
- `soul_versions.files` — 文件对象数组
- `soul_versions.frontmatter` — 对象
- `soul_versions.metadata` — 混合对象
- `soul_versions.clawdis` — 对象

插入时使用 `JSON.stringify()`，读取时使用 `JSON.parse()`。

### 技能 (Skills) 和灵魂 (Souls)
- 技能：包含 `SKILL.md` 的文件夹，支持多版本管理、标签（latest + 自定义标签）
- 灵魂：类似技能，入口文件为 `SOUL.md`，用于 Agent 灵魂市场
- 上传限制：每个版本 ≤ 50MB，仅文本文件
- 版本历史：支持 changelog，可回滚（移动 latest 标签）

### 共享类型
- `packages/schema/` — ArkType 类型定义，供 backend 和 CLI 共用
- `src/schema.ts` — 主要类型：`Skill`、`SkillVersion`、`Soul`、`PublicUser` 等

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | Vite + Vue 3 + Ant Design Vue 4 |
| 后端 | Fastify |
| 数据库 | PostgreSQL + pgvector |
| ORM | Drizzle |
| 任务队列 | Redis (可选，用于 BullMQ 队列) |
| 认证 | JWT Session |
| 共享类型 | ArkType |

## 代码风格

### 开发原则
- **不要重复造轮子** — 实现某个功能前，优先考虑框架/生态中是否已有相应实现或组件
  - 例如：使用 Ant Design Vue 的 `a-modal` 而非自己实现 dialog
  - 例如：使用 `vue-i18n` 而非自己实现国际化
  - 例如：使用 `zod`/`arktype` 而非自己实现 schema 验证

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

// Frontend - Composables 自动导入（无需手动 import）
// useApi, useAuth, useSearch, useTheme 等直接在组件中使用
// 其他手动导入：
import { useApi } from "@/composables/useApi";
```

### 错误处理
- Backend: `throw { statusCode: xxx, message: "..." }` 或 `throw new Error()`
- HTTP handlers: 返回适当的状态码
- **禁止吞掉错误** — 必须处理或重新抛出
- **禁止空 catch 块**

## 关键 API 端点

### 根路径路由 (无前缀) — `backend/src/index.ts`
| 端点 | 方法 | 认证 | 描述 |
|------|------|------|------|
| `/health` | GET | 否 | 健康检查 |
| `/docs` | GET | 否 | Swagger API 文档 |
| `/auth/url` | GET | 否 | 获取 OAuth URL |
| `/auth/mock` | GET | 否 | 模拟登录页面（仅开发环境）|
| `/auth/callback` | GET | 否 | OAuth 回调 |
| `/auth/logout` | POST | 是 | 登出 |
| `/auth/session` | GET | 可选 | 获取当前会话 |
| `/users/me` | GET | 是 | 当前用户信息 |
| `/users/me` | PATCH | 是 | 更新当前用户信息 |
| `/users/me/skills` | GET | 是 | 当前用户的技能 |
| `/users/me/stars` | GET | 是 | 当前用户收藏的技能 |
| `/users/me/souls` | GET | 是 | 当前用户的灵魂 |
| `/storage/upload` | POST | 是 | 上传文件 |
| `/storage/:id` | GET | 否 | 下载文件 |
| `/skills/:id/comments` | GET/POST | 否/是 | 获取/添加评论 |
| `/comments/:id` | DELETE | 是 | 删除评论 |

### v1 API (`/api/v1` 前缀) — `backend/src/routes/v1/`
| 端点 | 方法 | 认证 | 描述 |
|------|------|------|------|
| `/api/v1/skills` | GET | 否 | 技能列表 |
| `/api/v1/skills` | POST | 是 | 创建技能 |
| `/api/v1/skills/:slug` | GET | 否 | 技能详情 |
| `/api/v1/skills/:slug` | DELETE | 是 | 删除技能（软删除） |
| `/api/v1/skills/:slug` | PUT | 是 | 更新技能元信息 |
| `/api/v1/skills/:slug/versions` | GET | 否 | 版本列表 |
| `/api/v1/skills/:slug/versions/:version` | GET | 否 | 指定版本详情 |
| `/api/v1/skills/:slug/rename` | PATCH | 是 | 重命名技能 |
| `/api/v1/skills/:slug/merge` | PATCH | 是 | 合并技能 |
| `/api/v1/skills/:slug/restore` | POST | 是 | 恢复已删除技能 |
| `/api/v1/skills/:slug/undelete` | POST | 是 | 取消删除（恢复） |
| `/api/v1/skills/:slug/resubmit` | POST | 是 | 重新提交被驳回技能 |
| `/api/v1/search` | GET | 否 | 搜索 |
| `/api/v1/souls` | GET | 否 | 灵魂列表 |
| `/api/v1/souls/:slug` | GET | 否 | 灵魂详情 |
| `/api/v1/demands` | GET | 否 | 需求列表（代理外部服务，需配置 `DEMANDS_SERVICE_URL`） |
| `/api/v1/stars/:slug` | POST/DELETE | 是 | 收藏/取消收藏技能 |
| `/api/v1/resolve` | GET | 否 | CLI 指纹解析 |
| `/api/v1/download` | GET | 否 | 下载技能 zip |
| `/api/v1/transfers` | GET | 是 | 获取所有转让请求（入栈/出栈） |
| `/api/v1/transfers` | POST | 是 | 创建转让请求 |
| `/api/v1/transfers/:id/accept` | POST | 是 | 接受转让 |
| `/api/v1/transfers/:id/reject` | POST | 是 | 拒绝转让 |
| `/api/v1/users` | GET | 是 | 用户列表（管理员） |
| `/api/v1/users/role` | PATCH | 是 | 更改用户角色（管理员） |
| `/api/v1/admin/skills/pending` | GET | moderator | 获取待审核技能列表 |
| `/api/v1/admin/skills/:id/approve` | POST | moderator | 批准技能 |
| `/api/v1/admin/skills/:id/reject` | POST | moderator | 驳回技能 |
| `/api/v1/admin/skills/:id/hide` | POST | moderator | 隐藏技能 |
| `/api/v1/admin/skills/:id/unhide` | POST | moderator | 取消隐藏技能 |
| `/api/v1/admin/users` | GET | admin | 用户列表 |

### 遗留兼容路由 (`/api` 前缀) — `backend/src/routes/legacy/`
| 端点 | 方法 | 认证 | 描述 |
|------|------|------|------|
| `/api/skill` | GET | 否 | 技能详情 (旧) |
| `/api/search` | GET | 否 | 搜索 (旧) |
| `/api/skill/resolve` | GET | 否 | 解析技能 (旧) |
| `/api/download` | GET | 否 | 下载技能 zip (旧) |
| `/api/cli/*` | — | — | CLI 兼容接口 |

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
- **单元测试**: `tests/*.test.ts`（如 `storage.test.ts`）— 纯函数、工具函数、存储逻辑
- **API 回归测试**: `tests/*.test.ts` — 按类型分文件的 API 端点测试
  - `auth.test.ts` — 认证与会话
  - `skills.test.ts` — 技能 CRUD 与管理
  - `souls.test.ts` — 灵魂
  - `stars.test.ts` — 收藏
  - `search.test.ts` — 搜索、解析、下载
  - `legacy-cli.test.ts` — CLI 兼容接口（含 v1 Whoami）
  - `transfers.test.ts` — 技能转让
  - `users.test.ts` — 用户路由与 v1 用户
  - `storage-routes.test.ts` — 存储路由
  - `serialization.test.ts` — 序列化/反序列化
  - `helpers.ts` — 共享测试工具（API_BASE、getAuthToken 等）

### CLI 兼容性测试 ⚠️
`legacy-cli.test.ts`（`tests/legacy-cli.test.ts`）中的测试是**必须通过**的，用于保证 ClawHub CLI 的完全兼容：

**任何 API 变更都必须同步更新对应测试，确保 CLI 兼容性不被破坏。**

### 强制要求 ⚠️

| 修改内容 | 必须执行的测试 |
|---------|---------------|
| `src/lib/*.ts` | `bun run test:run` |
| `src/routes/` | `bun run dev`（后台运行）+ `bun run test:run` |
| 数据库 Schema | `bun run build && bun run test:run` |
| **所有提交前** | `bun run build && bun run test:run` |

### 测试通过标准
- `bun run test:run` exit code 0（**90 个测试全部通过**）
- TypeScript 编译通过（`bun run build`）
