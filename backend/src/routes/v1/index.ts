import { FastifyInstance } from "fastify";
import { registerWhoamiV1 } from "./whoami.js";
import { registerUsersV1 } from "./users.js";
import { listSkills, getSkillBySlug, registerPublishSkillV1, registerSkillVersionsV1, registerSkillManageV1 } from "./skills.js";
import { registerSearchV1 } from "./search.js";
import { registerResolveV1 } from "./resolve.js";
import { registerDownloadV1 } from "./download.js";
import { registerStarsV1 } from "./stars.js";
import { registerTransfersV1 } from "./transfers.js";
import { registerSoulsV1 } from "./souls.js";

export async function registerV1Routes(fastify: FastifyInstance) {
  await fastify.register(async (f) => {
    await registerWhoamiV1(f);
    await registerUsersV1(f);
    await registerSearchV1(f);
    await registerResolveV1(f);
    await registerDownloadV1(f);
    await registerStarsV1(f);
    await registerTransfersV1(f);
    await f.register(listSkills);
    await f.register(getSkillBySlug);
    await f.register(registerPublishSkillV1);
    await f.register(registerSkillVersionsV1);
    await f.register(registerSkillManageV1);
    await registerSoulsV1(f);
  }, { prefix: "/api/v1" });
}
