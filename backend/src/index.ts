import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { createSession, invalidateSession, requireAuth } from "./auth/session.js";
import { findOrCreateUserByAuthing } from "./auth/authing.js";
import { db } from "./db/index.js";
import { users } from "./db/schema.js";
import { eq } from "drizzle-orm";
import { registerV1Routes } from "./routes/v1/index.js";
import { registerLegacyRoutes } from "./routes/legacy/index.js";

const fastify = Fastify({ logger: true });

// Swagger configuration
await fastify.register(swagger, {
  openapi: {
    info: {
      title: "ClawHub API",
      description: "AI Agent 技能市场的私有化部署版本 API",
      version: "1.0.0",
    },
    servers: [
      { url: "http://localhost:3001", description: "本地开发服务器" },
    ],
    tags: [
      { name: "health", description: "健康检查" },
      { name: "auth", description: "认证接口" },
      { name: "users", description: "用户接口" },
      { name: "storage", description: "文件存储" },
      { name: "comments", description: "评论接口" },
      { name: "skills", description: "技能管理" },
      { name: "search", description: "搜索" },
      { name: "admin", description: "管理员接口" },
    ],
  },
});

await fastify.register(swaggerUi, {
  routePrefix: "/docs",
  uiConfig: {
    docExpansion: "list",
    deepLinking: true,
  },
});

await fastify.register(cors, { origin: true });
await fastify.register(multipart);
await registerV1Routes(fastify);
await fastify.register(registerLegacyRoutes);

fastify.get("/health", {
  schema: {
    description: "健康检查",
    tags: ["health"],
    response: {
      200: {
        type: "object",
        properties: {
          status: { type: "string", example: "ok" },
        },
      },
    },
  },
  async handler() {
    return { status: "ok" };
  },
});

// Mock auth callback for development/testing
fastify.get("/auth/callback", {
  schema: {
    description: "模拟登录（开发环境）",
    tags: ["auth"],
    querystring: {
      type: "object",
      properties: {
        code: { type: "string", description: "模拟登录码" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          token: { type: "string" },
          expiresAt: { type: "string" },
          user: {
            type: "object",
            properties: {
              id: { type: "string" },
              handle: { type: "string" },
              name: { type: "string" },
              displayName: { type: "string" },
              email: { type: "string" },
              role: { type: "string" },
            },
          },
        },
      },
    },
  },
  async handler(request) {
    const { code } = request.query as { code?: string };

    if (!code || !code.startsWith("mock_")) {
      throw { statusCode: 400, message: "Invalid mock code" };
    }

    // Keep full mock code as handle (e.g., "mock_admin")
    const handle = code;
    let user: any;

    // Try to find existing user by handle - explicitly select fields
    const [existing] = await db
      .select({
        id: users.id,
        handle: users.handle,
        name: users.name,
        displayName: users.displayName,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(eq(users.handle, handle))
      .limit(1);

    if (existing) {
      user = existing;
    } else {
      // Create mock user
      [user] = await db.insert(users).values({
        handle,
        name: handle.replace("mock_", ""),
        displayName: handle.replace("mock_", ""),
        email: `${handle}@example.com`,
      }).returning();
    }

    const { token, expiresAt } = await createSession(user.id);

    return {
      token,
      expiresAt: expiresAt.toISOString(),
      user: {
        id: user.id,
        handle: user.handle,
        name: user.name,
        displayName: user.displayName,
        email: user.email,
        role: user.role,
      },
    };
  },
});

// Get OAuth URL for Authing login
fastify.get("/auth/url", {
  schema: {
    description: "获取 Authing OAuth 登录 URL",
    tags: ["auth"],
    response: {
      200: {
        type: "object",
        properties: {
          url: { type: "string" },
        },
      },
    },
  },
  async handler() {
    const domain = process.env.AUTHING_DOMAIN;
    const appId = process.env.AUTHING_APP_ID;
    const redirectUri = process.env.AUTHING_REDIRECT_URI || "http://localhost:3000/auth/callback";

    if (!domain || !appId) {
      // Return a mock URL for testing/development
      return { url: "https://mock-authing.example.com/oauth/authorize?mock=true" };
    }

    // Generate a random state
    const state = Math.random().toString(36).substring(7);

    const url = `https://${domain}.authing.cn/oauth/authorize?app_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${state}`;

    return { url };
  },
});

// Mock user selection page for development
fastify.get("/auth/mock", {
  schema: {
    description: "模拟登录选择页（开发环境）",
    tags: ["auth"],
    response: {
      200: {
        type: "object",
        properties: {
          users: { type: "array" },
        },
      },
    },
  },
  async handler() {
    // Return list of mock users for development login
    const mockUsers = [
      { code: "mock_admin", name: "Admin", role: "admin" },
      { code: "mock_test", name: "Test User", role: "user" },
    ];
    return { users: mockUsers };
  },
});

fastify.post("/auth/checkUser", {
  schema: {
    description: "检查并创建用户（Authing 登录后调用）",
    tags: ["auth"],
    body: {
      type: "object",
      required: ["authingUserId"],
      properties: {
        authingUserId: { type: "string", description: "Authing 用户唯一 ID (sub)" },
        name: { type: "string" },
        email: { type: "string" },
        picture: { type: "string" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          token: { type: "string" },
          expiresAt: { type: "string" },
          user: {
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string", nullable: true },
              email: { type: "string", nullable: true },
              handle: { type: "string", nullable: true },
              image: { type: "string", nullable: true },
              role: { type: "string", nullable: true },
            },
          },
        },
      },
    },
  },
  async handler(request) {
    const body = request.body as {
      authingUserId: string;
      name?: string;
      email?: string;
      picture?: string;
    };

    if (!body.authingUserId) {
      throw { statusCode: 400, message: "Missing authingUserId" };
    }

    const user = await findOrCreateUserByAuthing(body);
    const { token, expiresAt } = await createSession(user.id);

    return {
      token,
      expiresAt: expiresAt.toISOString(),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        handle: user.handle,
        displayName: user.displayName,
        image: user.image,
        bio: user.bio,
        role: user.role,
      },
    };
  },
});

fastify.post("/auth/logout", {
  schema: {
    description: "登出",
    tags: ["auth"],
    headers: {
      type: "object",
      properties: {
        authorization: { type: "string" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean" },
        },
      },
    },
  },
  async handler(request) {
    const auth = request.headers.authorization;
    if (auth?.startsWith("Bearer ")) {
      await invalidateSession(auth.slice(7));
    }
    return { success: true };
  },
});

fastify.get("/auth/session", {
  schema: {
    description: "获取当前会话",
    tags: ["auth"],
    headers: {
      type: "object",
      properties: {
        authorization: { type: "string" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          user: {
            type: "object",
            nullable: true,
            properties: {
              id: { type: "string" },
              name: { type: "string", nullable: true },
              email: { type: "string", nullable: true },
              handle: { type: "string", nullable: true },
              image: { type: "string", nullable: true },
              role: { type: "string", nullable: true },
            },
          },
        },
      },
    },
  },
  async handler(request) {
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
  },
});

fastify.get("/users/me", {
  schema: {
    description: "获取当前用户信息",
    tags: ["users"],
    headers: {
      type: "object",
      required: ["authorization"],
      properties: {
        authorization: { type: "string", description: "Bearer token" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string", nullable: true },
          email: { type: "string", nullable: true },
          handle: { type: "string", nullable: true },
          displayName: { type: "string", nullable: true },
          image: { type: "string", nullable: true },
          bio: { type: "string", nullable: true },
          role: { type: "string", nullable: true },
          createdAt: { type: "string" },
        },
      },
      401: {
        type: "object",
        properties: {
          statusCode: { type: "number" },
          message: { type: "string" },
        },
      },
    },
  },
  async handler(request) {
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
  },
});

fastify.patch("/users/me", {
  schema: {
    description: "更新当前用户信息",
    tags: ["users"],
    headers: {
      type: "object",
      required: ["authorization"],
      properties: {
        authorization: { type: "string", description: "Bearer token" },
      },
    },
    body: {
      type: "object",
      properties: {
        displayName: { type: "string" },
        bio: { type: "string" },
        image: { type: "string" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean" },
          user: { type: "object" },
        },
      },
    },
  },
  async handler(request) {
    const session = await requireAuth(request);
    const body = request.body as { displayName?: string; bio?: string; image?: string };

    const [user] = await db
      .update(users)
      .set({ displayName: body.displayName, bio: body.bio, image: body.image, updatedAt: new Date() })
      .where(eq(users.id, session.userId))
      .returning();

    return { success: true, user };
  },
});

fastify.get("/users/me/skills", {
  schema: {
    description: "获取当前用户的技能列表",
    tags: ["users"],
    headers: {
      type: "object",
      required: ["authorization"],
      properties: {
        authorization: { type: "string", description: "Bearer token" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          skills: { type: "array" },
        },
      },
    },
  },
  async handler(request) {
    const session = await requireAuth(request);
    const { getUserSkills } = await import("./lib/skills.js");

    const skills = await getUserSkills(session.userId);
    return { skills };
  },
});

fastify.get("/users/me/stars", {
  schema: {
    description: "获取当前用户收藏的技能",
    tags: ["users"],
    headers: {
      type: "object",
      required: ["authorization"],
      properties: {
        authorization: { type: "string", description: "Bearer token" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          stars: { type: "array" },
        },
      },
    },
  },
  async handler(request) {
    const session = await requireAuth(request);
    const { getUserStars } = await import("./lib/stars.js");

    const stars = await getUserStars(session.userId);
    return { stars };
  },
});

fastify.get("/users/me/souls", {
  schema: {
    description: "获取当前用户的灵魂列表",
    tags: ["users"],
    headers: {
      type: "object",
      required: ["authorization"],
      properties: {
        authorization: { type: "string", description: "Bearer token" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          souls: { type: "array" },
        },
      },
    },
  },
  async handler(request) {
    const session = await requireAuth(request);
    const { getUserSouls } = await import("./lib/souls.js");

    const souls = await getUserSouls(session.userId);
    return { souls };
  },
});

fastify.post("/storage/upload", {
  schema: {
    description: "上传文件",
    tags: ["storage"],
    headers: {
      type: "object",
      required: ["authorization"],
      properties: {
        authorization: { type: "string", description: "Bearer token" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          storageId: { type: "string" },
          size: { type: "number" },
          sha256: { type: "string" },
        },
      },
    },
  },
  async handler(request) {
    await requireAuth(request);
    const { generateUploadId, storeFile } = await import("./lib/storage.js");

    const data = await request.file();
    if (!data) return { error: "No file provided" };

    const buffer = await data.toBuffer();
    const id = await generateUploadId();
    const contentType = data.mimetype || "application/octet-stream";

    const file = await storeFile(id, buffer, contentType);

    return { storageId: id, size: file.size, sha256: file.sha256 };
  },
});

fastify.get("/storage/:id", {
  schema: {
    description: "下载文件",
    tags: ["storage"],
    params: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string", description: "文件 ID" },
      },
    },
    response: {
      200: {
        type: "string",
        contentEncoding: "binary",
      },
      404: {
        type: "object",
        properties: {
          error: { type: "string" },
        },
      },
    },
  },
  async handler(request, reply) {
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
  },
});

fastify.get("/skills/:id/comments", {
  schema: {
    description: "获取技能的评论",
    tags: ["comments"],
    params: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string", description: "技能 ID" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          comments: { type: "array" },
        },
      },
    },
  },
  async handler(request) {
    const { id } = request.params as { id: string };
    const { getSkillComments } = await import("./lib/comments.js");

    const comments = await getSkillComments(id);
    return { comments };
  },
});

fastify.post("/skills/:id/comments", {
  schema: {
    description: "添加评论",
    tags: ["comments"],
    params: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string", description: "技能 ID" },
      },
    },
    headers: {
      type: "object",
      required: ["authorization"],
      properties: {
        authorization: { type: "string", description: "Bearer token" },
      },
    },
    body: {
      type: "object",
      required: ["body"],
      properties: {
        body: { type: "string", description: "评论内容" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          comment: { type: "object" },
        },
      },
    },
  },
  async handler(request) {
    const session = await requireAuth(request);
    const { id } = request.params as { id: string };
    const body = request.body as { body: string };
    const { createComment } = await import("./lib/comments.js");

    const comment = await createComment(session.userId, id, body.body);
    return { comment };
  },
});

fastify.delete("/comments/:id", {
  schema: {
    description: "删除评论",
    tags: ["comments"],
    params: {
      type: "object",
      required: ["id"],
      properties: {
        id: { type: "string", description: "评论 ID" },
      },
    },
    headers: {
      type: "object",
      required: ["authorization"],
      properties: {
        authorization: { type: "string", description: "Bearer token" },
      },
    },
    response: {
      200: {
        type: "object",
        properties: {
          success: { type: "boolean" },
        },
      },
      400: {
        type: "object",
        properties: {
          error: { type: "string" },
        },
      },
    },
  },
  async handler(request) {
    const session = await requireAuth(request);
    const { id } = request.params as { id: string };
    const { deleteComment } = await import("./lib/comments.js");

    const result = await deleteComment(id, session.userId);
    if (!result) return { error: "Comment not found or not authorized" };

    return { success: true };
  },
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
