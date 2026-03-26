import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

export interface AuthingUser {
  authingUserId: string;
  name?: string;
  email?: string;
  picture?: string;
}

// 使用 handle 字段临时存储 authingUserId
// NG 版本将在数据库添加专门的 authingUserId 字段
export async function findOrCreateUserByAuthing(authingUser: AuthingUser) {
  // 使用 handle 查找（存储的是 authingUserId）
  const existing = await db.query.users.findFirst({
    where: eq(users.handle, authingUser.authingUserId),
  });

  if (existing) return existing;

  const [newUser] = await db.insert(users).values({
    email: authingUser.email,
    name: authingUser.name,
    image: authingUser.picture,
    displayName: authingUser.name,
    handle: authingUser.authingUserId, // 临时用 handle 存储 authingUserId
  }).returning();

  return newUser;
}
