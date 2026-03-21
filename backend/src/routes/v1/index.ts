import { FastifyInstance } from "fastify";
import { registerWhoamiV1 } from "./whoami.js";
import { registerUsersV1 } from "./users.js";
import { listSkills, getSkillBySlug, registerPublishSkillV1, registerSkillVersionsV1, registerSkillManageV1 } from "./skills.js";
import { registerSearchV1 } from "./search.js";
import { registerResolveV1 } from "./resolve.js";
import { registerStarsV1 } from "./stars.js";
import { registerTransfersV1 } from "./transfers.js";
import { registerSoulsV1 } from "./souls.js";

export async function registerV1Routes(fastify: FastifyInstance) {
  await registerWhoamiV1(fastify);
  await registerUsersV1(fastify);
  await registerSearchV1(fastify);
  await registerResolveV1(fastify);
  await registerStarsV1(fastify);
  await registerTransfersV1(fastify);
  await fastify.register(listSkills);
  await fastify.register(getSkillBySlug);
  await fastify.register(registerPublishSkillV1);
  await fastify.register(registerSkillVersionsV1);
  await fastify.register(registerSkillManageV1);
  await registerSoulsV1(fastify);
}
