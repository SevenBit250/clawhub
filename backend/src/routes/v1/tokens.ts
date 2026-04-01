import { FastifyInstance } from "fastify";
import { requireAuth } from "../../auth/session.js";
import {
	createApiToken,
	listApiTokens,
	revokeApiToken,
} from "../../lib/apiTokens.js";

export async function registerTokenRoutes(fastify: FastifyInstance) {
	// GET /api/v1/tokens - 列出当前用户的 API tokens
	fastify.get("/tokens", {
		schema: {
			description: "列出当前用户的 API tokens",
			tags: ["tokens"],
			security: [{ BearerAuth: [] }],
			response: {
				200: {
					type: "object",
					properties: {
						tokens: {
							type: "array",
							items: {
								type: "object",
								properties: {
									id: { type: "string" },
									label: { type: "string" },
									token: { type: "string" },
									prefix: { type: "string" },
									createdAt: { type: "string", format: "date-time" },
									lastUsedAt: { type: "string", format: "date-time", nullable: true },
								},
							},
						},
					},
				},
			},
		},
		async handler(request) {
			const session = await requireAuth(request);
			const tokens = await listApiTokens(session.userId);
			return { tokens };
		},
	});

	// POST /api/v1/tokens - 创建新的 API token
	fastify.post("/tokens", {
		schema: {
			description: "创建新的 API token",
			tags: ["tokens"],
			security: [{ BearerAuth: [] }],
			body: {
				type: "object",
				required: ["label"],
				properties: {
					label: {
						type: "string",
						minLength: 1,
						maxLength: 100,
						description: "Token 标签，如 'CLI token', 'My Laptop'",
					},
				},
			},
			response: {
				200: {
					type: "object",
					properties: {
						id: { type: "string" },
						token: { type: "string", description: "完整 token，仅创建时返回一次" },
						prefix: { type: "string" },
						label: { type: "string" },
						createdAt: { type: "string", format: "date-time" },
					},
				},
			},
		},
		async handler(request) {
			const session = await requireAuth(request);
			const body = request.body as { label: string };

			const result = await createApiToken(session.userId, body.label);
			return result;
		},
	});

	// DELETE /api/v1/tokens/:id - 撤销 API token
	fastify.delete("/tokens/:id", {
		schema: {
			description: "撤销 API token",
			tags: ["tokens"],
			security: [{ BearerAuth: [] }],
			params: {
				type: "object",
				required: ["id"],
				properties: {
					id: { type: "string", description: "Token ID" },
				},
			},
			response: {
				200: {
					type: "object",
					properties: {
						success: { type: "boolean" },
					},
				},
				404: {
					type: "object",
					properties: {
						message: { type: "string" },
					},
				},
			},
		},
		async handler(request, reply) {
			const session = await requireAuth(request);
			const { id } = request.params as { id: string };

			const success = await revokeApiToken(id, session.userId);

			if (!success) {
				reply.code(404);
				return { message: "Token not found or already revoked" };
			}

			return { success: true };
		},
	});
}
