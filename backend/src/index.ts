import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import { createSession, invalidateSession, requireAuth } from "./auth/session.js";
import { MockWeComAuth, findOrCreateUser } from "./auth/wecom.js";
import { db } from "./db/index.js";
import { users } from "./db/schema.js";
import { eq } from "drizzle-orm";
import { registerV1Routes } from "./routes/v1/index.js";
import { registerLegacyRoutes } from "./routes/legacy/index.js";

const fastify = Fastify({ logger: true });
await fastify.register(cors, { origin: true });
await fastify.register(multipart);
await registerV1Routes(fastify);
await fastify.register(registerLegacyRoutes);

const wecomAuth = new MockWeComAuth();

fastify.get("/health", async () => ({ status: "ok" }));

fastify.get("/auth/url", async () => {
  const state = Math.random().toString(36).slice(2);
  return { url: wecomAuth.getAuthUrl(state) };
});

fastify.get("/auth/mock", async (request) => {
  const { state, callback } = request.query as { state?: string; callback?: string };

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Mock Login - ClawHub</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; }
    .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); width: 320px; }
    h1 { margin: 0 0 1.5rem; font-size: 1.5rem; text-align: center; }
    .btn { display: block; width: 100%; padding: 0.75rem; margin: 0.5rem 0; border: 1px solid #ddd; border-radius: 4px; background: #fafafa; cursor: pointer; font-size: 1rem; transition: background 0.2s; }
    .btn:hover { background: #f0f0f0; }
    .btn.primary { background: #3b82f6; color: white; border-color: #3b82f6; }
    .btn.primary:hover { background: #2563eb; }
    .note { margin-top: 1rem; font-size: 0.875rem; color: #666; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Mock Login</h1>
    <p>Select a mock user to login:</p>
    <button class="btn primary" onclick="login('mock_admin')">Login as Admin</button>
    <button class="btn" onclick="login('mock_user')">Login as Test User</button>
    <button class="btn" onclick="login('mock_new')">Login as New User</button>
    <p class="note">This is a mock login for development only</p>
  </div>
  <script>
    function login(code) {
      const callback = '${callback || ''}';
      if (callback) {
        window.location.href = callback + '?code=' + code + '&state=${state || ''}';
      } else {
        window.location.href = '/auth/callback?code=' + code;
      }
    }
  </script>
</body>
</html>
  `;

  return { html };
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

fastify.get("/users/me/skills", { preHandler: [async (req) => requireAuth(req)] }, async (request) => {
  const session = await requireAuth(request);
  const { getUserSkills } = await import("./lib/skills.js");

  const skills = await getUserSkills(session.userId);
  return { skills };
});

fastify.get("/users/me/stars", { preHandler: [async (req) => requireAuth(req)] }, async (request) => {
  const session = await requireAuth(request);
  const { getUserStars } = await import("./lib/stars.js");

  const stars = await getUserStars(session.userId);
  return { stars };
});

fastify.get("/users/me/souls", { preHandler: [async (req) => requireAuth(req)] }, async (request) => {
  const session = await requireAuth(request);
  const { getUserSouls } = await import("./lib/souls.js");

  const souls = await getUserSouls(session.userId);
  return { souls };
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
