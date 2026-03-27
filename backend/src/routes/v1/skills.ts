import { db } from "../../db/index.js";
import { skills, skillVersions, users, skillSlugAliases } from "../../db/schema.js";
import { eq, and, isNull, desc, lt, sql, ne, like, or } from "drizzle-orm";
import type { FastifyPluginAsync } from "fastify";
import { requireAuth } from "../../auth/session.js";
import { createSkill, createSkillVersion } from "../../lib/skills.js";

interface CursorPayload {
  updatedAt: number;
  id: string;
}

function encodeCursor(updatedAt: Date, id: string): string {
  const payload: CursorPayload = {
    updatedAt: updatedAt.getTime(),
    id,
  };
  return Buffer.from(JSON.stringify(payload)).toString("base64url");
}

function decodeCursor(cursor: string): CursorPayload | null {
  try {
    const decoded = Buffer.from(cursor, "base64url").toString();
    return JSON.parse(decoded) as CursorPayload;
  } catch {
    return null;
  }
}

function toUnixMs(timestamp: Date): number {
  return timestamp.getTime();
}

function parseTags(tags: unknown): Record<string, string> {
  if (!tags) return {};
  if (typeof tags === "object") return tags as Record<string, string>;
  try {
    return JSON.parse(tags as string) as Record<string, string>;
  } catch {
    return {};
  }
}

function parseReasonCodes(reasonCodes: unknown): string[] | null {
  if (!reasonCodes) return null;
  if (Array.isArray(reasonCodes)) return reasonCodes as string[];
  try {
    return JSON.parse(reasonCodes as string) as string[];
  } catch {
    return null;
  }
}

interface SkillRow {
  id: string;
  slug: string;
  displayName: string;
  summary: string | null;
  tags: unknown;
  statsDownloads: number;
  statsStars: number;
  statsInstallsCurrent: number;
  statsInstallsAllTime: number;
  createdAt: Date;
  updatedAt: Date;
  latestVersionId: string | null;
}

interface SkillVersionRow {
  id: string;
  version: string;
  changelog: string;
  license: string | null;
  createdAt: Date;
}

const listSkills: FastifyPluginAsync = async (fastify) => {
  fastify.get("/skills", {
    schema: {
      description: "获取技能列表",
      tags: ["skills"],
      querystring: {
        type: "object",
        properties: {
          limit: { type: "string", description: "返回数量" },
          cursor: { type: "string", description: "分页游标" },
          sort: { type: "string", enum: ["updated", "downloads", "stars", "installs"], description: "排序方式" },
          q: { type: "string", description: "搜索关键词" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  slug: { type: "string" },
                  displayName: { type: "string" },
                  summary: { type: "string", nullable: true },
                  tags: { type: "object" },
                  stats: {
                    type: "object",
                    properties: {
                      downloads: { type: "number" },
                      stars: { type: "number" },
                      installs: { type: "number" },
                    },
                  },
                  createdAt: { type: "number" },
                  updatedAt: { type: "number" },
                  latestVersion: {
                    type: "object",
                    nullable: true,
                    properties: {
                      version: { type: "string" },
                      createdAt: { type: "number" },
                      changelog: { type: "string", nullable: true },
                      license: { type: "string", nullable: true },
                    },
                  },
                  owner: {
                    type: "object",
                    nullable: true,
                    properties: {
                      handle: { type: "string", nullable: true },
                      displayName: { type: "string", nullable: true },
                    },
                  },
                },
              },
            },
            total: { type: "number" },
            nextCursor: { type: "string", nullable: true },
          },
        },
      },
    },
    async handler(request) {
    const { limit: limitStr, cursor, sort, q } = request.query as {
      limit?: string;
      cursor?: string;
      sort?: "updated" | "downloads" | "stars" | "installs";
      q?: string;
    };

    const limit = Math.min(parseInt(limitStr || "20") || 20, 100);
    const sortBy = sort || "updated";

    let orderByColumn;
    switch (sortBy) {
      case "downloads":
        orderByColumn = skills.statsDownloads;
        break;
      case "stars":
        orderByColumn = skills.statsStars;
        break;
      case "installs":
        orderByColumn = skills.statsInstallsAllTime;
        break;
      default:
        orderByColumn = skills.updatedAt;
    }

    const conditions: ReturnType<typeof eq>[] = [
      isNull(skills.softDeletedAt),
      ne(skills.moderationStatus, "pending"),
      ne(skills.moderationStatus, "removed"),
    ];

    if (q && q.trim()) {
      const searchTerm = `%${q.trim()}%`;
      conditions.push(
        or(
          like(skills.displayName, searchTerm),
          like(skills.slug, searchTerm),
          like(skills.summary, searchTerm)
        )!
      );
    }

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(skills)
      .where(and(...conditions));

    if (cursor) {
      const cursorData = decodeCursor(cursor);
      if (cursorData) {
        conditions.push(lt(skills.updatedAt, new Date(cursorData.updatedAt)));
      }
    }

    const skillRows = await db
      .select({
        id: skills.id,
        slug: skills.slug,
        displayName: skills.displayName,
        summary: skills.summary,
        tags: skills.tags,
        statsDownloads: skills.statsDownloads,
        statsStars: skills.statsStars,
        statsInstallsCurrent: skills.statsInstallsCurrent,
        statsInstallsAllTime: skills.statsInstallsAllTime,
        createdAt: skills.createdAt,
        updatedAt: skills.updatedAt,
        latestVersionId: skills.latestVersionId,
        ownerUserId: skills.ownerUserId,
      })
      .from(skills)
      .where(and(...conditions))
      .orderBy(desc(orderByColumn), desc(skills.id))
      .limit(limit + 1);

    const hasNextPage = skillRows.length > limit;
    const items = skillRows.slice(0, limit);

    // Fetch owners for all skills
    const ownerUserIds = [...new Set(items.map((s) => s.ownerUserId).filter((id): id is string => id !== null))];
    const ownerRows = ownerUserIds.length > 0
      ? await db.select({ id: users.id, handle: users.handle, displayName: users.displayName }).from(users).where(sql`${users.id} IN ${ownerUserIds}`)
      : [];
    const ownerMap = new Map(ownerRows.map((u) => [u.id, u]));

    const latestVersionIds = items
      .map((s) => s.latestVersionId)
      .filter((id): id is string => id !== null);

    const versionRows = latestVersionIds.length > 0
      ? await db
          .select({
            id: skillVersions.id,
            skillId: skillVersions.skillId,
            version: skillVersions.version,
            changelog: skillVersions.changelog,
            license: skillVersions.license,
            createdAt: skillVersions.createdAt,
          })
          .from(skillVersions)
          .where(sql`${skillVersions.id} IN ${latestVersionIds}`)
      : [];

    const versionMap = new Map(versionRows.map((v) => [v.skillId, v]));

    const responseItems = items.map((skill) => {
      const latestVersion = versionMap.get(skill.id);
      const owner = skill.ownerUserId ? ownerMap.get(skill.ownerUserId) : null;
      return {
        slug: skill.slug,
        displayName: skill.displayName,
        summary: skill.summary,
        tags: parseTags(skill.tags),
        stats: {
          downloads: skill.statsDownloads,
          stars: skill.statsStars,
          installs: skill.statsInstallsAllTime,
        },
        createdAt: toUnixMs(skill.createdAt),
        updatedAt: toUnixMs(skill.updatedAt),
        latestVersion: latestVersion
          ? {
              version: latestVersion.version,
              createdAt: toUnixMs(latestVersion.createdAt),
              changelog: latestVersion.changelog,
              license: latestVersion.license as "MIT-0" | null,
            }
          : undefined,
        owner: owner
          ? { handle: owner.handle, displayName: owner.displayName }
          : null,
      };
    });

    let nextCursor: string | null = null;
    if (hasNextPage && items.length > 0) {
      const lastItem = items[items.length - 1];
      nextCursor = encodeCursor(lastItem.updatedAt, lastItem.id);
    }

    return {
      items: responseItems,
      total: count,
      nextCursor,
    };
    },
  });
};

const getSkillBySlug: FastifyPluginAsync = async (fastify) => {
  fastify.get("/skills/:slug", {
    schema: {
      description: "获取技能详情",
      tags: ["skills"],
      params: {
        type: "object",
        required: ["slug"],
        properties: {
          slug: { type: "string" },
        },
      },
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
            skill: {
              type: "object",
              nullable: true,
              properties: {
                id: { type: "string" },
                slug: { type: "string" },
                displayName: { type: "string" },
                summary: { type: "string", nullable: true },
                tags: { type: "object" },
                stats: {
                  type: "object",
                  properties: {
                    downloads: { type: "number" },
                    stars: { type: "number" },
                    installs: { type: "number" },
                  },
                },
                createdAt: { type: "number" },
                updatedAt: { type: "number" },
              },
            },
            latestVersion: {
              type: "object",
              nullable: true,
              properties: {
                version: { type: "string" },
                createdAt: { type: "number" },
                changelog: { type: "string", nullable: true },
                license: { type: "string", nullable: true },
              },
            },
            owner: {
              type: "object",
              nullable: true,
              properties: {
                handle: { type: "string", nullable: true },
                displayName: { type: "string", nullable: true },
                image: { type: "string", nullable: true },
              },
            },
            moderation: {
              type: "object",
              nullable: true,
              properties: {
                isSuspicious: { type: "boolean" },
                isMalwareBlocked: { type: "boolean" },
                verdict: { type: "string", nullable: true },
                reasonCodes: { type: "array", items: { type: "string" }, nullable: true },
                updatedAt: { type: "number", nullable: true },
                engineVersion: { type: "string", nullable: true },
                summary: { type: "string", nullable: true },
              },
            },
          },
        },
      },
    },
    async handler(request) {
    const { slug } = request.params as { slug: string };

    // Check if requester can see pending/removed skills
    let canSeePending = false;
    let isOwner = false;
    let requesterId: string | null = null;
    const auth = request.headers.authorization;
    if (auth?.startsWith("Bearer ")) {
      try {
        const { getTokenFromRequest, validateSession } = await import("../../auth/session.js");
        const session = await validateSession(auth.slice(7));
        if (session) {
          const [user] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, session.userId)).limit(1);
          if (user) {
            requesterId = user.id;
            if (user.role === "admin" || user.role === "moderator") {
              canSeePending = true;
            }
          }
        }
      } catch {
        // Ignore auth errors, treat as unauthenticated
      }
    }

    // First get the skill to check ownership
    const [skillCheck] = await db
      .select({ ownerUserId: skills.ownerUserId })
      .from(skills)
      .where(and(eq(skills.slug, slug), isNull(skills.softDeletedAt)))
      .limit(1);

    if (skillCheck && skillCheck.ownerUserId === requesterId) {
      isOwner = true;
    }

    const conditions = [eq(skills.slug, slug), isNull(skills.softDeletedAt)];
    if (!canSeePending) {
      // Moderators/admins can see all non-deleted skills
      // Owners can see their own pending/removed skills
      // Others can only see active/hidden skills
      if (!isOwner) {
        conditions.push(ne(skills.moderationStatus, "pending") as any);
        conditions.push(ne(skills.moderationStatus, "removed") as any);
      }
    }

    const skillRows = await db
      .select({
        id: skills.id,
        slug: skills.slug,
        displayName: skills.displayName,
        summary: skills.summary,
        tags: skills.tags,
        statsDownloads: skills.statsDownloads,
        statsStars: skills.statsStars,
        statsInstallsCurrent: skills.statsInstallsCurrent,
        statsInstallsAllTime: skills.statsInstallsAllTime,
        createdAt: skills.createdAt,
        updatedAt: skills.updatedAt,
        latestVersionId: skills.latestVersionId,
        ownerUserId: skills.ownerUserId,
        moderationStatus: skills.moderationStatus,
        isSuspicious: skills.isSuspicious,
        moderationVerdict: skills.moderationVerdict,
        moderationReasonCodes: skills.moderationReasonCodes,
        moderationEvaluatedAt: skills.moderationEvaluatedAt,
        moderationEngineVersion: skills.moderationEngineVersion,
        moderationSummary: skills.moderationSummary,
        ownerHandle: users.handle,
        ownerDisplayName: users.displayName,
        ownerImage: users.image,
      })
      .from(skills)
      .leftJoin(users, eq(skills.ownerUserId, users.id))
      .where(and(...conditions))
      .limit(1);

    const skillRow = skillRows[0];

    if (!skillRow) {
      return {
        skill: null,
        latestVersion: null,
        owner: null,
        moderation: null,
      };
    }

    let latestVersion = null;
    if (skillRow.latestVersionId) {
      const versionRows = await db
        .select({
          version: skillVersions.version,
          createdAt: skillVersions.createdAt,
          changelog: skillVersions.changelog,
          license: skillVersions.license,
        })
        .from(skillVersions)
        .where(eq(skillVersions.id, skillRow.latestVersionId))
        .limit(1);

      if (versionRows[0]) {
        latestVersion = {
          version: versionRows[0].version,
          createdAt: toUnixMs(versionRows[0].createdAt),
          changelog: versionRows[0].changelog,
          license: versionRows[0].license as "MIT-0" | null,
        };
      }
    }

    return {
      skill: {
        id: skillRow.id,
        slug: skillRow.slug,
        displayName: skillRow.displayName,
        summary: skillRow.summary,
        tags: parseTags(skillRow.tags),
        moderationStatus: skillRow.moderationStatus,
        stats: {
          downloads: skillRow.statsDownloads,
          stars: skillRow.statsStars,
          installs: skillRow.statsInstallsAllTime,
        },
        createdAt: toUnixMs(skillRow.createdAt),
        updatedAt: toUnixMs(skillRow.updatedAt),
      },
      latestVersion,
      owner: {
        handle: skillRow.ownerHandle,
        displayName: skillRow.ownerDisplayName,
        image: skillRow.ownerImage,
      },
      moderation: {
        isSuspicious: skillRow.isSuspicious ?? false,
        isMalwareBlocked: skillRow.moderationVerdict === "malicious",
        verdict: skillRow.moderationVerdict ?? undefined,
        reasonCodes: parseReasonCodes(skillRow.moderationReasonCodes) ?? undefined,
        updatedAt: skillRow.moderationEvaluatedAt
          ? toUnixMs(skillRow.moderationEvaluatedAt)
          : null,
        engineVersion: skillRow.moderationEngineVersion ?? undefined,
        summary: skillRow.moderationSummary ?? undefined,
      },
    };
    },
  });
};

// Extract summary from SKILL.md content
function extractSummaryFromSkillMd(content: string): string | null {
  if (!content) return null;

  // Check for YAML frontmatter description
  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    const descMatch = frontmatter.match(/description:\s*["']?([^"'\n]+)["']?/i);
    if (descMatch) {
      return descMatch[1].trim();
    }
  }

  // Fallback: extract first paragraph (non-empty lines after frontmatter)
  const withoutFrontmatter = content.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, '');
  const paragraphs = withoutFrontmatter.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  if (paragraphs.length > 0) {
    // Strip markdown formatting and truncate
    const firstPara = paragraphs[0]
      .replace(/[#*_`~\[\]]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
    if (firstPara.length > 0) {
      return firstPara.slice(0, 500);
    }
  }

  return null;
}

const registerPublishSkillV1: FastifyPluginAsync = async (fastify) => {
  fastify.post("/skills", {
    schema: {
      description: "发布新技能",
      tags: ["skills"],
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
            skillId: { type: "string" },
            versionId: { type: "string" },
          },
        },
      },
    },
    async handler(request) {
    const session = await requireAuth(request);

    interface FileItem {
      path: string;
      content: string;
      contentType?: string;
    }

    interface UploadBody {
      payload: {
        slug: string;
        displayName: string;
        version: string;
        changelog: string;
        tags?: string[];
        forkOf?: { slug: string; version?: string };
      };
      files: FileItem[];
    }

    const body = request.body as UploadBody;
    const { payload, files: filesData } = body;

    if (!payload || !filesData || !Array.isArray(filesData)) {
      throw { statusCode: 400, message: "Invalid request body" };
    }

    const { generateUploadId, storeFile } = await import("../../lib/storage.js");

    // Extract summary from SKILL.md before encoding files
    let summary: string | null = null;
    const skillMdFile = filesData.find(f => {
      const pathLower = f.path.toLowerCase();
      const filename = pathLower.split('/').pop()!.split('\\').pop()!;
      return filename === 'skill.md';
    });
    if (skillMdFile) {
      try {
        const skillMdContent = Buffer.from(skillMdFile.content, 'base64').toString('utf-8');
        summary = extractSummaryFromSkillMd(skillMdContent);
      } catch {
        // Ignore errors
      }
    }

    const files: Array<{ path: string; size: number; storageId: string; sha256: string; contentType?: string }> = [];

    for (const fileData of filesData) {
      const buffer = Buffer.from(fileData.content, 'base64');
      const id = await generateUploadId();
      const file = await storeFile(id, buffer, fileData.contentType || 'application/octet-stream');
      files.push({
        path: fileData.path,
        size: buffer.length,
        storageId: id,
        sha256: file.sha256,
        contentType: fileData.contentType,
      });
    }

    const existing = await db.query.skills.findFirst({
      where: eq(skills.slug, payload.slug),
    });

    if (existing) {
      throw { statusCode: 409, message: "Slug already exists" };
    }

    const skill = await createSkill(session.userId, {
      slug: payload.slug,
      displayName: payload.displayName,
      summary: summary ?? undefined,
      moderationStatus: session.user.role === "admin" ? "active" : "pending",
    });

    const version = await createSkillVersion(session.userId, skill.id, {
      skillId: skill.id,
      version: payload.version,
      changelog: payload.changelog,
      files,
    });

    return {
      ok: true as const,
      skillId: skill.id,
      versionId: version.id,
    };
    },
  });
};

const registerSkillVersionsV1: FastifyPluginAsync = async (fastify) => {
  fastify.get("/skills/:slug/versions", {
    schema: {
      description: "获取技能版本列表",
      tags: ["skills"],
      params: {
        type: "object",
        required: ["slug"],
        properties: {
          slug: { type: "string" },
        },
      },
      querystring: {
        type: "object",
        properties: {
          limit: { type: "string" },
          cursor: { type: "string" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  version: { type: "string" },
                  createdAt: { type: "number" },
                  changelog: { type: "string", nullable: true },
                  changelogSource: { type: "string", nullable: true },
                },
              },
            },
            nextCursor: { type: "string", nullable: true },
          },
        },
      },
    },
    async handler(request) {
    const { slug } = request.params as { slug: string };
    const { limit: limitStr, cursor } = request.query as {
      limit?: string;
      cursor?: string;
    };

    const limit = Math.min(parseInt(limitStr || "20") || 20, 100);

    const [skill] = await db
      .select({ id: skills.id })
      .from(skills)
      .where(and(eq(skills.slug, slug), isNull(skills.softDeletedAt)))
      .limit(1);

    if (!skill) {
      return { items: [], nextCursor: null };
    }

    const versionRows = await db
      .select({
        version: skillVersions.version,
        createdAt: skillVersions.createdAt,
        changelog: skillVersions.changelog,
        changelogSource: skillVersions.changelogSource,
      })
      .from(skillVersions)
      .where(and(
        eq(skillVersions.skillId, skill.id),
        isNull(skillVersions.softDeletedAt)
      ))
      .orderBy(desc(skillVersions.createdAt))
      .limit(limit + 1);

    const hasNextPage = versionRows.length > limit;
    const items = versionRows.slice(0, limit);

    return {
      items: items.map((v) => ({
        version: v.version,
        createdAt: toUnixMs(v.createdAt),
        changelog: v.changelog,
        changelogSource: v.changelogSource,
      })),
      nextCursor: hasNextPage ? items[items.length - 1].version : null,
    };
    },
  });

  fastify.get("/skills/:slug/versions/:version", {
    schema: {
      description: "获取技能指定版本详情",
      tags: ["skills"],
      params: {
        type: "object",
        required: ["slug", "version"],
        properties: {
          slug: { type: "string" },
          version: { type: "string" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            version: {
              type: "object",
              nullable: true,
              properties: {
                version: { type: "string" },
                createdAt: { type: "number" },
                changelog: { type: "string", nullable: true },
                changelogSource: { type: "string", nullable: true },
                license: { type: "string", nullable: true },
                files: { type: "object", nullable: true },
              },
            },
            skill: {
              type: "object",
              nullable: true,
              properties: {
                slug: { type: "string" },
                displayName: { type: "string" },
              },
            },
          },
        },
      },
    },
    async handler(request) {
    const { slug, version } = request.params as { slug: string; version: string };

    const [skill] = await db
      .select({ id: skills.id, slug: skills.slug, displayName: skills.displayName })
      .from(skills)
      .where(and(eq(skills.slug, slug), isNull(skills.softDeletedAt)))
      .limit(1);

    if (!skill) {
      return { version: null, skill: null };
    }

    const [versionRow] = await db
      .select({
        version: skillVersions.version,
        createdAt: skillVersions.createdAt,
        changelog: skillVersions.changelog,
        changelogSource: skillVersions.changelogSource,
        license: skillVersions.license,
        files: skillVersions.files,
      })
      .from(skillVersions)
      .where(and(
        eq(skillVersions.skillId, skill.id),
        eq(skillVersions.version, version),
        isNull(skillVersions.softDeletedAt)
      ))
      .limit(1);

    if (!versionRow) {
      return { version: null, skill: null };
    }

    let parsedFiles = null;
    if (versionRow.files) {
      if (typeof versionRow.files === "string") {
        try {
          parsedFiles = JSON.parse(versionRow.files);
        } catch {
          parsedFiles = null;
        }
      } else {
        parsedFiles = versionRow.files;
      }
    }

    return {
      version: {
        version: versionRow.version,
        createdAt: toUnixMs(versionRow.createdAt),
        changelog: versionRow.changelog,
        changelogSource: versionRow.changelogSource,
        license: versionRow.license,
        files: parsedFiles,
      },
      skill: {
        slug: skill.slug,
        displayName: skill.displayName,
      },
    };
    },
  });
};

const registerSkillManageV1: FastifyPluginAsync = async (fastify) => {
  fastify.patch("/skills/:slug/rename", {
    schema: {
      description: "重命名技能",
      tags: ["skills"],
      params: {
        type: "object",
        required: ["slug"],
        properties: {
          slug: { type: "string" },
        },
      },
      headers: {
        type: "object",
        required: ["authorization"],
        properties: {
          authorization: { type: "string" },
        },
      },
      body: {
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
            slug: { type: "string" },
            previousSlug: { type: "string" },
          },
        },
      },
    },
    async handler(request) {
    const session = await requireAuth(request);
    const { slug } = request.params as { slug: string };
    const body = request.body as { slug: string };

    const [skill] = await db
      .select()
      .from(skills)
      .where(and(eq(skills.slug, slug), isNull(skills.softDeletedAt)))
      .limit(1);

    if (!skill) {
      throw { statusCode: 404, message: "Skill not found" };
    }

    if (skill.ownerUserId !== session.userId) {
      throw { statusCode: 403, message: "Not skill owner" };
    }

    const existingWithNewSlug = await db.query.skills.findFirst({
      where: eq(skills.slug, body.slug),
    });

    if (existingWithNewSlug) {
      throw { statusCode: 409, message: "Slug already taken" };
    }

    const previousSlug = skill.slug;

    await db.update(skills)
      .set({ slug: body.slug, updatedAt: new Date() })
      .where(eq(skills.id, skill.id));

    await db.insert(skillSlugAliases).values({
      slug: previousSlug,
      skillId: skill.id,
      ownerUserId: session.userId,
    });

    return { ok: true as const, slug: body.slug, previousSlug };
    },
  });

  fastify.patch("/skills/:slug/merge", {
    schema: {
      description: "合并技能",
      tags: ["skills"],
      params: {
        type: "object",
        required: ["slug"],
        properties: {
          slug: { type: "string" },
        },
      },
      headers: {
        type: "object",
        required: ["authorization"],
        properties: {
          authorization: { type: "string" },
        },
      },
      body: {
        type: "object",
        required: ["targetSlug"],
        properties: {
          targetSlug: { type: "string" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            ok: { type: "boolean" },
            sourceSlug: { type: "string" },
            targetSlug: { type: "string" },
          },
        },
      },
    },
    async handler(request) {
    const session = await requireAuth(request);
    const { slug } = request.params as { slug: string };
    const body = request.body as { targetSlug: string };

    const [sourceSkill] = await db
      .select()
      .from(skills)
      .where(and(eq(skills.slug, slug), isNull(skills.softDeletedAt)))
      .limit(1);

    if (!sourceSkill) {
      throw { statusCode: 404, message: "Source skill not found" };
    }

    if (sourceSkill.ownerUserId !== session.userId) {
      throw { statusCode: 403, message: "Not skill owner" };
    }

    const [targetSkill] = await db
      .select()
      .from(skills)
      .where(and(eq(skills.slug, body.targetSlug), isNull(skills.softDeletedAt)))
      .limit(1);

    if (!targetSkill) {
      throw { statusCode: 404, message: "Target skill not found" };
    }

    if (targetSkill.ownerUserId !== session.userId) {
      throw { statusCode: 403, message: "Not target skill owner" };
    }

    await db.update(skillVersions)
      .set({ skillId: targetSkill.id })
      .where(eq(skillVersions.skillId, sourceSkill.id));

    await db.update(skills)
      .set({ softDeletedAt: new Date(), updatedAt: new Date() })
      .where(eq(skills.id, sourceSkill.id));

    await db.insert(skillSlugAliases).values({
      slug: sourceSkill.slug,
      skillId: targetSkill.id,
      ownerUserId: session.userId,
    });

    return { ok: true as const, sourceSlug: slug, targetSlug: body.targetSlug };
    },
  });

  fastify.delete("/skills/:slug", {
    schema: {
      description: "删除技能",
      tags: ["skills"],
      params: {
        type: "object",
        required: ["slug"],
        properties: {
          slug: { type: "string" },
        },
      },
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
    const session = await requireAuth(request);
    const { slug } = request.params as { slug: string };

    const [skill] = await db
      .select()
      .from(skills)
      .where(and(eq(skills.slug, slug), isNull(skills.softDeletedAt)))
      .limit(1);

    if (!skill) {
      throw { statusCode: 404, message: "Skill not found" };
    }

    if (skill.ownerUserId !== session.userId) {
      throw { statusCode: 403, message: "Not skill owner" };
    }

    await db.update(skills)
      .set({ softDeletedAt: new Date(), updatedAt: new Date() })
      .where(eq(skills.id, skill.id));

    return { ok: true as const };
    },
  });

  fastify.post("/skills/:slug/restore", {
    schema: {
      description: "恢复已删除的技能",
      tags: ["skills"],
      params: {
        type: "object",
        required: ["slug"],
        properties: {
          slug: { type: "string" },
        },
      },
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
    const session = await requireAuth(request);
    const { slug } = request.params as { slug: string };

    const [skill] = await db
      .select()
      .from(skills)
      .where(eq(skills.slug, slug))
      .limit(1);

    if (!skill) {
      throw { statusCode: 404, message: "Skill not found" };
    }

    if (skill.ownerUserId !== session.userId) {
      throw { statusCode: 403, message: "Not skill owner" };
    }

    await db.update(skills)
      .set({ softDeletedAt: null, updatedAt: new Date() })
      .where(eq(skills.id, skill.id));

    return { ok: true as const };
    },
  });

  fastify.post("/skills/:slug/undelete", {
    schema: {
      description: "彻底恢复已删除的技能",
      tags: ["skills"],
      params: {
        type: "object",
        required: ["slug"],
        properties: {
          slug: { type: "string" },
        },
      },
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
    const session = await requireAuth(request);
    const { slug } = request.params as { slug: string };

    const [skill] = await db
      .select()
      .from(skills)
      .where(eq(skills.slug, slug))
      .limit(1);

    if (!skill) {
      throw { statusCode: 404, message: "Skill not found" };
    }

    if (skill.ownerUserId !== session.userId) {
      throw { statusCode: 403, message: "Not skill owner" };
    }

    await db.update(skills)
      .set({ softDeletedAt: null, updatedAt: new Date() })
      .where(eq(skills.id, skill.id));

    return { ok: true as const };
    },
  });

  // Resubmit a rejected skill (change status from removed to pending)
  fastify.post("/skills/:slug/resubmit", {
    schema: {
      description: "重新提交被驳回的技能",
      tags: ["skills"],
      params: {
        type: "object",
        required: ["slug"],
        properties: {
          slug: { type: "string" },
        },
      },
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
    const session = await requireAuth(request);
    const { slug } = request.params as { slug: string };

    const [skill] = await db
      .select()
      .from(skills)
      .where(eq(skills.slug, slug))
      .limit(1);

    if (!skill) {
      throw { statusCode: 404, message: "Skill not found" };
    }

    if (skill.ownerUserId !== session.userId) {
      throw { statusCode: 403, message: "Not skill owner" };
    }

    if (skill.moderationStatus !== "removed") {
      throw { statusCode: 400, message: "Only rejected skills can be resubmitted" };
    }

    await db.update(skills)
      .set({ moderationStatus: "pending", updatedAt: new Date() })
      .where(eq(skills.id, skill.id));

    return { ok: true as const };
    },
  });

  // Update skill and resubmit (for rejected skills)
  fastify.put("/skills/:slug/update", {
    schema: {
      description: "更新技能并重新提交",
      tags: ["skills"],
      params: {
        type: "object",
        required: ["slug"],
        properties: {
          slug: { type: "string" },
        },
      },
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
    const session = await requireAuth(request);
    const { slug } = request.params as { slug: string };

    const [skill] = await db
      .select()
      .from(skills)
      .where(and(eq(skills.slug, slug), isNull(skills.softDeletedAt)))
      .limit(1);

    if (!skill) {
      throw { statusCode: 404, message: "Skill not found" };
    }

    if (skill.ownerUserId !== session.userId) {
      throw { statusCode: 403, message: "Not skill owner" };
    }

    if (skill.moderationStatus !== "removed" && skill.moderationStatus !== "pending") {
      throw { statusCode: 400, message: "Only rejected or pending skills can be updated" };
    }

    // Parse multipart form data
    const files: Array<{ path: string; size: number; storageId: string; sha256: string; contentType?: string }> = [];
    const { generateUploadId, storeFile } = await import("../../lib/storage.js");

    let payload: {
      displayName?: string;
      version?: string;
      changelog?: string;
      tags?: string[];
    } | null = null;

    return new Promise((resolve, reject) => {
      const busboy = import("busboy").then(({ default: BB }) => {
        const bb = BB({ headers: request.headers as Record<string, string> });

        bb.on("field", (name: string, value: string) => {
          if (name === "payload") {
            try {
              payload = JSON.parse(value);
            } catch {
              reject({ statusCode: 400, message: "Invalid payload JSON" });
            }
          }
        });

        bb.on("file", async (name: string, stream: any, info: any) => {
          const { filename, mimeType } = info;
          const chunks: Buffer[] = [];

          stream.on("data", (chunk: Buffer) => {
            chunks.push(chunk);
          });

          stream.on("end", async () => {
            try {
              const buffer = Buffer.concat(chunks);
              const id = await generateUploadId();
              const file = await storeFile(id, buffer, mimeType || "application/octet-stream");
              files.push({
                path: filename,
                size: buffer.length,
                storageId: id,
                sha256: file.sha256,
                contentType: mimeType,
              });
            } catch (err) {
              reject(err);
            }
          });

          stream.on("error", reject);
        });

        bb.on("close", async () => {
          if (!payload) {
            reject({ statusCode: 400, message: "Missing payload" });
            return;
          }

          // Update skill metadata
          const updateData: Record<string, any> = {
            updatedAt: new Date(),
            moderationStatus: "pending",
          };
          if (payload.displayName) {
            updateData.displayName = payload.displayName;
          }
          if (payload.tags) {
            updateData.tags = payload.tags;
          }

          await db.update(skills)
            .set(updateData)
            .where(eq(skills.id, skill.id));

          // Create new version if files provided
          if (files.length > 0) {
            const version = await createSkillVersion(session.userId, skill.id, {
              skillId: skill.id,
              version: payload.version || "1.0.0",
              changelog: payload.changelog || "",
              files,
            });

            await db.update(skills)
              .set({ latestVersionId: version.id, updatedAt: new Date() })
              .where(eq(skills.id, skill.id));
          }

          resolve({ ok: true as const });
        });

        bb.on("error", reject);
        (request.raw as any).pipe(bb);
      });
    });
    },
  });
};

export { listSkills, getSkillBySlug, registerPublishSkillV1, registerSkillVersionsV1, registerSkillManageV1 };
