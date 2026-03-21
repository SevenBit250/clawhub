import { FastifyInstance } from "fastify";
import { db } from "../../db/index.js";
import { users } from "../../db/schema.js";
import { and, isNull, like, or, sql } from "drizzle-orm";

export async function registerUsersV1(fastify: FastifyInstance) {
  fastify.get("/users", async (request) => {
    const { q, limit: limitStr, offset: offsetStr } = request.query as {
      q?: string;
      limit?: string;
      offset?: string;
    };

    const limit = Math.min(parseInt(limitStr || "20") || 20, 100);
    const offset = parseInt(offsetStr || "0") || 0;

    const conditions = [isNull(users.deletedAt)];

    if (q && q.trim()) {
      const searchTerm = `%${q.trim()}%`;
      conditions.push(
        or(
          like(users.handle, searchTerm),
          like(users.displayName, searchTerm),
          like(users.name, searchTerm)
        )!
      );
    }

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(...conditions));

    const total = Number(countResult?.count || 0);

    const items = await db
      .select({
        userId: users.id,
        handle: users.handle,
        displayName: users.displayName,
        name: users.name,
        role: users.role,
      })
      .from(users)
      .where(and(...conditions))
      .orderBy(users.handle)
      .limit(limit)
      .offset(offset);

    return { items, total };
  });
}
