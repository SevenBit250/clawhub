import type { FastifyPluginAsync } from "fastify";
import { db } from "../../db/index.js";
import { skills, users, auditLogs } from "../../db/schema.js";
import { eq, and, desc, isNull, inArray, sql } from "drizzle-orm";
import { requireAdmin, requireModerator } from "../../auth/session.js";

const registerAdminSkillsV1: FastifyPluginAsync = async (fastify) => {
  // Get all skills for admin (with all statuses)
  fastify.get("/admin/skills", {
    schema: {
      description: "获取所有技能列表（管理员用）",
      tags: ["admin"],
      headers: {
        type: "object",
        required: ["authorization"],
        properties: {
          authorization: { type: "string" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  slug: { type: "string" },
                  displayName: { type: "string" },
                  summary: { type: "string", nullable: true },
                  moderationStatus: { type: "string" },
                  moderationReason: { type: "string", nullable: true },
                  createdAt: { type: "string" },
                  updatedAt: { type: "string" },
                  ownerUserId: { type: "string" },
                  ownerHandle: { type: "string", nullable: true },
                  ownerDisplayName: { type: "string", nullable: true },
                  ownerImage: { type: "string", nullable: true },
                },
              },
            },
          },
        },
      },
    },
    async handler(request) {
      await requireModerator(request);

      const allSkills = await db
        .select({
          id: skills.id,
          slug: skills.slug,
          displayName: skills.displayName,
          summary: skills.summary,
          moderationStatus: skills.moderationStatus,
          moderationReason: skills.moderationReason,
          createdAt: skills.createdAt,
          updatedAt: skills.updatedAt,
          ownerUserId: skills.ownerUserId,
          ownerHandle: users.handle,
          ownerDisplayName: users.displayName,
          ownerImage: users.image,
        })
        .from(skills)
        .leftJoin(users, eq(skills.ownerUserId, users.id))
        .where(isNull(skills.softDeletedAt))
        .orderBy(desc(skills.createdAt));

      return { items: allSkills };
    },
  });

  // Get pending skills for moderation
  fastify.get("/admin/skills/pending", {
    schema: {
      description: "获取待审核的技能列表",
      tags: ["admin"],
      headers: {
        type: "object",
        required: ["authorization"],
        properties: {
          authorization: { type: "string" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  slug: { type: "string" },
                  displayName: { type: "string" },
                  summary: { type: "string", nullable: true },
                  moderationStatus: { type: "string" },
                  createdAt: { type: "string" },
                  updatedAt: { type: "string" },
                  ownerUserId: { type: "string" },
                  ownerHandle: { type: "string", nullable: true },
                  ownerDisplayName: { type: "string", nullable: true },
                  ownerImage: { type: "string", nullable: true },
                },
              },
            },
          },
        },
      },
    },
    async handler(request) {
    const session = await requireModerator(request);

    const pendingSkills = await db
      .select({
        id: skills.id,
        slug: skills.slug,
        displayName: skills.displayName,
        summary: skills.summary,
        moderationStatus: skills.moderationStatus,
        createdAt: skills.createdAt,
        updatedAt: skills.updatedAt,
        ownerUserId: skills.ownerUserId,
        ownerHandle: users.handle,
        ownerDisplayName: users.displayName,
        ownerImage: users.image,
      })
      .from(skills)
      .leftJoin(users, eq(skills.ownerUserId, users.id))
      .where(and(
        eq(skills.moderationStatus, "pending"),
        isNull(skills.softDeletedAt)
      ))
      .orderBy(desc(skills.createdAt));

    return { items: pendingSkills };
    },
  });

  // Approve a skill
  fastify.post("/admin/skills/:id/approve", {
    schema: {
      description: "批准技能",
      tags: ["admin"],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" },
        },
      },
      headers: {
        type: "object",
        required: ["authorization"],
        properties: {
          authorization: { type: "string" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            ok: { type: "boolean" },
          },
        },
      },
    },
    async handler(request) {
    const session = await requireModerator(request);
    const { id } = request.params as { id: string };

    const [skill] = await db
      .select()
      .from(skills)
      .where(eq(skills.id, id))
      .limit(1);

    if (!skill) {
      throw { statusCode: 404, message: "Skill not found" };
    }

    await db
      .update(skills)
      .set({
        moderationStatus: "active",
        updatedAt: new Date(),
      })
      .where(eq(skills.id, id));

    // Log the action
    await db.insert(auditLogs).values({
      actorUserId: session.user.id,
      action: "skill.approve",
      targetType: "skill",
      targetId: id,
      metadata: JSON.stringify({ slug: skill.slug }),
    });

    return { ok: true as const };
    },
  });

  // Reject a skill
  fastify.post("/admin/skills/:id/reject", {
    schema: {
      description: "驳回技能",
      tags: ["admin"],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" },
        },
      },
      headers: {
        type: "object",
        required: ["authorization"],
        properties: {
          authorization: { type: "string" },
        },
      },
      body: {
        type: "object",
        properties: {
          reason: { type: "string" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            ok: { type: "boolean" },
          },
        },
      },
    },
    async handler(request) {
    const session = await requireModerator(request);
    const { id } = request.params as { id: string };
    const body = request.body as { reason?: string };

    const [skill] = await db
      .select()
      .from(skills)
      .where(eq(skills.id, id))
      .limit(1);

    if (!skill) {
      throw { statusCode: 404, message: "Skill not found" };
    }

    await db
      .update(skills)
      .set({
        moderationStatus: "removed",
        moderationReason: body.reason || null,
        updatedAt: new Date(),
      })
      .where(eq(skills.id, id));

    // Log the action
    await db.insert(auditLogs).values({
      actorUserId: session.user.id,
      action: "skill.reject",
      targetType: "skill",
      targetId: id,
      metadata: JSON.stringify({ slug: skill.slug, reason: body.reason }),
    });

    return { ok: true as const };
    },
  });

  // Hide a skill (can be used on active skills too)
  fastify.post("/admin/skills/:id/hide", {
    schema: {
      description: "隐藏技能",
      tags: ["admin"],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" },
        },
      },
      headers: {
        type: "object",
        required: ["authorization"],
        properties: {
          authorization: { type: "string" },
        },
      },
      body: {
        type: "object",
        properties: {
          reason: { type: "string" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            ok: { type: "boolean" },
          },
        },
      },
    },
    async handler(request) {
    const session = await requireModerator(request);
    const { id } = request.params as { id: string };
    const body = request.body as { reason?: string };

    const [skill] = await db
      .select()
      .from(skills)
      .where(eq(skills.id, id))
      .limit(1);

    if (!skill) {
      throw { statusCode: 404, message: "Skill not found" };
    }

    await db
      .update(skills)
      .set({
        moderationStatus: "hidden",
        moderationReason: body.reason || null,
        updatedAt: new Date(),
      })
      .where(eq(skills.id, id));

    // Log the action
    await db.insert(auditLogs).values({
      actorUserId: session.user.id,
      action: "skill.hide",
      targetType: "skill",
      targetId: id,
      metadata: JSON.stringify({ slug: skill.slug, reason: body.reason }),
    });

    return { ok: true as const };
    },
  });

  // Unhide a skill (restore to active)
  fastify.post("/admin/skills/:id/unhide", {
    schema: {
      description: "取消隐藏技能",
      tags: ["admin"],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" },
        },
      },
      headers: {
        type: "object",
        required: ["authorization"],
        properties: {
          authorization: { type: "string" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            ok: { type: "boolean" },
          },
        },
      },
    },
    async handler(request) {
    const session = await requireModerator(request);
    const { id } = request.params as { id: string };

    const [skill] = await db
      .select()
      .from(skills)
      .where(eq(skills.id, id))
      .limit(1);

    if (!skill) {
      throw { statusCode: 404, message: "Skill not found" };
    }

    await db
      .update(skills)
      .set({
        moderationStatus: "active",
        updatedAt: new Date(),
      })
      .where(eq(skills.id, id));

    // Log the action
    await db.insert(auditLogs).values({
      actorUserId: session.user.id,
      action: "skill.unhide",
      targetType: "skill",
      targetId: id,
      metadata: JSON.stringify({ slug: skill.slug }),
    });

    return { ok: true as const };
    },
  });

  // Delete a skill (soft delete, available to moderators/admins)
  fastify.delete("/admin/skills/:id", {
    schema: {
      description: "删除技能（软删除）",
      tags: ["admin"],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" },
        },
      },
      headers: {
        type: "object",
        required: ["authorization"],
        properties: {
          authorization: { type: "string" },
        },
      },
      body: {
        type: "object",
        properties: {
          reason: { type: "string" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            ok: { type: "boolean" },
          },
        },
      },
    },
    async handler(request) {
      const session = await requireModerator(request);
      const { id } = request.params as { id: string };
      const body = request.body as { reason?: string };

      const [skill] = await db
        .select()
        .from(skills)
        .where(eq(skills.id, id))
        .limit(1);

      if (!skill) {
        throw { statusCode: 404, message: "Skill not found" };
      }

      await db
        .update(skills)
        .set({
          softDeletedAt: new Date(),
          moderationReason: body.reason || null,
          updatedAt: new Date(),
        })
        .where(eq(skills.id, id));

      // Log the action
      await db.insert(auditLogs).values({
        actorUserId: session.user.id,
        action: "skill.delete",
        targetType: "skill",
        targetId: id,
        metadata: JSON.stringify({ slug: skill.slug, reason: body.reason }),
      });

      return { ok: true as const };
    },
  });

  // Batch fetch skills by IDs
  fastify.get("/admin/skills/batch", {
    schema: {
      description: "批量获取技能详情",
      tags: ["admin"],
      headers: {
        type: "object",
        required: ["authorization"],
        properties: {
          authorization: { type: "string" },
        },
      },
      querystring: {
        type: "object",
        required: ["ids"],
        properties: {
          ids: { type: "string", description: "逗号分隔的技能ID列表" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  slug: { type: "string" },
                  displayName: { type: "string" },
                  summary: { type: "string", nullable: true },
                  moderationStatus: { type: "string" },
                  moderationReason: { type: "string", nullable: true },
                  createdAt: { type: "string" },
                  updatedAt: { type: "string" },
                  ownerUserId: { type: "string" },
                  ownerHandle: { type: "string", nullable: true },
                  ownerDisplayName: { type: "string", nullable: true },
                  ownerImage: { type: "string", nullable: true },
                },
              },
            },
          },
        },
      },
    },
    async handler(request) {
      await requireModerator(request);
      const { ids } = request.query as { ids: string };

      if (!ids || ids.trim() === "") {
        return { items: [] };
      }

      const idList = ids.split(",").map((id) => id.trim()).filter(Boolean);

      if (idList.length === 0) {
        return { items: [] };
      }

      const skillsData = await db
        .select({
          id: skills.id,
          slug: skills.slug,
          displayName: skills.displayName,
          summary: skills.summary,
          moderationStatus: skills.moderationStatus,
          moderationReason: skills.moderationReason,
          createdAt: skills.createdAt,
          updatedAt: skills.updatedAt,
          ownerUserId: skills.ownerUserId,
          ownerHandle: users.handle,
          ownerDisplayName: users.displayName,
          ownerImage: users.image,
        })
        .from(skills)
        .leftJoin(users, eq(skills.ownerUserId, users.id))
        .where(inArray(skills.id, idList));

      return { items: skillsData };
    },
  });

  // Get admin statistics
  fastify.get("/admin/stats", {
    schema: {
      description: "获取后台统计数据",
      tags: ["admin"],
      headers: {
        type: "object",
        required: ["authorization"],
        properties: {
          authorization: { type: "string" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            pendingSkillsCount: { type: "number" },
            activeSkillsCount: { type: "number" },
            totalUsersCount: { type: "number" },
            recentActivity: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: { type: "string" },
                  targetType: { type: "string" },
                  targetId: { type: "string" },
                  actorUserId: { type: "string" },
                  createdAt: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    async handler(request) {
      await requireModerator(request);

      // Get pending skills count
      const [pendingResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(skills)
        .where(and(
          eq(skills.moderationStatus, "pending"),
          isNull(skills.softDeletedAt)
        ));

      // Get active skills count
      const [activeResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(skills)
        .where(and(
          eq(skills.moderationStatus, "active"),
          isNull(skills.softDeletedAt)
        ));

      // Get total users count
      const [usersResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(users);

      // Get recent audit logs (last 10)
      const recentLogs = await db
        .select({
          action: auditLogs.action,
          targetType: auditLogs.targetType,
          targetId: auditLogs.targetId,
          actorUserId: auditLogs.actorUserId,
          createdAt: auditLogs.createdAt,
        })
        .from(auditLogs)
        .orderBy(desc(auditLogs.createdAt))
        .limit(10);

      return {
        pendingSkillsCount: pendingResult?.count ?? 0,
        activeSkillsCount: activeResult?.count ?? 0,
        totalUsersCount: usersResult?.count ?? 0,
        recentActivity: recentLogs,
      };
    },
  });
};

const registerAdminUsersV1: FastifyPluginAsync = async (fastify) => {
  // List all users
  fastify.get("/admin/users", {
    schema: {
      description: "获取所有用户列表",
      tags: ["admin"],
      headers: {
        type: "object",
        required: ["authorization"],
        properties: {
          authorization: { type: "string" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  handle: { type: "string", nullable: true },
                  displayName: { type: "string", nullable: true },
                  email: { type: "string", nullable: true },
                  image: { type: "string", nullable: true },
                  role: { type: "string", nullable: true },
                  createdAt: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    async handler(request) {
    const session = await requireAdmin(request);

    const allUsers = await db
      .select({
        id: users.id,
        handle: users.handle,
        displayName: users.displayName,
        email: users.email,
        image: users.image,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    return { items: allUsers };
    },
  });

  // Update user role
  fastify.patch("/admin/users/:id/role", {
    schema: {
      description: "更新用户角色",
      tags: ["admin"],
      params: {
        type: "object",
        required: ["id"],
        properties: {
          id: { type: "string" },
        },
      },
      headers: {
        type: "object",
        required: ["authorization"],
        properties: {
          authorization: { type: "string" },
        },
      },
      body: {
        type: "object",
        required: ["role"],
        properties: {
          role: { type: "string", enum: ["admin", "moderator", "user"] },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            ok: { type: "boolean" },
          },
        },
      },
    },
    async handler(request) {
    const session = await requireAdmin(request);
    const { id } = request.params as { id: string };
    const body = request.body as { role: "admin" | "moderator" | "user" };

    if (!["admin", "moderator", "user"].includes(body.role)) {
      throw { statusCode: 400, message: "Invalid role" };
    }

    // Prevent self-demotion
    if (id === session.user.id) {
      throw { statusCode: 400, message: "Cannot change your own role" };
    }

    const [targetUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    if (!targetUser) {
      throw { statusCode: 404, message: "User not found" };
    }

    await db
      .update(users)
      .set({ role: body.role, updatedAt: new Date() })
      .where(eq(users.id, id));

    // Log the action
    await db.insert(auditLogs).values({
      actorUserId: session.user.id,
      action: "user.updateRole",
      targetType: "user",
      targetId: id,
      metadata: JSON.stringify({ newRole: body.role }),
    });

    return { ok: true as const };
    },
  });

  // Batch fetch users by IDs
  fastify.get("/admin/users/batch", {
    schema: {
      description: "批量获取用户详情",
      tags: ["admin"],
      headers: {
        type: "object",
        required: ["authorization"],
        properties: {
          authorization: { type: "string" },
        },
      },
      querystring: {
        type: "object",
        required: ["ids"],
        properties: {
          ids: { type: "string", description: "逗号分隔的用户ID列表" },
        },
      },
      response: {
        200: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  handle: { type: "string", nullable: true },
                  displayName: { type: "string", nullable: true },
                  email: { type: "string", nullable: true },
                  image: { type: "string", nullable: true },
                  role: { type: "string", nullable: true },
                  createdAt: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    async handler(request) {
      await requireAdmin(request);
      const { ids } = request.query as { ids: string };

      if (!ids || ids.trim() === "") {
        return { items: [] };
      }

      const idList = ids.split(",").map((id) => id.trim()).filter(Boolean);

      if (idList.length === 0) {
        return { items: [] };
      }

      const usersData = await db
        .select({
          id: users.id,
          handle: users.handle,
          displayName: users.displayName,
          email: users.email,
          image: users.image,
          role: users.role,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(inArray(users.id, idList));

      return { items: usersData };
    },
  });
};

export { registerAdminSkillsV1, registerAdminUsersV1 };
