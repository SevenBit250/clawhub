import { FastifyInstance } from "fastify";
import { db } from "../../db/index.js";
import { skillOwnershipTransfers, skills, users } from "../../db/schema.js";
import { validateSession } from "../../auth/session.js";
import { eq, and, or } from "drizzle-orm";

export async function registerTransfersV1(fastify: FastifyInstance) {
  fastify.get("/transfers", async (request) => {
    const auth = request.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      throw { statusCode: 401, message: "Unauthorized" };
    }

    const token = auth.slice(7);
    const session = await validateSession(token);
    if (!session) {
      throw { statusCode: 401, message: "Unauthorized" };
    }

    const transfers = await db
      .select({
        id: skillOwnershipTransfers.id,
        skillId: skillOwnershipTransfers.skillId,
        fromUserId: skillOwnershipTransfers.fromUserId,
        toUserId: skillOwnershipTransfers.toUserId,
        status: skillOwnershipTransfers.status,
        message: skillOwnershipTransfers.message,
        requestedAt: skillOwnershipTransfers.requestedAt,
        expiresAt: skillOwnershipTransfers.expiresAt,
        skillSlug: skills.slug,
        skillDisplayName: skills.displayName,
        fromUserHandle: users.handle,
        fromUserDisplayName: users.displayName,
      })
      .from(skillOwnershipTransfers)
      .leftJoin(skills, eq(skillOwnershipTransfers.skillId, skills.id))
      .leftJoin(users, eq(skillOwnershipTransfers.fromUserId, users.id))
      .where(
        or(
          eq(skillOwnershipTransfers.fromUserId, session.userId),
          eq(skillOwnershipTransfers.toUserId, session.userId)
        )
      );

    const formattedTransfers = transfers.map((t) => ({
      _id: t.id,
      skill: {
        _id: t.skillId,
        slug: t.skillSlug || "",
        displayName: t.skillDisplayName || "",
      },
      fromUser: {
        _id: t.fromUserId,
        handle: t.fromUserHandle,
        displayName: t.fromUserDisplayName,
      },
      toUser: {
        _id: t.toUserId,
        handle: null,
        displayName: null,
      },
      message: t.message,
      requestedAt: t.requestedAt ? t.requestedAt.getTime() : 0,
      expiresAt: t.expiresAt ? t.expiresAt.getTime() : 0,
    }));

    return { transfers: formattedTransfers };
  });

  // POST /api/v1/transfers - Request transfer
  fastify.post("/transfers", async (request) => {
    const auth = request.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      throw { statusCode: 401, message: "Unauthorized" };
    }

    const token = auth.slice(7);
    const session = await validateSession(token);
    if (!session) {
      throw { statusCode: 401, message: "Unauthorized" };
    }

    const body = request.body as {
      skillId: string;
      toUserHandle: string;
      message?: string;
    };

    // Find target user by handle
    const [toUser] = await db
      .select({ id: users.id, handle: users.handle })
      .from(users)
      .where(eq(users.handle, body.toUserHandle))
      .limit(1);

    if (!toUser) {
      throw { statusCode: 404, message: "User not found" };
    }

    // Verify skill ownership
    const [skill] = await db
      .select({ id: skills.id, ownerUserId: skills.ownerUserId })
      .from(skills)
      .where(eq(skills.id, body.skillId))
      .limit(1);

    if (!skill || skill.ownerUserId !== session.userId) {
      throw { statusCode: 403, message: "Not skill owner" };
    }

    // Create transfer (expires in 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const [transfer] = await db
      .insert(skillOwnershipTransfers)
      .values({
        skillId: body.skillId,
        fromUserId: session.userId,
        toUserId: toUser.id,
        status: "pending",
        message: body.message,
        expiresAt,
      })
      .returning();

    return {
      ok: true as const,
      transferId: transfer.id,
      toUserHandle: toUser.handle,
      expiresAt: expiresAt.getTime(),
    };
  });

  // POST /api/v1/transfers/:id/accept
  fastify.post("/transfers/:id/accept", async (request) => {
    const auth = request.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      throw { statusCode: 401, message: "Unauthorized" };
    }

    const token = auth.slice(7);
    const session = await validateSession(token);
    if (!session) {
      throw { statusCode: 401, message: "Unauthorized" };
    }

    const { id } = request.params as { id: string };

    const [transfer] = await db
      .select()
      .from(skillOwnershipTransfers)
      .where(
        and(
          eq(skillOwnershipTransfers.id, id),
          eq(skillOwnershipTransfers.toUserId, session.userId),
          eq(skillOwnershipTransfers.status, "pending")
        )
      )
      .limit(1);

    if (!transfer) {
      throw { statusCode: 404, message: "Transfer not found" };
    }

    // Update transfer status
    await db
      .update(skillOwnershipTransfers)
      .set({ status: "accepted", respondedAt: new Date() })
      .where(eq(skillOwnershipTransfers.id, id));

    // Change skill ownership
    const [skill] = await db
      .select({ slug: skills.slug })
      .from(skills)
      .where(eq(skills.id, transfer.skillId))
      .limit(1);

    await db
      .update(skills)
      .set({ ownerUserId: session.userId, updatedAt: new Date() })
      .where(eq(skills.id, transfer.skillId));

    return {
      ok: true as const,
      skillSlug: skill?.slug || null,
    };
  });

  // POST /api/v1/transfers/:id/reject
  fastify.post("/transfers/:id/reject", async (request) => {
    const auth = request.headers.authorization;
    if (!auth?.startsWith("Bearer ")) {
      throw { statusCode: 401, message: "Unauthorized" };
    }

    const token = auth.slice(7);
    const session = await validateSession(token);
    if (!session) {
      throw { statusCode: 401, message: "Unauthorized" };
    }

    const { id } = request.params as { id: string };

    const [transfer] = await db
      .select()
      .from(skillOwnershipTransfers)
      .where(
        and(
          eq(skillOwnershipTransfers.id, id),
          eq(skillOwnershipTransfers.toUserId, session.userId),
          eq(skillOwnershipTransfers.status, "pending")
        )
      )
      .limit(1);

    if (!transfer) {
      throw { statusCode: 404, message: "Transfer not found" };
    }

    const [skill] = await db
      .select({ slug: skills.slug })
      .from(skills)
      .where(eq(skills.id, transfer.skillId))
      .limit(1);

    await db
      .update(skillOwnershipTransfers)
      .set({ status: "rejected", respondedAt: new Date() })
      .where(eq(skillOwnershipTransfers.id, id));

    return {
      ok: true as const,
      skillSlug: skill?.slug || null,
    };
  });
}
