#!/usr/bin/env node
// 内置迁移脚本：在 Docker 容器启动时执行数据库迁移
import postgres from "postgres";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
// __dirname = backend/dist/scripts/ → drizzle 在 backend/dist/drizzle
const drizzleDir = join(__dirname, "../drizzle");
const connectionString = process.env.DATABASE_URL || "postgresql://clawhub:clawhub@localhost:5432/clawhub";

const sql = postgres(connectionString);

async function main() {
  // 创建迁移跟踪表
  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS "_migrations" (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      applied_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // 获取已应用的迁移
  const applied = await sql`SELECT name FROM _migrations ORDER BY name`;
  const appliedSet = new Set(applied.map((r) => r.name));

  // 读取所有迁移文件（按文件名排序）
  const files = readdirSync(drizzleDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (appliedSet.has(file)) {
      console.log(`Skipping ${file} (already applied)`);
      continue;
    }

    console.log(`Applying migration: ${file}`);
    const content = readFileSync(join(drizzleDir, file), "utf-8");

    // 按 "--> statement-breakpoint" 分割并执行每个语句
    const statements = content.split(/-->\s*statement-breakpoint\s*/).filter(Boolean);
    for (const stmt of statements) {
      const trimmed = stmt.trim();
      if (trimmed) {
        await sql.unsafe(trimmed);
      }
    }

    // 记录已应用的迁移
    await sql`INSERT INTO _migrations (name) VALUES (${file})`;
    console.log(`Applied: ${file}`);
  }

  console.log("Migrations complete.");
  await sql.end();
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
