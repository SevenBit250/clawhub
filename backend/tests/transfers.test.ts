import { describe, it, expect } from "vitest";
import { API_BASE, getAuthToken } from "./helpers.js";

describe("v1 Transfers", () => {
  it("GET /api/v1/transfers without auth returns 401", async () => {
    const res = await fetch(`${API_BASE}/api/v1/transfers`);
    expect(res.status).toBe(401);
  });

  it("GET /api/v1/transfers with auth returns transfers", async () => {
    const token = await getAuthToken();
    const res = await fetch(`${API_BASE}/api/v1/transfers`, {
      headers: { Authorization: `Bearer ${token}` },
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
