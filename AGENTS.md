# ClawHub Agent Guidelines

This document provides guidance for AI coding agents working in this repository.

## Project Structure

- `backend/` — Fastify API server (Drizzle ORM + PostgreSQL + pgvector)
- `frontend/` — Nuxt 3 frontend (Vue 3)
- `packages/schema/` — Shared API type definitions (ArkType)
- `packages/clawdhub/` — CLI tool for publishing/managing skills
- `docker-compose.dev.yml` — Development environment (PostgreSQL + Redis)

## Build, Test, and Development Commands

### Backend (Fastify + Drizzle)
```bash
cd backend
bun install              # Install dependencies
bun run dev              # Start dev server http://localhost:3001
bun run build            # TypeScript build
bun run db:generate     # Generate Drizzle migrations
bun run db:migrate      # Run migrations
bun test                # Run tests
```

### Frontend (Nuxt 3)
```bash
cd frontend
bun install && bun run dev              # Start Nuxt dev server http://localhost:3000
bun run build                          # Production build
```

### Package TypeScript Checking
```bash
bunx tsc --noEmit
bunx tsc -p packages/schema --noEmit
bunx tsc -p packages/clawdhub --noEmit
```

### Development Environment Setup
```bash
# 1. Start PostgreSQL + Redis
docker compose -f docker-compose.dev.yml up -d

# 2. Start backend and frontend in separate terminals
cd backend && bun run dev
cd frontend && bun run dev

# Mock OAuth login
curl http://localhost:3001/auth/url
curl "http://localhost:3001/auth/callback?code=mock_admin"
```

## Tech Stack

| Layer | Technology | Notes |
|-------|------------|-------|
| Frontend | Nuxt 3 + Vue 3 | SSR/SSG support |
| Backend | Fastify | High-performance Node.js |
| Database | PostgreSQL + pgvector | Vector search |
| ORM | Drizzle | Type-safe, lightweight |
| Task Queue | BullMQ (Redis) | Scheduled jobs |
| Auth | JWT Session | WeCom OAuth (mock available) |

## Code Style Conventions

### TypeScript
- **Strict mode** — No `any`, no implicit `any`
- ESM modules (`"type": "module"`), Target: ES2022
- Use `import type` for type-only imports

### Formatting
- Indentation: 2 spaces, Quotes: single, Trailing commas: always, Semicolons: no
- **Never use `as any`** or suppress lint errors

### Naming Conventions
| Pattern | Convention | Example |
|---------|------------|---------|
| Backend routes | kebab-case | `create-skill` |
| Database tables | snake_case | `skill_versions` |
| Vue components | PascalCase | `SkillCard` |
| Frontend files | kebab-case | `skill-card.vue` |
| Types/interfaces | PascalCase | `PublicSkill` |
| Constants | SCREAMING_SNAKE | `MAX_FILE_SIZE` |

### Import Patterns
```typescript
// Backend - Node built-ins
import { copyFile, mkdir } from "node:fs/promises";

// Backend - Drizzle
import { db } from "./db/index.js";
import { skills, users } from "./db/schema.js";
import { eq, and, isNull } from "drizzle-orm";

// Backend - Fastify
import Fastify from "fastify";
```

### Error Handling
- Backend: `throw { statusCode: xxx, message: "..." }` or `throw new Error()`
- HTTP handlers: Return appropriate status codes
- **Never swallow errors** — always handle or rethrow
- **No empty catch blocks**

## Database

- Schema: `backend/src/db/schema.ts` (Drizzle ORM)
- File storage: Upload via `POST /storage/upload`, stored in `STORAGE_DIR` (default `./storage`)
- Path format: `{storageId[:2]}/{storageId}`

### Main Tables
`users`, `skills`, `skill_versions`, `souls`, `soul_versions`, `skill_embeddings`, `auth_sessions`, `stars`, `comments`

## API Design

### Route Conventions
- RESTful style, kebab-case query params (`sort-by`, `limit`)
- Auth routes: `/auth/*`, Resources: `/skills`, `/souls`, `/users`

### Key Endpoints
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/health` | GET | No | Health check |
| `/auth/url` | GET | No | Get OAuth URL |
| `/auth/callback` | GET | No | OAuth callback |
| `/auth/session` | GET | Optional | Get current session |
| `/skills` | GET | No | List skills |
| `/skills` | POST | Yes | Create skill |
| `/skills/:slug` | GET | No | Skill detail |
| `/skills/:id` | PATCH/DELETE | Yes | Update/delete |
| `/search` | GET | No | Search |
| `/storage/upload` | POST | Yes | Upload file |

## Frontend Structure
```
frontend/
├── pages/           # index.vue, search.vue, dashboard.vue
├── composables/    # useApi.ts, useAuth.ts, useSearch.ts
├── layouts/        # default.vue
└── assets/css/     # main.css
```

## Git Conventions
- Commit messages: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`)
- **Commit message language: 中文** — 所有提交信息使用中文撰写
- PRs: focused changes, include test commands, screenshots for UI changes
- **Never commit** `.env` or credentials

## 测试规范

### 测试框架
- 后端使用 **Vitest** 作为测试框架
- 配置文件: `backend/vitest.config.ts`
- 测试文件位置: `backend/tests/`

### 测试命令
```bash
cd backend
bun run test        # 监视模式
bun run test:run    # 单次运行
bun run test:ui      # UI 模式
bun run test:coverage # 覆盖率报告
```

### 测试类型

#### 单元测试 (Unit Tests)
- 位置: `tests/*.test.ts`
- 范围: 纯函数、工具函数、存储逻辑
- 示例: `tests/storage.test.ts`, `tests/serialization.test.ts`

#### 回归测试 (Regression Tests)
- 位置: `tests/api.test.ts`
- 范围: API 端点、CLI 兼容性
- 要求: 所有 CLI 命令必须能正常工作

### 强制要求 ⚠️

**修改或添加功能后必须执行测试：**

1. **修改 `src/lib/*.ts`** → 必须运行单元测试
   ```bash
   bun run test:run
   ```

2. **修改 API 路由 (`src/routes/`)** → 必须运行 API 回归测试
   ```bash
   # 确保后端正在运行
   bun run dev
   # 运行测试
   bun run test:run
   ```

3. **修改数据库 Schema** → 必须运行相关测试并验证构建
   ```bash
   bun run build && bun run test:run
   ```

4. **所有提交前** → 必须确保测试通过
   ```bash
   bun run build && bun run test:run
   ```

### 测试通过标准
- 所有测试必须通过 (`bun run test:run` exit code 0)
- TypeScript 编译必须通过 (`bun run build`)
- 覆盖率建议: 核心业务逻辑 > 70%

### 常见测试场景

| 场景 | 测试命令 | 预期结果 |
|------|---------|---------|
| 修改 storage.ts | `bun run test:run` | storage.test.ts 全部通过 |
| 修改 API 路由 | `bun run test:run` | api.test.ts 全部通过 |
| 修改数据库 Schema | `bun run build && bun run test:run` | 编译成功 + 测试通过 |
| 发布新功能 | `bun run build && bun run test:run` | 全部通过才能提交 |

## Environment Variables
- Backend: `backend/.env`
- Frontend: `.env.local` (Nuxt)
