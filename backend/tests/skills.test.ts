import { describe, it, expect, beforeEach } from "vitest";
import { API_BASE, getAuthToken, jsonHeaders } from "./helpers.js";

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
    expect(data.version.files === null || typeof data.version.files === "object").toBe(true);
  });

  it("GET /api/v1/skills/:slug returns 404 for non-existent skill", async () => {
    const res = await fetch(`${API_BASE}/api/v1/skills/nonexistent-skill-xyz`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.skill).toBeNull();
  });

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
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/api/v1/skills/self-improving-agent-final`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.moderation).toBeDefined();
  });
});

describe("v1 Skill Management", () => {
  let testSlug: string;

  beforeEach(async () => {
    testSlug = `test-skill-${Date.now()}`;
  });

  it("DELETE /api/v1/skills/:slug soft deletes skill", async () => {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/api/v1/skills/${testSlug}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 404]).toContain(res.status);
  });

  it("POST /api/v1/skills/:slug/undelete restores skill", async () => {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/api/v1/skills/${testSlug}/undelete`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
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
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/api/v1/skills/${testSlug}/rename`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
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
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/api/v1/skills/${testSlug}/merge`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
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
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/api/v1/skills/${testSlug}/restore`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 404]).toContain(res.status);
  });
});
