import { FastifyInstance } from "fastify";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { validateSession } from "../../auth/session.js";
import { eq } from "drizzle-orm";

export async function registerWhoamiV1(fastify: FastifyInstance) {
  fastify.get("/whoami", async (request) => {
    const auth = request.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      return { user: null };
    }

    const token = auth.slice(7);
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
  });
}
