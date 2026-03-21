import { FastifyInstance } from "fastify";
import { db } from "../../db/index.js";
import { souls, soulVersions, users } from "../../db/schema.js";
import { eq, and, isNull, desc } from "drizzle-orm";

function toUnixMs(timestamp: Date): number {
  return timestamp.getTime();
}

export async function registerSoulsV1(fastify: FastifyInstance) {
  fastify.get("/souls", async (request) => {
    const { limit: limitStr, offset: offsetStr } = request.query as {
      limit?: string;
      offset?: string;
    };

    const limit = Math.min(parseInt(limitStr || "20") || 20, 100);
    const offset = parseInt(offsetStr || "0") || 0;

    const soulRows = await db
      .select({
        id: souls.id,
        slug: souls.slug,
        displayName: souls.displayName,
        summary: souls.summary,
        tags: souls.tags,
        statsDownloads: souls.statsDownloads,
        statsStars: souls.statsStars,
        createdAt: souls.createdAt,
        updatedAt: souls.updatedAt,
      })
      .from(souls)
      .where(isNull(souls.softDeletedAt))
      .orderBy(desc(souls.updatedAt))
      .limit(limit)
      .offset(offset);

    return {
      items: soulRows.map((s) => ({
        slug: s.slug,
        displayName: s.displayName,
        summary: s.summary,
        tags: s.tags || {},
        stats: {
          downloads: s.statsDownloads,
          stars: s.statsStars,
        },
        createdAt: toUnixMs(s.createdAt),
        updatedAt: toUnixMs(s.updatedAt),
      })),
      nextCursor: null,
    };
  });

  fastify.get("/souls/:slug", async (request) => {
    const { slug } = request.params as { slug: string };

    const [soul] = await db
      .select({
        id: souls.id,
        slug: souls.slug,
        displayName: souls.displayName,
        summary: souls.summary,
        tags: souls.tags,
        statsDownloads: souls.statsDownloads,
        statsStars: souls.statsStars,
        createdAt: souls.createdAt,
        updatedAt: souls.updatedAt,
        ownerHandle: users.handle,
        ownerDisplayName: users.displayName,
        ownerImage: users.image,
      })
      .from(souls)
      .leftJoin(users, eq(souls.ownerUserId, users.id))
      .where(and(eq(souls.slug, slug), isNull(souls.softDeletedAt)))
      .limit(1);

    if (!soul) {
      return { soul: null, latestVersion: null, owner: null };
    }

    return {
      soul: {
        slug: soul.slug,
        displayName: soul.displayName,
        summary: soul.summary,
        tags: soul.tags || {},
        stats: {
          downloads: soul.statsDownloads,
          stars: soul.statsStars,
        },
        createdAt: toUnixMs(soul.createdAt),
        updatedAt: toUnixMs(soul.updatedAt),
      },
      latestVersion: null,
      owner: {
        handle: soul.ownerHandle,
        displayName: soul.ownerDisplayName,
        image: soul.ownerImage,
      },
    };
  });
}
