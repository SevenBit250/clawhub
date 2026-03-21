import { FastifyInstance } from "fastify";
import { db } from "../../db/index.js";
import { skills, skillVersions } from "../../db/schema.js";
import { eq, and, isNull } from "drizzle-orm";

export async function registerResolveV1(fastify: FastifyInstance) {
  fastify.get("/api/v1/resolve", async (request) => {
    const { slug, version } = request.query as {
      slug?: string;
      version?: string;
    };

    if (!slug) {
      return { match: null, latestVersion: null };
    }

    const [skill] = await db
      .select({
        id: skills.id,
        latestVersionId: skills.latestVersionId,
      })
      .from(skills)
      .where(and(eq(skills.slug, slug), isNull(skills.softDeletedAt)))
      .limit(1);

    if (!skill) {
      return { match: null, latestVersion: null };
    }

    let match: { version: string } | null = null;
    let latestVersion: { version: string } | null = null;

    if (version) {
      const [skillVersion] = await db
        .select({ version: skillVersions.version })
        .from(skillVersions)
        .where(
          and(
            eq(skillVersions.skillId, skill.id),
            eq(skillVersions.version, version),
            isNull(skillVersions.softDeletedAt)
          )
        )
        .limit(1);

      if (skillVersion) {
        match = { version: skillVersion.version };
      }
    }

    if (skill.latestVersionId) {
      const [latest] = await db
        .select({ version: skillVersions.version })
        .from(skillVersions)
        .where(eq(skillVersions.id, skill.latestVersionId))
        .limit(1);

      if (latest) {
        latestVersion = { version: latest.version };
      }
    }

    return { match, latestVersion };
  });
}
