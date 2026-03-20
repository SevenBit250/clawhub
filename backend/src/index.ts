import "dotenv/config";
import Fastify from "fastify";
import multipart from "@fastify/multipart";
import { createSession, invalidateSession, requireAuth } from "./auth/session.js";
import { MockWeComAuth, findOrCreateUser } from "./auth/wecom.js";
import { db } from "./db/index.js";
import { users } from "./db/schema.js";
import { eq } from "drizzle-orm";

const fastify = Fastify({ logger: true });
await fastify.register(multipart);

const wecomAuth = new MockWeComAuth();

fastify.get("/health", async () => ({ status: "ok" }));

fastify.get("/auth/url", async () => {
  const state = Math.random().toString(36).slice(2);
  return { url: wecomAuth.getAuthUrl(state) };
});

fastify.get("/auth/callback", async (request) => {
  const { code } = request.query as { code?: string };
  if (!code) return { error: "Missing code" };

  const wecomUser = await wecomAuth.exchangeCode(code);
  const user = await findOrCreateUser(wecomUser);

  const { token, expiresAt } = await createSession(user.id);

  return {
    token,
    expiresAt: expiresAt.toISOString(),
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      handle: user.handle,
      image: user.image,
      role: user.role,
    },
  };
});

fastify.post("/auth/logout", async (request) => {
  const auth = request.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    await invalidateSession(auth.slice(7));
  }
  return { success: true };
});

fastify.get("/auth/session", async (request) => {
  const auth = request.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return { user: null };

  const { validateSession } = await import("./auth/session.js");
  const session = await validateSession(auth.slice(7));
  if (!session) return { user: null };

  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (!user) return { user: null };

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      handle: user.handle,
      image: user.image,
      role: user.role,
    },
  };
});

fastify.get("/users/me", { preHandler: [async (req) => requireAuth(req)] }, async (request) => {
  const session = await requireAuth(request);
  const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
  if (!user) throw new Error("User not found");

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    handle: user.handle,
    displayName: user.displayName,
    image: user.image,
    bio: user.bio,
    role: user.role,
    createdAt: user.createdAt,
  };
});

fastify.patch("/users/me", { preHandler: [async (req) => requireAuth(req)] }, async (request) => {
  const session = await requireAuth(request);
  const body = request.body as { displayName?: string; bio?: string; image?: string };

  const [user] = await db
    .update(users)
    .set({ displayName: body.displayName, bio: body.bio, image: body.image, updatedAt: new Date() })
    .where(eq(users.id, session.userId))
    .returning();

  return { success: true, user };
});

fastify.post("/storage/upload", { preHandler: [async (req) => requireAuth(req)] }, async (request) => {
  await requireAuth(request);
  const { generateUploadId, storeFile } = await import("./lib/storage.js");

  const data = await request.file();
  if (!data) return { error: "No file provided" };

  const buffer = await data.toBuffer();
  const id = await generateUploadId();
  const contentType = data.mimetype || "application/octet-stream";

  const file = await storeFile(id, buffer, contentType);

  return { storageId: id, size: file.size, sha256: file.sha256 };
});

fastify.get("/storage/:id", async (request, reply) => {
  const { id } = request.params as { id: string };
  const { getFile } = await import("./lib/storage.js");

  const result = await getFile(id);
  if (!result) {
    reply.code(404);
    return { error: "File not found" };
  }

  reply.header("Content-Type", result.file.contentType);
  reply.header("Content-Length", result.file.size);
  reply.header("ETag", result.file.sha256);
  return result.data;
});

fastify.get("/skills", async (request) => {
  const { limit, offset, sort } = request.query as {
    limit?: number;
    offset?: number;
    sort?: "updated" | "downloads" | "stars" | "installs";
  };
  const { listSkills } = await import("./lib/skills.js");
  return listSkills({ limit, offset, sortBy: sort });
});

fastify.get("/skills/:slug", async (request) => {
  const { slug } = request.params as { slug: string };
  const { getSkillBySlug, getLatestSkillVersion } = await import("./lib/skills.js");

  const skill = await getSkillBySlug(slug);
  if (!skill) return { error: "Skill not found" };

  const latestVersion = await getLatestSkillVersion(skill.id);

  return { skill, version: latestVersion };
});

fastify.post("/skills", { preHandler: [async (req) => requireAuth(req)] }, async (request) => {
  const session = await requireAuth(request);
  const body = request.body as { slug: string; displayName: string; summary?: string };
  const { createSkill } = await import("./lib/skills.js");

  const skill = await createSkill(session.userId, {
    slug: body.slug,
    displayName: body.displayName,
    summary: body.summary,
  });

  return { skill };
});

fastify.patch("/skills/:id", { preHandler: [async (req) => requireAuth(req)] }, async (request) => {
  const session = await requireAuth(request);
  const { id } = request.params as { id: string };
  const body = request.body as { displayName?: string; summary?: string };
  const { updateSkill } = await import("./lib/skills.js");

  const skill = await updateSkill(id, session.userId, body);
  return { skill };
});

fastify.delete("/skills/:id", { preHandler: [async (req) => requireAuth(req)] }, async (request) => {
  const session = await requireAuth(request);
  const { id } = request.params as { id: string };
  const { deleteSkill } = await import("./lib/skills.js");

  await deleteSkill(id, session.userId);
  return { success: true };
});

fastify.get("/skills/:id/versions", async (request) => {
  const { id } = request.params as { id: string };
  const { getSkillVersions } = await import("./lib/skills.js");

  const versions = await getSkillVersions(id);
  return { versions };
});

fastify.post("/skills/:id/versions", { preHandler: [async (req) => requireAuth(req)] }, async (request) => {
  const session = await requireAuth(request);
  const { id } = request.params as { id: string };
  const body = request.body as {
    version: string;
    changelog: string;
    files: Array<{ path: string; size: number; storageId: string; sha256: string; contentType?: string }>;
    frontmatter?: Record<string, unknown>;
    metadata?: unknown;
    clawdis?: unknown;
    license?: string;
  };
  const { createSkillVersion } = await import("./lib/skills.js");

  const version = await createSkillVersion(session.userId, id, {
    skillId: id,
    version: body.version,
    changelog: body.changelog,
    files: body.files,
    frontmatter: body.frontmatter,
    metadata: body.metadata,
    clawdis: body.clawdis,
    license: body.license,
  });

  return { version };
});

fastify.get("/users/me/skills", { preHandler: [async (req) => requireAuth(req)] }, async (request) => {
  const session = await requireAuth(request);
  const { getUserSkills } = await import("./lib/skills.js");

  const skills = await getUserSkills(session.userId);
  return { skills };
});

// Stars
fastify.post("/skills/:id/star", { preHandler: [async (req) => requireAuth(req)] }, async (request) => {
  const session = await requireAuth(request);
  const { id } = request.params as { id: string };
  const { toggleStar, getSkillStarCount } = await import("./lib/stars.js");

  const result = await toggleStar(session.userId, id);
  const starCount = await getSkillStarCount(id);

  return { ...result, starCount };
});

fastify.get("/skills/:id/star", async (request) => {
  const { id } = request.params as { id: string };
  const auth = request.headers.authorization;
  const { isStarred, getSkillStarCount } = await import("./lib/stars.js");

  let starred = false;
  if (auth?.startsWith("Bearer ")) {
    const { validateSession } = await import("./auth/session.js");
    const session = await validateSession(auth.slice(7));
    if (session) {
      starred = await isStarred(session.userId, id);
    }
  }

  const starCount = await getSkillStarCount(id);

  return { starred, starCount };
});

fastify.get("/users/me/stars", { preHandler: [async (req) => requireAuth(req)] }, async (request) => {
  const session = await requireAuth(request);
  const { getUserStars } = await import("./lib/stars.js");

  const stars = await getUserStars(session.userId);
  return { stars };
});

// Comments
fastify.get("/skills/:id/comments", async (request) => {
  const { id } = request.params as { id: string };
  const { getSkillComments } = await import("./lib/comments.js");

  const comments = await getSkillComments(id);
  return { comments };
});

fastify.post("/skills/:id/comments", { preHandler: [async (req) => requireAuth(req)] }, async (request) => {
  const session = await requireAuth(request);
  const { id } = request.params as { id: string };
  const body = request.body as { body: string };
  const { createComment } = await import("./lib/comments.js");

  const comment = await createComment(session.userId, id, body.body);
  return { comment };
});

fastify.delete("/comments/:id", { preHandler: [async (req) => requireAuth(req)] }, async (request) => {
  const session = await requireAuth(request);
  const { id } = request.params as { id: string };
  const { deleteComment } = await import("./lib/comments.js");

  const result = await deleteComment(id, session.userId);
  if (!result) return { error: "Comment not found or not authorized" };

  return { success: true };
});

fastify.get("/souls", async (request) => {
  const { limit, offset, sort } = request.query as {
    limit?: number;
    offset?: number;
    sort?: "updated" | "stars";
  };
  const { listSouls } = await import("./lib/souls.js");
  return listSouls({ limit, offset, sortBy: sort });
});

fastify.get("/souls/:slug", async (request) => {
  const { slug } = request.params as { slug: string };
  const { getSoulBySlug } = await import("./lib/souls.js");

  const soul = await getSoulBySlug(slug);
  if (!soul) return { error: "Soul not found" };

  return { soul };
});

fastify.post("/souls", { preHandler: [async (req) => requireAuth(req)] }, async (request) => {
  const session = await requireAuth(request);
  const body = request.body as { slug: string; displayName: string; summary?: string };
  const { createSoul } = await import("./lib/souls.js");

  const soul = await createSoul(session.userId, {
    slug: body.slug,
    displayName: body.displayName,
    summary: body.summary,
  });

  return { soul };
});

fastify.patch("/souls/:id", { preHandler: [async (req) => requireAuth(req)] }, async (request) => {
  const session = await requireAuth(request);
  const { id } = request.params as { id: string };
  const body = request.body as { displayName?: string; summary?: string };
  const { updateSoul } = await import("./lib/souls.js");

  const soul = await updateSoul(id, session.userId, body);
  return { soul };
});

fastify.delete("/souls/:id", { preHandler: [async (req) => requireAuth(req)] }, async (request) => {
  const session = await requireAuth(request);
  const { id } = request.params as { id: string };
  const { deleteSoul } = await import("./lib/souls.js");

  await deleteSoul(id, session.userId);
  return { success: true };
});

fastify.get("/souls/:id/versions", async (request) => {
  const { id } = request.params as { id: string };
  const { getSoulVersions } = await import("./lib/souls.js");

  const versions = await getSoulVersions(id);
  return { versions };
});

fastify.post("/souls/:id/versions", { preHandler: [async (req) => requireAuth(req)] }, async (request) => {
  const session = await requireAuth(request);
  const { id } = request.params as { id: string };
  const body = request.body as {
    version: string;
    changelog: string;
    files: Array<{ path: string; size: number; storageId: string; sha256: string; contentType?: string }>;
    frontmatter?: Record<string, unknown>;
    metadata?: unknown;
    clawdis?: unknown;
  };
  const { createSoulVersion } = await import("./lib/souls.js");

  const version = await createSoulVersion(session.userId, id, {
    version: body.version,
    changelog: body.changelog,
    files: body.files,
    frontmatter: body.frontmatter,
    metadata: body.metadata,
    clawdis: body.clawdis,
  });

  return { version };
});

fastify.get("/users/me/souls", { preHandler: [async (req) => requireAuth(req)] }, async (request) => {
  const session = await requireAuth(request);
  const { getUserSouls } = await import("./lib/souls.js");

  const souls = await getUserSouls(session.userId);
  return { souls };
});

fastify.get("/search", async (request) => {
  const { q, limit, offset, highlighted, nonSuspicious } = request.query as {
    q?: string;
    limit?: number;
    offset?: number;
    highlighted?: string;
    nonSuspicious?: string;
  };

  if (!q || q.trim().length === 0) {
    return { results: [], query: q };
  }

  const { searchSkills } = await import("./lib/search.js");

  const results = await searchSkills(q, {
    limit: limit || 20,
    offset: offset || 0,
    highlightedOnly: highlighted === "true",
    nonSuspiciousOnly: nonSuspicious !== "false",
  });

  return { results, query: q };
});

fastify.get("/search/skills", async (request) => {
  const { q, limit, offset } = request.query as {
    q?: string;
    limit?: number;
    offset?: number;
  };

  if (!q || q.trim().length === 0) {
    return { results: [] };
  }

  const { searchSkills } = await import("./lib/search.js");

  const results = await searchSkills(q, {
    limit: limit || 20,
    offset: offset || 0,
    nonSuspiciousOnly: true,
  });

  return { results };
});

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || "3001");
    await fastify.listen({ port, host: "0.0.0.0" });
    console.log(`Server running on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
