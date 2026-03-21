# ClawHub CLI Regression Test Specification

This document contains regression test cases for verifying CLI compatibility with the backend API.

## Test Environment Setup

```bash
# Start backend
cd backend
bun run dev

# Set CLI to use local backend
export CLAWHUB_REGISTRY=http://localhost:3001

# Get auth token and login
TOKEN=$(curl -s "http://localhost:3001/auth/callback?code=mock_admin" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
clawhub login --token "$TOKEN" --no-browser
```

## Test Cases

### 1. Authentication

| Command | Expected Result | API Endpoint |
|---------|----------------|---------------|
| `clawhub login --token <token> --no-browser` | ✔ OK. Logged in as @mock_admin | POST /auth/callback |
| `clawhub whoami` | ✔ mock_admin | GET /api/v1/whoami |

### 2. Skill Discovery

| Command | Expected Result | API Endpoint |
|---------|----------------|---------------|
| `clawhub search <query>` | Returns matching skills with scores | GET /api/v1/search |
| `clawhub explore` | Returns latest updated skills | GET /api/v1/skills |
| `clawhub inspect <slug>` | Returns skill metadata and versions | GET /api/v1/skills/:slug |

### 3. Skill Installation

| Command | Expected Result | API Endpoint |
|---------|----------------|---------------|
| `clawhub install <slug> --dir <path>` | ✔ OK. Installed skill | GET /api/v1/download |
| `clawhub update <slug>` | ✔ skill: updated | GET /api/v1/resolve, GET /api/v1/download |
| `clawhub list` | Returns installed skills from lockfile | Local only |

### 4. Skill Publishing

| Command | Expected Result | API Endpoint |
|---------|----------------|---------------|
| `clawhub publish <path> --version <ver> --changelog <msg>` | ✔ OK. Published skill@version | POST /api/v1/skills |
| `clawhub delete <slug> --yes` | ✔ OK. Deleted skill | DELETE /api/v1/skills/:slug |
| `clawhub undelete <slug> --yes` | ✔ OK. Undeleted skill | POST /api/v1/skills/:slug/undelete |

### 5. Skill Management

| Command | Expected Result | API Endpoint |
|---------|----------------|---------------|
| `clawhub star <slug> --yes` | ✔ OK. Starred skill | POST /api/v1/stars/:slug |
| `clawhub unstar <slug> --yes` | ✔ OK. Unstarred skill | DELETE /api/v1/stars/:slug |

## Manual Test Script

```bash
#!/bin/bash
set -e

export CLAWHUB_REGISTRY=http://localhost:3001

echo "=== Getting auth token ==="
TOKEN=$(curl -s "http://localhost:3001/auth/callback?code=mock_admin" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

echo "=== Logging in ==="
clawhub login --token "$TOKEN" --no-browser

echo "=== Testing whoami ==="
clawhub whoami

echo "=== Testing search ==="
clawhub search self

echo "=== Testing inspect ==="
clawhub inspect self-improving-agent-final

echo "=== Testing install ==="
mkdir -p /tmp/test-skills
clawhub install self-improving-agent-final --dir /tmp/test-skills

echo "=== Testing list ==="
clawhub list

echo "=== Testing update ==="
clawhub update self-improving-agent-final

echo "=== Testing explore ==="
clawhub explore

echo "=== Testing publish ==="
mkdir -p /tmp/test-skill
echo "---
name: test
description: Test skill
---
# Test" > /tmp/test-skill/SKILL.md
clawhub publish /tmp/test-skill --version 1.0.0 --changelog "Test"

echo "=== Testing star ==="
clawhub star test --yes

echo "=== Testing unstar ==="
clawhub unstar test --yes

echo "=== Testing delete ==="
clawhub delete test --yes

echo "=== Testing undelete ==="
clawhub undelete test --yes

echo "=== All tests passed ==="
```

## Known Issues Fixed

1. **Download endpoint returning 500**: Files were stored as `[object Object]` string instead of JSON
   - Fix: JSON.stringify files before storing in PostgreSQL text column
   - Fix: Parse JSON string when reading files from database

2. **Star/Unstar returning 404**: Route was `/stars?skillId=` instead of `/stars/:slug`
   - Fix: Changed route to accept slug in path

3. **Undelete returning 404**: Missing endpoint implementation
   - Fix: Added `/skills/:slug/undelete` endpoint

## Database Schema Notes

The following columns store JSON data as text and require manual serialization:

- `skill_versions.files` - Array of file objects
- `skill_versions.frontmatter` - Object
- `skill_versions.metadata` - Mixed object
- `skill_versions.clawdis` - Object
- `soul_versions.files` - Array of file objects
- `soul_versions.frontmatter` - Object
- `soul_versions.metadata` - Mixed object
- `soul_versions.clawdis` - Object

When inserting, use `JSON.stringify()`. When reading, use `JSON.parse()`.
