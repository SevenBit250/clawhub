import { db } from "../db/index.js";
import { souls, soulVersions } from "../db/schema.js";
import { eq, and, isNull, desc } from "drizzle-orm";

export async function createSoul(ownerUserId: string, input: {
  slug: string;
  displayName: string;
  summary?: string;
}) {
  const [soul] = await db.insert(souls).values({
    slug: input.slug,
    displayName: input.displayName,
    summary: input.summary,
    ownerUserId,
    latestVersionId: null,
    statsDownloads: 0,
    statsStars: 0,
    statsVersions: 0,
    statsComments: 0,
  }).returning();

  return soul;
}

export async function createSoulVersion(
  userId: string,
  soulId: string,
  input: {
    version: string;
    changelog: string;
    files: Array<{
      path: string;
      size: number;
      storageId: string;
      sha256: string;
      contentType?: string;
    }>;
    frontmatter?: Record<string, unknown>;
    metadata?: unknown;
    clawdis?: unknown;
  }
) {
  const [version] = await db.insert(soulVersions).values({
    soulId,
    version: input.version,
    changelog: input.changelog,
    changelogSource: "user",
    files: JSON.stringify(input.files),
    frontmatter: input.frontmatter ? JSON.stringify(input.frontmatter) : null,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    clawdis: input.clawdis ? JSON.stringify(input.clawdis) : null,
    createdBy: userId,
  }).returning();

  await db.update(souls)
    .set({ latestVersionId: version.id, updatedAt: new Date() })
    .where(eq(souls.id, soulId));

  return version;
}

export async function getSoulBySlug(slug: string) {
  return db.query.souls.findFirst({
    where: and(eq(souls.slug, slug), isNull(souls.softDeletedAt)),
    with: { owner: true },
  });
}

export async function getSoulById(id: string) {
  return db.query.souls.findFirst({
    where: and(eq(souls.id, id), isNull(souls.softDeletedAt)),
    with: { owner: true },
  });
}

export async function getSoulVersions(soulId: string) {
  return db.select()
    .from(soulVersions)
    .where(eq(soulVersions.soulId, soulId))
    .orderBy(desc(soulVersions.createdAt));
}

export async function listSouls(options: {
  limit?: number;
  offset?: number;
  sortBy?: "updated" | "stars";
} = {}) {
  const { limit = 20, offset = 0, sortBy = "updated" } = options;

  const orderBy = sortBy === "stars" ? desc(souls.statsStars) : desc(souls.updatedAt);

  return db.query.souls.findMany({
    where: isNull(souls.softDeletedAt),
    with: { owner: true },
    orderBy,
    limit,
    offset,
  });
}

export async function updateSoul(soulId: string, userId: string, updates: {
  displayName?: string;
  summary?: string;
}) {
  const [soul] = await db.update(souls)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(eq(souls.id, soulId), eq(souls.ownerUserId, userId)))
    .returning();

  return soul;
}

export async function deleteSoul(soulId: string, userId: string) {
  await db.update(souls)
    .set({ softDeletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(souls.id, soulId), eq(souls.ownerUserId, userId)));
}

export async function getUserSouls(userId: string) {
  return db.query.souls.findMany({
    where: and(eq(souls.ownerUserId, userId), isNull(souls.softDeletedAt)),
    orderBy: desc(souls.updatedAt),
  });
}
