import { describe, it, expect } from "vitest";
import { API_BASE, getAuthToken } from "./helpers.js";

describe("v1 Whoami", () => {
  it("GET /api/v1/whoami without auth returns null user", async () => {
    const res = await fetch(`${API_BASE}/api/v1/whoami`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user).toBeNull();
  });

  it("GET /api/v1/whoami with valid auth returns user", async () => {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/api/v1/whoami`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user).not.toBeNull();
    expect(data.user.handle).toBe("mock_admin");
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
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/api/cli/whoami`, {
      headers: { Authorization: `Bearer ${token}` },
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
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/api/cli/publish?slug=self-improving-agent-final`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.skillId).toBeDefined();
  });

  it("GET /api/cli/publish without slug returns 400", async () => {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/api/cli/publish`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(400);
  });

  it("POST /api/cli/telemetry/sync returns ok", async () => {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/api/cli/telemetry/sync`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
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
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/api/cli/skill/delete`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
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
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/api/cli/skill/undelete`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
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
