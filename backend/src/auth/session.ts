import { db } from "../db/index.js";
import { authSessions } from "../db/schema.js";
import { eq, and, gt } from "drizzle-orm";
import { randomBytes, createHmac } from "crypto";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function sign(payload: object): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
  return `${header}.${body}.${sig}`;
}

function verify(token: string): { userId: string; sessionId: string } | null {
  try {
    const [header, body, sig] = token.split(".");
    const expectedSig = createHmac("sha256", JWT_SECRET).update(`${header}.${body}`).digest("base64url");
    if (sig !== expectedSig) return null;
    const payload = JSON.parse(Buffer.from(body, "base64url").toString());
    return payload;
  } catch {
    return null;
  }
}

export function generateToken(userId: string): { token: string; expiresAt: Date } {
  const sessionId = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  const token = sign({ userId, sessionId });
  return { token, expiresAt };
}

export async function createSession(userId: string) {
  const { token, expiresAt } = generateToken(userId);
  const tokenHash = createHmac("sha256", token).digest("hex");

  await db.insert(authSessions).values({
    userId,
    tokenHash,
    expiresAt,
  });

  return { token, expiresAt };
}

export async function validateSession(token: string) {
  const payload = verify(token);
  if (!payload) return null;

  const [session] = await db
    .select()
    .from(authSessions)
    .where(and(eq(authSessions.tokenHash, createHmac("sha256", token).digest("hex")), gt(authSessions.expiresAt, new Date())))
    .limit(1);

  return session || null;
}

export async function invalidateSession(token: string) {
  const tokenHash = createHmac("sha256", token).digest("hex");
  await db.delete(authSessions).where(eq(authSessions.tokenHash, tokenHash));
}

export function getTokenFromRequest(request: any): string | null {
  const auth = request.headers?.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

export async function requireAuth(request: any) {
  const token = getTokenFromRequest(request);
  if (!token) throw { statusCode: 401, message: "Unauthorized" };

  const session = await validateSession(token);
  if (!session) throw { statusCode: 401, message: "Invalid or expired session" };

  return session;
}
