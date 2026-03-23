import { describe, it, expect } from "vitest";
import { API_BASE, getAuthToken, jsonHeaders } from "./helpers.js";

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

describe("Auth Routes", () => {
  it("GET /auth/session without auth returns null user", async () => {
    const res = await fetch(`${API_BASE}/auth/session`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user).toBeNull();
  });

  it("GET /auth/session with auth returns user", async () => {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/auth/session`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user).not.toBeNull();
  });

  it("POST /auth/logout returns success", async () => {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
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
