import { describe, it, expect } from "vitest";
import { API_BASE, getAuthToken } from "./helpers.js";

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

describe("User Routes", () => {
  it("GET /users/me without auth returns 401 or 400", async () => {
    const res = await fetch(`${API_BASE}/users/me`);
    expect([400, 401]).toContain(res.status);
  });

  it("GET /users/me with auth returns user or 401", async () => {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
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
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/users/me/skills`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 401]).toContain(res.status);
  });

  it("GET /users/me/stars without auth returns 401 or 400", async () => {
    const res = await fetch(`${API_BASE}/users/me/stars`);
    expect([400, 401]).toContain(res.status);
  });

  it("GET /users/me/stars with auth returns stars or 401", async () => {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/users/me/stars`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect([200, 401]).toContain(res.status);
  });
});
