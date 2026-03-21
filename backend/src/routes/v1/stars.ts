import { FastifyInstance } from "fastify";
import { db } from "../../db/index.js";
import { stars, skills } from "../../db/schema.js";
import { validateSession } from "../../auth/session.js";
import { eq, and, isNull } from "drizzle-orm";

export async function registerStarsV1(fastify: FastifyInstance) {
  fastify.post("/stars/:slug", async (request) => {
    const auth = request.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      throw { statusCode: 401, message: "Unauthorized" };
    }

    const token = auth.slice(7);
    const session = await validateSession(token);
    if (!session) {
      throw { statusCode: 401, message: "Unauthorized" };
    }

    const { slug } = request.params as { slug: string };

    // Find skill by slug
    const [skill] = await db
      .select({ id: skills.id })
      .from(skills)
      .where(and(eq(skills.slug, slug), isNull(skills.softDeletedAt)))
      .limit(1);

    if (!skill) {
      throw { statusCode: 404, message: "Skill not found" };
    }

    // Check if already starred
    const [existing] = await db
      .select()
      .from(stars)
      .where(and(eq(stars.skillId, skill.id), eq(stars.userId, session.userId)))
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
      skillId: skill.id,
      userId: session.userId,
    });

    // Update skill stats
    await db
      .update(skills)
      .set({ statsStars: skills.statsStars })
      .where(eq(skills.id, skill.id));

    return {
      ok: true as const,
      starred: true,
      alreadyStarred: false,
    };
  });

  fastify.delete("/stars/:slug", async (request) => {
    const auth = request.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      throw { statusCode: 401, message: "Unauthorized" };
    }

    const token = auth.slice(7);
    const session = await validateSession(token);
    if (!session) {
      throw { statusCode: 401, message: "Unauthorized" };
    }

    const { slug } = request.params as { slug: string };

    // Find skill by slug
    const [skill] = await db
      .select({ id: skills.id })
      .from(skills)
      .where(and(eq(skills.slug, slug), isNull(skills.softDeletedAt)))
      .limit(1);

    if (!skill) {
      throw { statusCode: 404, message: "Skill not found" };
    }

    // Check if starred
    const [existing] = await db
      .select()
      .from(stars)
      .where(and(eq(stars.skillId, skill.id), eq(stars.userId, session.userId)))
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
