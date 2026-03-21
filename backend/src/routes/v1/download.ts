import { FastifyInstance } from "fastify";
import { db } from "../../db/index.js";
import { skills, skillVersions } from "../../db/schema.js";
import { eq, and, isNull } from "drizzle-orm";
import { getFile } from "../../lib/storage.js";
import { zip, ZipPassThrough } from "fflate";

type ZipCallback = (err: Error | null, data: Uint8Array) => void;

export async function registerDownloadV1(fastify: FastifyInstance) {
  fastify.get("/download", async (request, reply) => {
    const { slug, version } = request.query as {
      slug?: string;
      version?: string;
    };

    if (!slug) {
      throw { statusCode: 400, message: "slug required" };
    }

    const [skill] = await db
      .select({ id: skills.id, slug: skills.slug })
      .from(skills)
      .where(and(eq(skills.slug, slug), isNull(skills.softDeletedAt)))
      .limit(1);

    if (!skill) {
      throw { statusCode: 404, message: "Skill not found" };
    }

    let versionRow;
    if (version) {
      [versionRow] = await db
        .select({ id: skillVersions.id, version: skillVersions.version, files: skillVersions.files })
        .from(skillVersions)
        .where(and(
          eq(skillVersions.skillId, skill.id),
          eq(skillVersions.version, version),
          isNull(skillVersions.softDeletedAt)
        ))
        .limit(1);
    } else {
      const skillWithVersion = await db.query.skills.findFirst({
        where: and(eq(skills.id, skill.id), isNull(skills.softDeletedAt)),
        with: {
          versions: {
            where: isNull(skillVersions.softDeletedAt),
            orderBy: (sv, { desc }) => [desc(sv.createdAt)],
            limit: 1,
          },
        },
      });
      versionRow = skillWithVersion?.versions[0];
    }

    if (!versionRow) {
      throw { statusCode: 404, message: "Version not found" };
    }

    let parsedFiles: Array<{ path: string; storageId: string }> = [];
    if (versionRow.files) {
      if (typeof versionRow.files === "string") {
        try {
          parsedFiles = JSON.parse(versionRow.files);
        } catch {
          throw { statusCode: 500, message: "Invalid files data" };
        }
      } else if (Array.isArray(versionRow.files)) {
        parsedFiles = versionRow.files as Array<{ path: string; storageId: string }>;
      }
    }

    const fileBuffers: Record<string, Uint8Array> = {};

    for (const file of parsedFiles) {
      if (!file.storageId) continue;
      const stored = await getFile(file.storageId);
      if (stored) {
        fileBuffers[file.path] = new Uint8Array(stored.data);
      }
    }

    const zipPromise = new Promise<Uint8Array>((resolve, reject) => {
      zip(fileBuffers, { level: 0 }, (err: Error | null, data: Uint8Array) => {
        if (err) reject(err);
        else resolve(data);
      });
    });

    const zipData = await zipPromise;

    reply.header("Content-Type", "application/zip");
    reply.header("Content-Disposition", `attachment; filename="${slug}-${versionRow.version}.zip"`);
    return zipData;
  });
}
