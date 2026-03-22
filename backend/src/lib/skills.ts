import { db } from "../db/index.js";
import { skills, skillVersions, skillSlugAliases, users } from "../db/schema.js";
import { eq, and, isNull, desc, ne } from "drizzle-orm";
import { randomBytes } from "crypto";

export interface CreateSkillInput {
  slug: string;
  displayName: string;
  summary?: string;
  resourceId?: string;
}

export interface CreateSkillVersionInput {
  skillId: string;
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
  license?: string;
}

export async function createSkill(ownerUserId: string, input: CreateSkillInput) {
  const [skill] = await db.insert(skills).values({
    slug: input.slug,
    displayName: input.displayName,
    summary: input.summary,
    resourceId: input.resourceId,
    ownerUserId,
    latestVersionId: null,
    moderationStatus: "pending",
    statsDownloads: 0,
    statsStars: 0,
    statsInstallsCurrent: 0,
    statsInstallsAllTime: 0,
  }).returning();

  await db.insert(skillSlugAliases).values({
    slug: input.slug,
    skillId: skill.id,
    ownerUserId,
  });

  return skill;
}

export async function createSkillVersion(
  userId: string,
  skillId: string,
  input: CreateSkillVersionInput
) {
  const [version] = await db.insert(skillVersions).values({
    skillId,
    version: input.version,
    changelog: input.changelog,
    changelogSource: "user",
    files: JSON.stringify(input.files),
    frontmatter: input.frontmatter ? JSON.stringify(input.frontmatter) : null,
    metadata: input.metadata ? JSON.stringify(input.metadata) : null,
    clawdis: input.clawdis ? JSON.stringify(input.clawdis) : null,
    license: input.license,
    createdBy: userId,
  }).returning();

  await db.update(skills)
    .set({ latestVersionId: version.id, updatedAt: new Date() })
    .where(eq(skills.id, skillId));

  return version;
}

export async function getSkillBySlug(slug: string, options?: { includePending?: boolean }) {
  const conditions = [eq(skills.slug, slug), isNull(skills.softDeletedAt)];
  if (!options?.includePending) {
    conditions.push(ne(skills.moderationStatus, "pending") as any);
  }

  return db.query.skills.findFirst({
    where: and(...conditions),
    with: {
      owner: true,
    },
  });
}

export async function getSkillById(id: string, options?: { includePending?: boolean }) {
  const conditions = [eq(skills.id, id), isNull(skills.softDeletedAt)];
  if (!options?.includePending) {
    conditions.push(ne(skills.moderationStatus, "pending") as any);
  }

  return db.query.skills.findFirst({
    where: and(...conditions),
    with: {
      owner: true,
    },
  });
}

export async function getSkillVersions(skillId: string) {
  return db.select()
    .from(skillVersions)
    .where(and(eq(skillVersions.skillId, skillId), isNull(skillVersions.softDeletedAt)))
    .orderBy(desc(skillVersions.createdAt));
}

export async function getLatestSkillVersion(skillId: string) {
  const skill = await getSkillById(skillId);
  if (!skill?.latestVersionId) return null;

  return db.query.skillVersions.findFirst({
    where: eq(skillVersions.id, skill.latestVersionId),
  });
}

export async function listSkills(options: {
  limit?: number;
  offset?: number;
  sortBy?: "updated" | "downloads" | "stars" | "installs";
} = {}) {
  const { limit = 20, offset = 0, sortBy = "updated" } = options;

  let orderBy;
  switch (sortBy) {
    case "downloads":
      orderBy = desc(skills.statsDownloads);
      break;
    case "stars":
      orderBy = desc(skills.statsStars);
      break;
    case "installs":
      orderBy = desc(skills.statsInstallsAllTime);
      break;
    default:
      orderBy = desc(skills.updatedAt);
  }

  return db.query.skills.findMany({
    where: and(
      isNull(skills.softDeletedAt),
      ne(skills.moderationStatus, "pending")
    ),
    with: { owner: true },
    orderBy,
    limit,
    offset,
  });
}

export async function updateSkill(skillId: string, userId: string, updates: {
  displayName?: string;
  summary?: string;
}) {
  const [skill] = await db.update(skills)
    .set({ ...updates, updatedAt: new Date() })
    .where(and(eq(skills.id, skillId), eq(skills.ownerUserId, userId)))
    .returning();

  return skill;
}

export async function deleteSkill(skillId: string, userId: string) {
  await db.update(skills)
    .set({ softDeletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(skills.id, skillId), eq(skills.ownerUserId, userId)));
}

export async function getUserSkills(userId: string) {
  return db.query.skills.findMany({
    where: and(eq(skills.ownerUserId, userId), isNull(skills.softDeletedAt)),
    orderBy: desc(skills.updatedAt),
  });
}
