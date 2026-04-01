import { db } from "../db/index.js";
import { apiTokens, users } from "../db/schema.js";
import { eq, and, isNull } from "drizzle-orm";
import { randomBytes, createHmac } from "crypto";

const API_TOKEN_PREFIX = "clh_";
const API_TOKEN_LENGTH = 32; // 32 hex chars = 16 bytes

/**
 * 生成 API token
 * 格式: clh_<32位十六进制字符>
 */
export function generateApiTokenValue(): string {
	const random = randomBytes(API_TOKEN_LENGTH);
	return `${API_TOKEN_PREFIX}${random.toString("hex")}`;
}

/**
 * 创建 API token
 * @param userId 用户 ID
 * @param label Token 标签（如 "CLI token", "My Laptop"）
 * @returns 包含 token 和元数据的对象
 */
export async function createApiToken(userId: string, label: string) {
	const token = generateApiTokenValue();
	const prefix = token.slice(0, 10); // 前 10 字符用于识别
	const tokenHash = createHmac("sha256", token).digest("hex");

	const [apiToken] = await db
		.insert(apiTokens)
		.values({
			userId,
			label: label.slice(0, 100), // 限制长度
			prefix,
			token,
			tokenHash,
		})
		.returning();

	return {
		id: apiToken.id,
		token,
		prefix,
		label: apiToken.label,
		createdAt: apiToken.createdAt,
	};
}

/**
 * 验证 API token
 * @param token 完整 token 字符串
 * @returns token 记录或 null
 */
export async function validateApiToken(token: string) {
	// 检查前缀
	if (!token.startsWith(API_TOKEN_PREFIX)) {
		return null;
	}

	const tokenHash = createHmac("sha256", token).digest("hex");

	const [apiToken] = await db
		.select()
		.from(apiTokens)
		.where(
			and(
				eq(apiTokens.tokenHash, tokenHash),
				isNull(apiTokens.revokedAt),
			),
		)
		.limit(1);

	if (!apiToken) {
		return null;
	}

	// 更新最后使用时间
	await db
		.update(apiTokens)
		.set({ lastUsedAt: new Date() })
		.where(eq(apiTokens.id, apiToken.id));

	// 返回类似 session 的结构，兼容现有代码
	return {
		id: apiToken.id,
		userId: apiToken.userId,
		tokenId: apiToken.id,
		isApiToken: true,
	};
}

/**
 * 列出用户的 API tokens
 * @param userId 用户 ID
 * @returns API token 列表（包含完整 token）
 */
export async function listApiTokens(userId: string) {
	const tokens = await db
		.select({
			id: apiTokens.id,
			label: apiTokens.label,
			prefix: apiTokens.prefix,
			token: apiTokens.token,
			createdAt: apiTokens.createdAt,
			lastUsedAt: apiTokens.lastUsedAt,
			revokedAt: apiTokens.revokedAt,
		})
		.from(apiTokens)
		.where(
			and(eq(apiTokens.userId, userId), isNull(apiTokens.revokedAt)),
		)
		.orderBy(apiTokens.createdAt);

	return tokens;
}

/**
 * 撤销 API token
 * @param tokenId Token ID
 * @param userId 用户 ID（验证所有权）
 * @returns 是否成功
 */
export async function revokeApiToken(tokenId: string, userId: string): Promise<boolean> {
	const result = await db
		.update(apiTokens)
		.set({ revokedAt: new Date() })
		.where(
			and(
				eq(apiTokens.id, tokenId),
				eq(apiTokens.userId, userId),
				isNull(apiTokens.revokedAt),
			),
		)
		.returning();

	return result.length > 0;
}

/**
 * 获取 token 所属用户信息
 * @param token API token
 * @returns 用户信息或 null
 */
export async function getUserByApiToken(token: string) {
	const session = await validateApiToken(token);
	if (!session) return null;

	const [user] = await db
		.select({
			id: users.id,
			handle: users.handle,
			displayName: users.displayName,
			image: users.image,
			role: users.role,
		})
		.from(users)
		.where(eq(users.id, session.userId))
		.limit(1);

	return user || null;
}
