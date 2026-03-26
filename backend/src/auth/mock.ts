import { FastifyInstance } from "fastify";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { createSession } from "./session.js";

export function registerMockAuthRoutes(fastify: FastifyInstance) {
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

      const handle = code;
      let user: any;

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
        return { url: "https://mock-authing.example.com/oauth/authorize?mock=true" };
      }

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
      const mockUsers = [
        { code: "mock_admin", name: "Admin", role: "admin" },
        { code: "mock_test", name: "Test User", role: "user" },
      ];
      return { users: mockUsers };
    },
  });
}
