import { FastifyInstance } from "fastify";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { validateSession } from "../../auth/session.js";
import { getUserByApiToken } from "../../lib/apiTokens.js";
import { eq } from "drizzle-orm";

export async function registerWhoamiV1(fastify: FastifyInstance) {
  fastify.get("/whoami", {
    schema: {
      description: "获取当前用户信息",
      tags: ["users"],
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
                handle: { type: "string", nullable: true },
                displayName: { type: "string", nullable: true },
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
    if (!auth?.startsWith("Bearer ")) {
      return { user: null };
    }

    const token = auth.slice(7);

    // 环境变量控制：跳过验证（内网模式）
    if (process.env.CLI_ALLOW_ANY_TOKEN === "true") {
      // 返回第一个可用用户（内网模式）
      const [defaultUser] = await db
        .select({
          handle: users.handle,
          displayName: users.displayName,
          image: users.image,
          role: users.role,
        })
        .from(users)
        .limit(1);

      if (defaultUser) {
        return {
          user: {
            handle: defaultUser.handle,
            displayName: defaultUser.displayName,
            image: defaultUser.image,
            role: defaultUser.role,
          },
        };
      }
      return { user: null };
    }

    // 验证 API token (clh_ 前缀)
    if (token.startsWith("clh_")) {
      const user = await getUserByApiToken(token);
      if (user) {
        return {
          user: {
            handle: user.handle,
            displayName: user.displayName,
            image: user.image,
            role: user.role,
          },
        };
      }
    }

    // 验证 session token
    const session = await validateSession(token);
    if (!session) {
      return { user: null };
    }

    const [user] = await db
      .select({
        handle: users.handle,
        displayName: users.displayName,
        image: users.image,
        role: users.role,
      })
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);

    if (!user) {
      return { user: null };
    }

    return {
      user: {
        handle: user.handle,
        displayName: user.displayName,
        image: user.image,
        role: user.role,
      },
    };
    },
  });
}
