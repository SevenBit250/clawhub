import { describe, it, expect } from "vitest";
import { API_BASE } from "./helpers.js";

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
