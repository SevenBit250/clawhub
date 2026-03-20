import { db } from "../db/index.js";
import { stars, skills } from "../db/schema.js";
import { eq, and, sql } from "drizzle-orm";

export async function toggleStar(userId: string, skillId: string) {
  const existing = await db.query.stars.findFirst({
    where: and(eq(stars.userId, userId), eq(stars.skillId, skillId)),
  });

  if (existing) {
    await db.delete(stars).where(eq(stars.id, existing.id));
    await db
      .update(skills)
      .set({
        statsStars: sql`${skills.statsStars} - 1`,
      })
      .where(eq(skills.id, skillId));
    return { starred: false };
  } else {
    await db.insert(stars).values({ userId, skillId });
    await db
      .update(skills)
      .set({
        statsStars: sql`${skills.statsStars} + 1`,
      })
      .where(eq(skills.id, skillId));
    return { starred: true };
  }
}

export async function getUserStars(userId: string) {
  return db.query.stars.findMany({
    where: eq(stars.userId, userId),
    with: { skill: true },
  });
}

export async function isStarred(userId: string, skillId: string) {
  const existing = await db.query.stars.findFirst({
    where: and(eq(stars.userId, userId), eq(stars.skillId, skillId)),
  });
  return !!existing;
}

export async function getSkillStarCount(skillId: string) {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(stars)
    .where(eq(stars.skillId, skillId));
  return result[0]?.count || 0;
}
