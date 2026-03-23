import { describe, it, expect } from "vitest";
import { API_BASE } from "./helpers.js";

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
