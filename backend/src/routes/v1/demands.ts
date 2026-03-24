import { FastifyInstance } from "fastify";

export async function registerDemandsV1(fastify: FastifyInstance) {
  const externalUrl = process.env.DEMANDS_SERVICE_URL;

  if (!externalUrl) {
    fastify.get("/demands", {
      schema: {
        description: "需求列表",
        tags: ["demands"],
        response: {
          200: {
            type: "object",
            properties: {
              items: { type: "array", items: { type: "object" } },
            },
          },
        },
      },
      async handler() {
        return { items: [] };
      },
    });
    return;
  }

  fastify.get("/demands", {
    schema: {
      description: "需求列表（代理到外部服务）",
      tags: ["demands"],
      response: {
        200: {
          type: "object",
          properties: {
            items: { type: "array", items: { type: "object" } },
          },
        },
      },
    },
    async handler(request) {
      const url = new URL("/api/demands", externalUrl);
      if (request.query) {
        Object.entries(request.query as Record<string, string>).forEach(([key, value]) => {
          url.searchParams.set(key, value);
        });
      }

      const response = await fetch(url.toString(), {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw { statusCode: 502, message: "External service error" };
      }

      return response.json();
    },
  });
}
