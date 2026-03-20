# 仓库指南

本文档为在此仓库中工作的 AI 编程助手提供指导。

## 项目结构与模块组织

- `src/` — TanStack Start 应用代码（路由、组件、样式）。
- `convex/` — Convex 后端（schema、查询/变更/动作、HTTP 路由）。
- `convex/_generated/` — 生成的 Convex API/类型；已提交到仓库用于构建。
- `packages/clawdhub/` — CLI 实现（`clawhub` 命令）。
- `packages/schema/` — CLI 和应用共享的 API 类型/路由。
- `docs/` — 产品/规格文档（见 `docs/spec.md`）。
- `public/` — 静态资源。

## 构建、测试和开发命令

```bash
# 开发
bun run dev                    # 本地应用服务器 http://localhost:3000
bunx convex dev               # Convex 开发部署 + 函数监听
bunx convex codegen            # 重新生成 convex/_generated/

# 构建和预览
bun run build                  # 生产构建（Vite + Nitro）
bun run preview                # 预览构建产物

# 代码检查和格式化
bun run lint                   # oxlint（类型感知）
bun run lint:fix               # oxlint --fix + oxfmt 格式化
bun run format                 # oxfmt（写入更改）

# 测试
bun run test                   # Vitest 单元测试（全部）
bun run test:watch             # Vitest 监听模式
bun run test <file>            # 运行单个测试文件
bun run coverage                # 覆盖率运行；阈值 >= 80%
bun run test:e2e               # 端到端测试（vitest 配置）
bun run test:pw                # Playwright 测试
bun run test:e2e:prod-http     # 生产环境 HTTP 冒烟测试
bun run test:e2e:local         # 本地 Playwright 测试

# 验证
bunx tsc -p packages/schema/tsconfig.json --noEmit
bunx tsc -p packages/clawdhub/tsconfig.json --noEmit
bun run verify:convex-contract  # 验证 Convex schema 契约
```

## 代码风格与约定

### TypeScript
- **严格模式已启用** — 禁止 `any`，禁止隐式 any
- ESM 模块（`package.json` 中 `"type": "module"`）
- 目标：ES2022
- 类型仅导入时使用 `import type`

### 格式化和代码检查
- **工具：oxlint**（类型感知）+ **oxfmt** 格式化
- 缩进：2 空格
- 引号：单引号（`'string'`）
- 尾随逗号：始终保留
- 语句末尾不加分号
- **禁止使用 `as any`** — 使用正确的类型
- **禁止通过 `// eslint-disable` 等注释抑制 lint 错误**

### 命名约定
| 模式 | 约定 | 示例 |
|---------|------------|---------|
| Convex 函数 | 动词优先 | `getBySlug`, `publishVersion`, `listSkills` |
| React 组件 | PascalCase | `SkillCard`, `UserProfile` |
| 文件名 | kebab-case | `skill-card.tsx`, `use-auth.ts` |
| 类型/接口 | PascalCase | `PublicSkill`, `SkillMetadata` |
| 常量 | SCREAMING_SNAKE | `MAX_FILE_SIZE`, `DEFAULT_PAGE_SIZE` |
| CSS 类名 | kebab-case（Tailwind） | `flex items-center gap-2` |

### 导入模式
```typescript
// Node 内置模块
import { copyFile, mkdir } from "node:fs/promises";
import path from "node:path";

// React/TanStack
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery } from "convex/react";

// Convex 生成的代码（使用路径别名）
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";

// 本地导入（相对路径）
import { formatCompactStat } from "../lib/numberFormat";
```

### 错误处理
- **Convex 错误**：使用 `throw new Error("message")` — Convex 会将其序列化传给客户端
- **HTTP 处理器**：返回适当状态码的错误响应
- **绝不吞掉错误**：始终处理或重新抛出
- **禁止空 catch 块**：`catch (err) { ... }` 必须包含有意义的处理
- 用户可见错误使用 `src/lib/convexError.ts` 中的 `getUserFacingConvexError()`

### React 组件模式
```tsx
// 路由组件使用 createFileRoute
import { createFileRoute } from "@tanstack/react-router";

export function Route() {
  const data = useQuery(api.my.query);
  // ...
}

// 组件使用命名导出
export function SkillCard({ skill }: { skill: PublicSkill }) {
  // ...
}
```

## 测试指南

- **框架**：Vitest 4 + jsdom（用于 DOM 测试）
- **测试文件**：就近放置或放在 `**/*.test.ts` / `**/*.test.tsx`
- **E2E 测试**：`e2e/**` 和 `*.e2e.test.ts` 文件
- **覆盖率阈值**：全局 80%（行/函数/分支/语句）
- **超时时间**：15 秒（testTimeout/hookTimeout）

```typescript
// 标准测试导入模式
import { describe, expect, it } from "vitest";

// 示例测试结构
describe("SkillCard", () => {
  it("渲染技能名称", () => {
    expect(screen.getByText("my-skill")).toBeInTheDocument();
  });
});
```

## Convex 开发

### 函数类型
- `query({ handler: ... })` — 读取数据，默认缓存
- `mutation({ handler: ... })` — 写入数据
- `action({ handler: ... })` — 副作用，可调用外部 API
- `internalQuery` / `internalMutation` — 仅内部使用（无 HTTP 暴露）
- `httpAction` — HTTP 可访问的动作

### 关键模式
- **函数命名**：动词优先（`getBySlug`、`publishVersion`）
- **索引查询**：使用 `.withIndex("index_name")` 而非 `.filter()`
- **文档读取**：Convex 读取整个文档；对大文档进行反规范化
- **分页**：对大数据集使用游标分页
- **回填**：为新的反规范化字段编写基于游标的回填

### Convex 注意事项
- 新函数需要在 `convex run` 之前推送：使用 `bunx convex dev --once`
- 如果 auth 失败，使用 `--deployment-name` 而非 `--env-file`
- 部署前检查 `bunx convex insights` 了解带宽问题

## 提交和 Pull Request 指南

- **提交信息**：遵循 Conventional Commits（`feat:`、`fix:`、`chore:`、`docs:`…）
- **PR**：小范围更改，包含所运行的测试命令，UI 更改附上截图
- **合并前**：TypeScript 检查 + lint 通过（CI 门禁）
- **密钥**：绝不提交 `.env.local` 或凭证信息

## Git 注意事项

- 分支删除被阻止？直接删除引用：`git update-ref -d refs/heads/<branch>`
- 多行 `gh` 评论：使用 `--body-file` 或 stdin/heredoc，绝不传递字面量 `\n`

## 配置与安全

- **本地环境**：`.env.local`（已 gitignore，绝不提交）
- **Convex 环境**：通过 `bunx convex env set` 单独存储
- **Vercel 只需**：`VITE_CONVEX_URL` + `VITE_CONVEX_SITE_URL`
- **OAuth**：需要 GitHub OAuth App 凭证

## URL 参考

- 规范站点：`https://clawhub.ai`
- 技能页面：`https://clawhub.ai/<owner>/<slug>`
- API 详情：`https://clawhub.ai/api/v1/skills/<slug>`
- 技能文件：`https://clawhub.ai/api/v1/skills/<slug>/file?path=SKILL.md`
