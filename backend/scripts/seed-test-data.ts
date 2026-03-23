import { db } from "../src/db/index.js";
import { skills, skillVersions, users } from "../src/db/schema.js";
import { eq } from "drizzle-orm";

async function seed() {
  // Get admin user
  const [admin] = await db.select().from(users).where(eq(users.handle, "mock_admin")).limit(1);
  if (!admin) {
    console.error("Admin user not found, run auth first");
    process.exit(1);
  }

  // Create test-skill
  const [testSkill] = await db.insert(skills).values({
    slug: "test-skill",
    displayName: "Test Skill",
    summary: "A skill for testing",
    ownerUserId: admin.id,
    latestVersionId: null,
    moderationStatus: "active",
    statsDownloads: 0,
    statsStars: 0,
    statsInstallsCurrent: 0,
    statsInstallsAllTime: 0,
  }).returning();

  const [version1] = await db.insert(skillVersions).values({
    skillId: testSkill.id,
    version: "1.0.0",
    changelog: "Initial version",
    changelogSource: "user",
    files: JSON.stringify([]),
    createdBy: admin.id,
  }).returning();

  await db.update(skills).set({ latestVersionId: version1.id }).where(eq(skills.id, testSkill.id));

  // Create self-improving-agent-final
  const [finalSkill] = await db.insert(skills).values({
    slug: "self-improving-agent-final",
    displayName: "Self Improving Agent Final",
    summary: "A self-improving agent",
    ownerUserId: admin.id,
    latestVersionId: null,
    moderationStatus: "active",
    statsDownloads: 100,
    statsStars: 10,
    statsInstallsCurrent: 50,
    statsInstallsAllTime: 200,
  }).returning();

  const [version2] = await db.insert(skillVersions).values({
    skillId: finalSkill.id,
    version: "1.0.0",
    changelog: "Initial release",
    changelogSource: "user",
    files: JSON.stringify([]),
    createdBy: admin.id,
  }).returning();

  await db.update(skills).set({ latestVersionId: version2.id }).where(eq(skills.id, finalSkill.id));

  console.log("Seed data created:");
  console.log("  - test-skill:", testSkill.id);
  console.log("  - self-improving-agent-final:", finalSkill.id);
}

seed().catch(console.error);
