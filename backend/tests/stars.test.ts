import { describe, it, expect } from "vitest";
import { API_BASE, getAuthToken } from "./helpers.js";

const TEST_SLUG = "self-improving-agent-final";

describe("v1 Stars", () => {
  it("POST /api/v1/stars/:slug stars a skill", async () => {
    const token = await getAuthToken();
    // Ensure skill is unstarred first
    await fetch(`${API_BASE}/api/v1/stars/${TEST_SLUG}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const res = await fetch(`${API_BASE}/api/v1/stars/${TEST_SLUG}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.starred).toBe(true);
  });

  it("DELETE /api/v1/stars/:slug unstars a skill", async () => {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/api/v1/stars/${TEST_SLUG}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.unstarred).toBe(true);
  });

  it("GET /api/v1/stars/:slug returns starred status", async () => {
    const token = await getAuthToken();
    // First star the skill
    await fetch(`${API_BASE}/api/v1/stars/${TEST_SLUG}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const res = await fetch(`${API_BASE}/api/v1/stars/${TEST_SLUG}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.starred).toBe(true);
  });

  it("GET /api/v1/stars/:slug without auth returns 401 or 400", async () => {
    const res = await fetch(`${API_BASE}/api/v1/stars/${TEST_SLUG}`);
    expect([400, 401]).toContain(res.status);
  });

  it("POST /api/v1/stars/:slug without auth returns 401 or 400", async () => {
    const res = await fetch(`${API_BASE}/api/v1/stars/${TEST_SLUG}`, {
      method: "POST",
    });
    expect([400, 401]).toContain(res.status);
  });
});
