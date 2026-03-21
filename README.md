<p align="center">
  <img src="public/clawd-logo.png" alt="ClawHub" width="120">
</p>

<h1 align="center">ClawHub</h1>

<p align="center">
  <a href="https://github.com/openclaw/clawhub/actions/workflows/ci.yml?branch=main"><img src="https://img.shields.io/github/actions/workflow/status/openclaw/clawhub/ci.yml?branch=main&style=for-the-badge" alt="CI status"></a>
  <a href="https://discord.gg/clawd"><img src="https://img.shields.io/discord/1456350064065904867?label=Discord&logo=discord&logoColor=white&color=5865F2&style=for-the-badge" alt="Discord"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="MIT License"></a>
</p>

ClawHub is the **public skill registry for Clawdbot**: publish, version, and search text-based agent skills (a `SKILL.md` plus supporting files).

<p align="center">
  <a href="https://clawhub.ai">ClawHub</a> ·
  <a href="https://onlycrabs.ai">onlycrabs.ai</a> ·
  <a href="VISION.md">Vision</a> ·
  <a href="docs/README.md">Docs</a> ·
  <a href="CONTRIBUTING.md">Contributing</a> ·
  <a href="https://discord.gg/clawd">Discord</a>
</p>

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Nuxt 3 + Vue 3 |
| Backend | Fastify |
| Database | PostgreSQL + pgvector |
| ORM | Drizzle |
| Task Queue | BullMQ (Redis) |
| Auth | JWT Session |

## Features

- Browse skills + render their `SKILL.md`
- Publish new skill versions with changelogs + tags
- Rename owned skills without breaking old links
- Merge duplicate owned skills into one canonical slug
- Browse souls + render their `SOUL.md`
- Star + comment; admins/mods can curate skills
- Vector search powered by pgvector

## CLI

```bash
clawhub login                    # Authenticate
clawhub whoami                  # Check current user
clawhub search <query>          # Search skills
clawhub inspect <slug>         # View skill details
clawhub publish <path>          # Publish a skill
clawhub delete <slug>           # Soft-delete a skill
clawhub skill rename <slug> <new-slug>   # Rename skill
clawhub skill merge <source> <target>    # Merge skills
```

## API

Full v1 API for CLI and integrations:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/whoami` | GET | Current user |
| `/api/v1/users` | GET | User search |
| `/api/v1/skills` | GET | List skills |
| `/api/v1/skills/:slug` | GET | Skill detail |
| `/api/v1/skills` | POST | Publish skill |
| `/api/v1/search` | GET | Search skills |
| `/api/v1/resolve` | GET | Resolve version |
| `/api/v1/download` | GET | Download bundle |
| `/api/v1/stars` | POST/DELETE | Star operations |
| `/api/v1/transfers` | GET/POST | Ownership transfer |

## Local Dev

Prereqs: [Bun](https://bun.sh/), Docker

```bash
# Start PostgreSQL + Redis
docker compose -f docker-compose.dev.yml up -d

# Backend (port 3001)
cd backend && bun install && bun run dev

# Frontend (port 3000)
cd frontend && bun install && bun run dev

# Mock OAuth login
curl http://localhost:3001/auth/url
curl "http://localhost:3001/auth/callback?code=mock_admin"
```

### Commands

```bash
# Backend
cd backend
bun run dev              # Start dev server
bun run build            # TypeScript build
bun run db:generate      # Generate Drizzle migrations
bun run db:migrate       # Run migrations
bun run db:studio        # Database browser

# Frontend
cd frontend
bun run dev              # Start Nuxt dev server
bun run build            # Production build

# TypeScript checking
bunx tsc --noEmit
bunx tsc -p packages/schema --noEmit
bunx tsc -p packages/clawdhub --noEmit
```

## Project Structure

```
clawhub/
├── backend/              # Fastify API server
│   └── src/
│       ├── auth/        # Authentication (JWT, WeCom OAuth)
│       ├── db/          # Drizzle schema
│       ├── lib/         # Business logic
│       └── routes/      # API routes
│           ├── v1/      # v1 API endpoints
│           └── legacy/  # CLI compatibility
├── frontend/            # Nuxt 3 app
│   ├── pages/           # Route pages
│   ├── composables/     # Vue composables
│   └── layouts/         # App layouts
├── packages/
│   ├── schema/          # Shared API types (ArkType)
│   └── clawdhub/        # CLI tool
└── docs/               # Documentation
```

## Environment Variables

### Backend (`backend/.env`)

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/clawhub
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
PORT=3001
```

### Frontend (`.env.local`)

```env
NUXT_PUBLIC_API_URL=http://localhost:3001
```

## Skill Format

Skills contain a `SKILL.md` with metadata in frontmatter:

```yaml
---
name: my-skill
description: Does a useful thing
metadata:
  clawdbot:
    requires:
      env:
        - API_KEY
      bins:
        - curl
---
# Skill content here
```
