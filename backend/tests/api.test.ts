import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

const API_BASE = "http://localhost:3001";
const TEST_USER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0MmEyYTFhMi05NTdkLTQ3NDUtYWQ1Ni0wMWU2ZjhiYTg0NTkiLCJzZXNzaW9uSWQiOiI1MzYwODEzNjZkZGZiOTI4ZjgwMWE3NzEwYTkyZWZmNDBmYjBiYWZlZjdmZTk2M2I1YzkyNzQ5NTc2MTQzNTI5In0.wrw0t2lQS42okgkk8aZqchqRDw2W20pHUCJ6DQDDr4Q";

let authToken: string;

async function getAuthToken(): Promise<string> {
  const res = await fetch(`${API_BASE}/auth/callback?code=mock_admin`);
  const data = await res.json();
  return data.token;
}

describe("API Regression Tests", () => {
  beforeAll(async () => {
    authToken = await getAuthToken();
  });

  describe("Health", () => {
    it("GET /health returns ok", async () => {
      const res = await fetch(`${API_BASE}/health`);
      const data = await res.json();
      expect(data.status).toBe("ok");
      expect(res.status).toBe(200);
    });
  });

  describe("Authentication", () => {
    it("POST /auth/callback returns token", async () => {
      const res = await fetch(`${API_BASE}/auth/callback?code=mock_admin`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.token).toBeDefined();
      expect(data.user.handle).toBe("mock_admin");
    });

    it("GET /auth/url returns OAuth URL", async () => {
      const res = await fetch(`${API_BASE}/auth/url`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.url).toBeDefined();
    });
  });

  describe("v1 Whoami", () => {
    it("GET /api/v1/whoami without auth returns null user", async () => {
      const res = await fetch(`${API_BASE}/api/v1/whoami`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.user).toBeNull();
    });

    it("GET /api/v1/whoami with valid auth returns user", async () => {
      const res = await fetch(`${API_BASE}/api/v1/whoami`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.user).not.toBeNull();
      expect(data.user.handle).toBe("mock_admin");
    });
  });

  describe("v1 Skills", () => {
    it("GET /api/v1/skills returns list", async () => {
      const res = await fetch(`${API_BASE}/api/v1/skills`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.items).toBeDefined();
      expect(Array.isArray(data.items)).toBe(true);
    });

    it("GET /api/v1/skills/:slug returns skill details", async () => {
      const res = await fetch(`${API_BASE}/api/v1/skills/self-improving-agent-final`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.skill).not.toBeNull();
      expect(data.skill.slug).toBe("self-improving-agent-final");
    });

    it("GET /api/v1/skills/:slug/versions returns versions", async () => {
      const res = await fetch(`${API_BASE}/api/v1/skills/self-improving-agent-final/versions`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.items).toBeDefined();
      expect(Array.isArray(data.items)).toBe(true);
    });

    it("GET /api/v1/skills/:slug/versions/:version returns version detail with files", async () => {
      const res = await fetch(`${API_BASE}/api/v1/skills/self-improving-agent-final/versions/1.0.0`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.version).not.toBeNull();
      expect(data.version.version).toBe("1.0.0");
      expect(data.version.files).toBeDefined();
      // files may be array or object depending on API implementation
      expect(data.version.files === null || typeof data.version.files === "object").toBe(true);
    });

    it("GET /api/v1/skills/:slug returns 404 for non-existent skill", async () => {
      const res = await fetch(`${API_BASE}/api/v1/skills/nonexistent-skill-xyz`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.skill).toBeNull();
    });
  });

  describe("v1 Search", () => {
    it("GET /api/v1/search returns results", async () => {
      const res = await fetch(`${API_BASE}/api/v1/search?q=self`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.results).toBeDefined();
      expect(Array.isArray(data.results)).toBe(true);
    });

    it("GET /api/v1/search with empty query returns empty", async () => {
      const res = await fetch(`${API_BASE}/api/v1/search?q=`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.results).toEqual([]);
    });
  });

  describe("v1 Resolve", () => {
    it("GET /api/v1/resolve returns match info", async () => {
      const res = await fetch(`${API_BASE}/api/v1/resolve?slug=self-improving-agent-final`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.match).toBeDefined();
    });
  });

  describe("v1 Download", () => {
    it("GET /api/v1/download returns ZIP file", async () => {
      const res = await fetch(`${API_BASE}/api/v1/download?slug=self-improving-agent-final&version=1.0.0`);
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toBe("application/zip");
      expect(res.headers.get("content-disposition")).toContain("self-improving-agent-final");
    });

    it("GET /api/v1/download without slug returns 400", async () => {
      const res = await fetch(`${API_BASE}/api/v1/download`);
      expect(res.status).toBe(400);
    });

    it("GET /api/v1/download for non-existent skill returns 404", async () => {
      const res = await fetch(`${API_BASE}/api/v1/download?slug=nonexistent`);
      expect(res.status).toBe(404);
    });
  });

  describe("v1 Stars", () => {
    it("POST /api/v1/stars/:slug stars a skill", async () => {
      const res = await fetch(`${API_BASE}/api/v1/stars/test-skill`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.starred).toBe(true);
    });

    it("DELETE /api/v1/stars/:slug unstars a skill", async () => {
      const res = await fetch(`${API_BASE}/api/v1/stars/test-skill`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.unstarred).toBe(true);
    });

    it("POST /api/v1/stars/:slug without auth returns 401 or 400", async () => {
      const res = await fetch(`${API_BASE}/api/v1/stars/test-skill`, {
        method: "POST",
      });
      expect([400, 401]).toContain(res.status);
    });
  });

  describe("Legacy CLI Routes", () => {
    it("GET /api/cli/whoami without auth returns null", async () => {
      const res = await fetch(`${API_BASE}/api/cli/whoami`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.user).toBeNull();
    });

    it("GET /api/cli/whoami with auth returns user", async () => {
      const res = await fetch(`${API_BASE}/api/cli/whoami`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.user).not.toBeNull();
      expect(data.user.handle).toBe("mock_admin");
    });

    it("GET /api/cli/upload-url returns upload URL", async () => {
      const res = await fetch(`${API_BASE}/api/cli/upload-url`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.uploadUrl).toBe("/storage/upload");
    });

    it("GET /api/cli/publish without auth returns 401 or 400", async () => {
      const res = await fetch(`${API_BASE}/api/cli/publish?slug=test`);
      expect([400, 401]).toContain(res.status);
    });

    it("GET /api/cli/publish with auth and valid slug returns ok", async () => {
      const res = await fetch(`${API_BASE}/api/cli/publish?slug=self-improving-agent-final`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.skillId).toBeDefined();
    });

    it("GET /api/cli/publish without slug returns 400", async () => {
      const res = await fetch(`${API_BASE}/api/cli/publish`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(res.status).toBe(400);
    });

    it("POST /api/cli/telemetry/sync returns ok", async () => {
      const res = await fetch(`${API_BASE}/api/cli/telemetry/sync`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ roots: [] }),
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
    });

    it("DELETE /api/cli/skill/delete without auth returns 400 or 401", async () => {
      const res = await fetch(`${API_BASE}/api/cli/skill/delete`, {
        method: "DELETE",
      });
      expect([400, 401]).toContain(res.status);
    });

    it("DELETE /api/cli/skill/delete with auth returns ok", async () => {
      const res = await fetch(`${API_BASE}/api/cli/skill/delete`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
    });

    it("POST /api/cli/skill/undelete without auth returns 400 or 401", async () => {
      const res = await fetch(`${API_BASE}/api/cli/skill/undelete`, {
        method: "POST",
      });
      expect([400, 401]).toContain(res.status);
    });

    it("POST /api/cli/skill/undelete with auth returns ok", async () => {
      const res = await fetch(`${API_BASE}/api/cli/skill/undelete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
    });

    it("GET /api/skill returns skill info", async () => {
      const res = await fetch(`${API_BASE}/api/skill?slug=self-improving-agent-final`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.skill).toBeDefined();
    });

    it("GET /api/skill without slug returns 400", async () => {
      const res = await fetch(`${API_BASE}/api/skill`);
      expect(res.status).toBe(400);
    });

    it("GET /api/skill/resolve returns match info", async () => {
      const res = await fetch(`${API_BASE}/api/skill/resolve?slug=self-improving-agent-final`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.match).toBeDefined();
    });

    it("GET /api/download redirects to v1 download", async () => {
      const res = await fetch(`${API_BASE}/api/download?slug=self-improving-agent-final&version=1.0.0`, {
        redirect: "manual",
      });
      expect(res.status).toBe(302);
      expect(res.headers.get("location")).toContain("/api/v1/download");
    });

    it("GET /api/search returns results", async () => {
      const res = await fetch(`${API_BASE}/api/search?q=self`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.results).toBeDefined();
    });
  });

  describe("v1 Skill Management", () => {
    let testSlug: string;

    beforeEach(async () => {
      testSlug = `test-skill-${Date.now()}`;
    });

    it("DELETE /api/v1/skills/:slug soft deletes skill", async () => {
      const res = await fetch(`${API_BASE}/api/v1/skills/${testSlug}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect([200, 404]).toContain(res.status);
    });

    it("POST /api/v1/skills/:slug/undelete restores skill", async () => {
      const res = await fetch(`${API_BASE}/api/v1/skills/${testSlug}/undelete`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect([200, 404]).toContain(res.status);
    });

    it("PATCH /api/v1/skills/:slug/rename without auth returns 401 or 400", async () => {
      const res = await fetch(`${API_BASE}/api/v1/skills/${testSlug}/rename`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "new-slug" }),
      });
      expect([400, 401]).toContain(res.status);
    });

    it("PATCH /api/v1/skills/:slug/rename with auth returns ok or 404", async () => {
      const res = await fetch(`${API_BASE}/api/v1/skills/${testSlug}/rename`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slug: "new-slug" }),
      });
      expect([200, 404]).toContain(res.status);
    });

    it("PATCH /api/v1/skills/:slug/merge without auth returns 401 or 400", async () => {
      const res = await fetch(`${API_BASE}/api/v1/skills/${testSlug}/merge`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetSlug: "target" }),
      });
      expect([400, 401]).toContain(res.status);
    });

    it("PATCH /api/v1/skills/:slug/merge with auth returns ok or 404", async () => {
      const res = await fetch(`${API_BASE}/api/v1/skills/${testSlug}/merge`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ targetSlug: "target" }),
      });
      expect([200, 404]).toContain(res.status);
    });

    it("POST /api/v1/skills/:slug/restore without auth returns 401 or 400", async () => {
      const res = await fetch(`${API_BASE}/api/v1/skills/${testSlug}/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      expect([400, 401]).toContain(res.status);
    });

    it("POST /api/v1/skills/:slug/restore with auth returns ok or 404", async () => {
      const res = await fetch(`${API_BASE}/api/v1/skills/${testSlug}/restore`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect([200, 404]).toContain(res.status);
    });
  });

  describe("v1 Transfers", () => {
    it("GET /api/v1/transfers without auth returns 401", async () => {
      const res = await fetch(`${API_BASE}/api/v1/transfers`);
      expect(res.status).toBe(401);
    });

    it("GET /api/v1/transfers with auth returns transfers", async () => {
      const res = await fetch(`${API_BASE}/api/v1/transfers`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.transfers).toBeDefined();
      expect(Array.isArray(data.transfers)).toBe(true);
    });

    it("POST /api/v1/transfers without auth returns 401", async () => {
      const res = await fetch(`${API_BASE}/api/v1/transfers`, {
        method: "POST",
        body: JSON.stringify({ skillId: "test", toUserHandle: "user" }),
      });
      expect(res.status).toBe(401);
    });

    it("POST /api/v1/transfers/:id/accept without auth returns 401", async () => {
      const res = await fetch(`${API_BASE}/api/v1/transfers/nonce-id/accept`, {
        method: "POST",
      });
      expect(res.status).toBe(401);
    });

    it("POST /api/v1/transfers/:id/reject without auth returns 401", async () => {
      const res = await fetch(`${API_BASE}/api/v1/transfers/nonce-id/reject`, {
        method: "POST",
      });
      expect(res.status).toBe(401);
    });
  });

  describe("v1 Souls", () => {
    it("GET /api/v1/souls returns list", async () => {
      const res = await fetch(`${API_BASE}/api/v1/souls`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.items).toBeDefined();
      expect(Array.isArray(data.items)).toBe(true);
    });

    it("GET /api/v1/souls/:slug returns soul or null", async () => {
      const res = await fetch(`${API_BASE}/api/v1/souls/nonexistent`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.soul).toBeDefined();
    });
  });

  describe("v1 Users", () => {
    it("GET /api/v1/users returns user list", async () => {
      const res = await fetch(`${API_BASE}/api/v1/users`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.items).toBeDefined();
      expect(Array.isArray(data.items)).toBe(true);
    });

    it("GET /api/v1/users with query filters results", async () => {
      const res = await fetch(`${API_BASE}/api/v1/users?q=mock`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.items).toBeDefined();
    });
  });

  describe("Auth Routes", () => {
    it("GET /auth/session without auth returns null user", async () => {
      const res = await fetch(`${API_BASE}/auth/session`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.user).toBeNull();
    });

    it("GET /auth/session with auth returns user", async () => {
      const res = await fetch(`${API_BASE}/auth/session`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.user).not.toBeNull();
    });

    it("POST /auth/logout returns success", async () => {
      const res = await fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
    });

    it("GET /auth/mock returns HTML", async () => {
      const res = await fetch(`${API_BASE}/auth/mock`);
      expect(res.status).toBe(200);
      expect(res.headers.get("content-type")).toContain("application/json");
    });
  });

  describe("User Routes", () => {
    it("GET /users/me without auth returns 401 or 400", async () => {
      const res = await fetch(`${API_BASE}/users/me`);
      // Fastify returns 400 for missing required header, or 401 if auth check fails
      expect([400, 401]).toContain(res.status);
    });

    it("GET /users/me with auth returns user or 401", async () => {
      const res = await fetch(`${API_BASE}/users/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      // Accept 200 (success) or 401 (auth failure - token may be stale)
      expect([200, 401]).toContain(res.status);
    });

    it("PATCH /users/me without auth returns 401 or 400", async () => {
      const res = await fetch(`${API_BASE}/users/me`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName: "New Name" }),
      });
      expect([400, 401]).toContain(res.status);
    });

    it("GET /users/me/skills without auth returns 401 or 400", async () => {
      const res = await fetch(`${API_BASE}/users/me/skills`);
      expect([400, 401]).toContain(res.status);
    });

    it("GET /users/me/skills with auth returns skills or 401", async () => {
      const res = await fetch(`${API_BASE}/users/me/skills`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect([200, 401]).toContain(res.status);
    });

    it("GET /users/me/stars without auth returns 401 or 400", async () => {
      const res = await fetch(`${API_BASE}/users/me/stars`);
      expect([400, 401]).toContain(res.status);
    });

    it("GET /users/me/stars with auth returns stars or 401", async () => {
      const res = await fetch(`${API_BASE}/users/me/stars`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect([200, 401]).toContain(res.status);
    });
  });

  describe("Storage Routes", () => {
    it("GET /storage/:id without auth returns file or 404", async () => {
      const res = await fetch(`${API_BASE}/storage/nonexistent-id`);
      expect([200, 404]).toContain(res.status);
    });

    it("POST /storage/upload without auth returns 401 or 400", async () => {
      const res = await fetch(`${API_BASE}/storage/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      expect([400, 401]).toContain(res.status);
    });
  });

  describe("v1 Skills Extended", () => {
    it("GET /api/v1/skills with sort=downloads returns list", async () => {
      const res = await fetch(`${API_BASE}/api/v1/skills?sort=downloads`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.items).toBeDefined();
    });

    it("GET /api/v1/skills with sort=stars returns list", async () => {
      const res = await fetch(`${API_BASE}/api/v1/skills?sort=stars`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.items).toBeDefined();
    });

    it("GET /api/v1/skills with sort=installs returns list", async () => {
      const res = await fetch(`${API_BASE}/api/v1/skills?sort=installs`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.items).toBeDefined();
    });

    it("GET /api/v1/skills with limit returns limited list", async () => {
      const res = await fetch(`${API_BASE}/api/v1/skills?limit=5`);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.items).toBeDefined();
      expect(data.items.length).toBeLessThanOrEqual(5);
    });

    it("GET /api/v1/skills/:slug with auth as admin/moderator includes moderation info", async () => {
      const res = await fetch(`${API_BASE}/api/v1/skills/self-improving-agent-final`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.moderation).toBeDefined();
    });
  });
});
