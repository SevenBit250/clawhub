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
- PRs: focused changes, include test commands, screenshots for UI changes
- **Never commit** `.env` or credentials

## Environment Variables
- Backend: `backend/.env`
- Frontend: `.env.local` (Nuxt)
