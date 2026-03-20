import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

export interface WeComUser {
  userId: string;
  name: string;
  department: string;
  avatar?: string;
}

export interface WeComAuthProvider {
  getAuthUrl(state: string): string;
  exchangeCode(code: string): Promise<WeComUser>;
  getUserInfo(userId: string): Promise<WeComUser>;
}

export class MockWeComAuth implements WeComAuthProvider {
  private mockUsers: Map<string, WeComUser> = new Map([
    ["mock_admin", { userId: "mock_admin", name: "Admin User", department: "IT" }],
    ["mock_user", { userId: "mock_user", name: "Test User", department: "Engineering" }],
  ]);

  getAuthUrl(state: string): string {
    const callbackUrl = encodeURIComponent(process.env.WECOM_CALLBACK_URL || "http://localhost:3001/auth/callback");
    return `/auth/mock?state=${state}&callback=${callbackUrl}`;
  }

  async exchangeCode(code: string): Promise<WeComUser> {
    const user = this.mockUsers.get(code);
    if (!user) {
      return { userId: code, name: `User ${code.slice(0, 8)}`, department: "General" };
    }
    return user;
  }

  async getUserInfo(userId: string): Promise<WeComUser> {
    return this.mockUsers.get(userId) || { userId, name: "Unknown", department: "Unknown" };
  }
}

export async function findOrCreateUser(weComUser: WeComUser) {
  const existing = await db.query.users.findFirst({
    where: eq(users.email, `${weComUser.userId}@mock.local`),
  });

  if (existing) return existing;

  const [newUser] = await db.insert(users).values({
    email: `${weComUser.userId}@mock.local`,
    name: weComUser.name,
    image: weComUser.avatar,
    displayName: weComUser.name,
    handle: weComUser.userId,
  }).returning();

  return newUser;
}
