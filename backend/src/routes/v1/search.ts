import { FastifyInstance } from "fastify";
import { db } from "../../db/index.js";
import { skills, skillVersions } from "../../db/schema.js";
import { searchSkills } from "../../lib/search.js";
import { eq, and, isNull } from "drizzle-orm";

export async function registerSearchV1(fastify: FastifyInstance) {
  fastify.get("/search", {
    schema: {
      description: "搜索技能",
      tags: ["search"],
      querystring: {
        type: "object",
        properties: {
          q: { type: "string", description: "搜索关键词" },
          limit: { type: "number", description: "返回数量" },
          offset: { type: "number", description: "偏移量" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            results: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  slug: { type: "string" },
                  displayName: { type: "string" },
                  summary: { type: "string", nullable: true },
                  version: { type: "string", nullable: true },
                  score: { type: "number" },
                  updatedAt: { type: "number", nullable: true },
                },
              },
            },
          },
        },
      },
    },
    async handler(request) {
    const { q, limit, offset } = request.query as {
      q?: string;
      limit?: number;
      offset?: number;
    };

    if (!q || q.trim().length === 0) {
      return { results: [] };
    }

    const searchResults = await searchSkills(q, {
      limit: limit || 20,
      offset: offset || 0,
    });

    const results = await Promise.all(
      searchResults.map(async (result) => {
        let version: string | null = null;
        let updatedAt: number | null = null;

        const [skill] = await db
          .select({
            latestVersionId: skills.latestVersionId,
            updatedAt: skills.updatedAt,
          })
          .from(skills)
          .where(eq(skills.id, result.id))
          .limit(1);

        if (skill?.latestVersionId) {
          const [latestVersion] = await db
            .select({ version: skillVersions.version })
            .from(skillVersions)
            .where(eq(skillVersions.id, skill.latestVersionId))
            .limit(1);
          version = latestVersion?.version || null;
        }

        if (skill?.updatedAt) {
          updatedAt = skill.updatedAt.getTime();
        }

        return {
          slug: result.slug,
          displayName: result.displayName,
          summary: result.summary,
          version,
          score: result.score,
          updatedAt,
        };
      })
    );

    return { results };
    },
  });
}
