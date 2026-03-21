import { FastifyInstance } from "fastify";
import { db } from "../../db/index.js";
import { stars, skills } from "../../db/schema.js";
import { validateSession } from "../../auth/session.js";
import { eq, and } from "drizzle-orm";

export async function registerStarsV1(fastify: FastifyInstance) {
  // POST /api/v1/stars - Star a skill
  fastify.post("/api/v1/stars", async (request) => {
    const auth = request.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      throw { statusCode: 401, message: "Unauthorized" };
    }

    const token = auth.slice(7);
    const session = await validateSession(token);
    if (!session) {
      throw { statusCode: 401, message: "Unauthorized" };
    }

    const { skillId } = request.query as { skillId?: string };
    if (!skillId) {
      throw { statusCode: 400, message: "skillId required" };
    }

    // Check if already starred
    const [existing] = await db
      .select()
      .from(stars)
      .where(and(eq(stars.skillId, skillId), eq(stars.userId, session.userId)))
      .limit(1);

    if (existing) {
      return {
        ok: true as const,
        starred: true,
        alreadyStarred: true,
      };
    }

    // Create star
    await db.insert(stars).values({
      skillId,
      userId: session.userId,
    });

    // Update skill stats
    await db
      .update(skills)
      .set({ statsStars: skills.statsStars })
      .where(eq(skills.id, skillId));

    return {
      ok: true as const,
      starred: true,
      alreadyStarred: false,
    };
  });

  // DELETE /api/v1/stars - Unstar a skill
  fastify.delete("/api/v1/stars", async (request) => {
    const auth = request.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      throw { statusCode: 401, message: "Unauthorized" };
    }

    const token = auth.slice(7);
    const session = await validateSession(token);
    if (!session) {
      throw { statusCode: 401, message: "Unauthorized" };
    }

    const { skillId } = request.query as { skillId?: string };
    if (!skillId) {
      throw { statusCode: 400, message: "skillId required" };
    }

    // Check if starred
    const [existing] = await db
      .select()
      .from(stars)
      .where(and(eq(stars.skillId, skillId), eq(stars.userId, session.userId)))
      .limit(1);

    if (!existing) {
      return {
        ok: true as const,
        unstarred: true,
        alreadyUnstarred: true,
      };
    }

    // Delete star
    await db.delete(stars).where(eq(stars.id, existing.id));

    return {
      ok: true as const,
      unstarred: true,
      alreadyUnstarred: false,
    };
  });
}
