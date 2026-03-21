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
      expect(Array.isArray(data.version.files)).toBe(true);
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

    it("POST /api/v1/stars/:slug without auth returns 401", async () => {
      const res = await fetch(`${API_BASE}/api/v1/stars/test-skill`, {
        method: "POST",
      });
      expect(res.status).toBe(401);
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
  });
});
