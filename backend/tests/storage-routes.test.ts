import { describe, it, expect } from "vitest";
import { API_BASE } from "./helpers.js";

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
