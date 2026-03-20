import { db } from "../db/index.js";
import { comments, users } from "../db/schema.js";
import { eq, and, isNull, desc } from "drizzle-orm";

export async function createComment(userId: string, skillId: string, body: string) {
  const [comment] = await db.insert(comments).values({
    userId,
    skillId,
    body,
  }).returning();

  return comment;
}

export async function getSkillComments(skillId: string) {
  return db.query.comments.findMany({
    where: and(eq(comments.skillId, skillId), isNull(comments.softDeletedAt)),
    with: { user: true },
    orderBy: desc(comments.createdAt),
  });
}

export async function getUserComments(userId: string) {
  return db.query.comments.findMany({
    where: and(eq(comments.userId, userId), isNull(comments.softDeletedAt)),
    with: { skill: true },
    orderBy: desc(comments.createdAt),
  });
}

export async function getCommentById(commentId: string) {
  return db.query.comments.findFirst({
    where: eq(comments.id, commentId),
    with: { user: true },
  });
}

export async function deleteComment(commentId: string, userId: string, isMod: boolean = false) {
  const comment = await getCommentById(commentId);
  if (!comment) return null;

  if (comment.userId !== userId && !isMod) {
    throw new Error("Not authorized to delete this comment");
  }

  const [updated] = await db
    .update(comments)
    .set({
      softDeletedAt: new Date(),
      deletedBy: userId,
    })
    .where(eq(comments.id, commentId))
    .returning();

  return updated;
}
