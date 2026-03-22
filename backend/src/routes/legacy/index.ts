import { FastifyInstance } from "fastify";
import { validateSession } from "../../auth/session.js";
import { db } from "../../db/index.js";
import { skills, skillVersions, users } from "../../db/schema.js";
import { eq, and, isNull } from "drizzle-orm";
import { searchSkills } from "../../lib/search.js";

export async function registerLegacyRoutes(fastify: FastifyInstance) {
  fastify.get("/api/cli/whoami", {
    schema: {
      description: "CLI获取当前用户",
      tags: ["cli"],
      headers: {
        type: "object",
        properties: {
          authorization: { type: "string" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            user: { type: "object", nullable: true, properties: { handle: { type: "string", nullable: true } } },
          },
        },
      },
    },
    async handler(request) {
    const auth = request.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      return { user: null };
    }
    const session = await validateSession(auth.slice(7));
    if (!session) return { user: null };
    const [user] = await db.select({ handle: users.handle }).from(users).where(eq(users.id, session.userId)).limit(1);
    return { user: user ? { handle: user.handle } : null };
    },
  });

  fastify.get("/api/cli/upload-url", {
    schema: {
      description: "CLI获取上传URL",
      tags: ["cli"],
      response: {
        200: {
          type: "object",
          properties: {
            uploadUrl: { type: "string" },
          },
        },
      },
    },
    async handler() {
    return { uploadUrl: "/storage/upload" };
    },
  });

  fastify.get("/api/cli/publish", {
    schema: {
      description: "CLI检查技能发布状态",
      tags: ["cli"],
      headers: {
        type: "object",
        required: ["authorization"],
        properties: {
          authorization: { type: "string" },
        },
      },
      querystring: {
        type: "object",
        required: ["slug"],
        properties: {
          slug: { type: "string" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            ok: { type: "boolean" },
            skillId: { type: "string" },
            versionId: { type: "string" },
          },
        },
      },
    },
    async handler(request) {
    const auth = request.headers.authorization;
    if (!auth?.startsWith("Bearer ")) throw { statusCode: 401, message: "Unauthorized" };
    const session = await validateSession(auth.slice(7));
    if (!session) throw { statusCode: 401, message: "Unauthorized" };
    const { slug } = request.query as { slug?: string };
    if (!slug) throw { statusCode: 400, message: "slug required" };
    const [skill] = await db.select({ id: skills.id }).from(skills).where(eq(skills.slug, slug)).limit(1);
    if (!skill) throw { statusCode: 404, message: "Skill not found" };
    return { ok: true, skillId: skill.id, versionId: "" };
    },
  });

  fastify.post("/api/cli/telemetry/sync", {
    schema: {
      description: "CLI遥需同步",
      tags: ["cli"],
      response: {
        200: {
          type: "object",
          properties: {
            ok: { type: "boolean" },
          },
        },
      },
    },
    async handler() {
    return { ok: true };
    },
  });

  fastify.delete("/api/cli/skill/delete", {
    schema: {
      description: "CLI删除技能",
      tags: ["cli"],
      headers: {
        type: "object",
        required: ["authorization"],
        properties: {
          authorization: { type: "string" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            ok: { type: "boolean" },
          },
        },
      },
    },
    async handler(request) {
    const auth = request.headers.authorization;
    if (!auth?.startsWith("Bearer ")) throw { statusCode: 401, message: "Unauthorized" };
    const session = await validateSession(auth.slice(7));
    if (!session) throw { statusCode: 401, message: "Unauthorized" };
    return { ok: true };
    },
  });

  fastify.post("/api/cli/skill/undelete", {
    schema: {
      description: "CLI恢复删除的技能",
      tags: ["cli"],
      headers: {
        type: "object",
        required: ["authorization"],
        properties: {
          authorization: { type: "string" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            ok: { type: "boolean" },
          },
        },
      },
    },
    async handler(request) {
    const auth = request.headers.authorization;
    if (!auth?.startsWith("Bearer ")) throw { statusCode: 401, message: "Unauthorized" };
    const session = await validateSession(auth.slice(7));
    if (!session) throw { statusCode: 401, message: "Unauthorized" };
    return { ok: true };
    },
  });

  fastify.get("/api/skill", {
    schema: {
      description: "获取技能信息",
      tags: ["legacy"],
      querystring: {
        type: "object",
        required: ["slug"],
        properties: {
          slug: { type: "string" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            skill: { type: "object", nullable: true },
          },
        },
      },
    },
    async handler(request) {
    const { slug } = request.query as { slug?: string };
    if (!slug) throw { statusCode: 400, message: "slug required" };
    const [skill] = await db.select().from(skills).where(eq(skills.slug, slug)).limit(1);
    if (!skill) return { skill: null };
    return { skill };
    },
  });

  fastify.get("/api/skill/resolve", {
    schema: {
      description: "解析技能版本",
      tags: ["legacy"],
      querystring: {
        type: "object",
        properties: {
          slug: { type: "string" },
          version: { type: "string" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            match: { type: "object", nullable: true, properties: { version: { type: "string" } } },
            latestVersion: { type: "object", nullable: true, properties: { version: { type: "string" } } },
          },
        },
      },
    },
    async handler(request) {
    const { slug, version } = request.query as { slug?: string; version?: string };
    if (!slug) return { match: null, latestVersion: null };
    const [skill] = await db.select({ latestVersionId: skills.latestVersionId }).from(skills).where(eq(skills.slug, slug)).limit(1);
    if (!skill) return { match: null, latestVersion: null };
    if (version) {
      const [v] = await db.select({ version: skillVersions.version }).from(skillVersions).where(eq(skillVersions.version, version)).limit(1);
      return { match: v ? { version: v.version } : null, latestVersion: null };
    }
    return { match: null, latestVersion: null };
    },
  });

  fastify.get("/api/download", {
    schema: {
      description: "下载技能包（重定向到v1）",
      tags: ["legacy"],
      querystring: {
        type: "object",
        required: ["slug"],
        properties: {
          slug: { type: "string" },
          version: { type: "string" },
        },
      },
      response: {
        200: {
          type: "string",
        },
      },
    },
    async handler(request, reply) {
    const { slug, version } = request.query as { slug?: string; version?: string };
    if (!slug) throw { statusCode: 400, message: "slug required" };
    reply.redirect(`/api/v1/download?slug=${slug}${version ? `&version=${version}` : ""}`);
    },
  });

  fastify.get("/api/search", {
    schema: {
      description: "搜索技能",
      tags: ["legacy"],
      querystring: {
        type: "object",
        properties: {
          q: { type: "string" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            results: { type: "array" },
          },
        },
      },
    },
    async handler(request) {
    const { q } = request.query as { q?: string };
    if (!q) return { results: [] };
    const results = await searchSkills(q, { limit: 20, offset: 0 });
    return { results };
    },
  });
}
