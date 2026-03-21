import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { storeFile, getFile, generateUploadId } from "../src/lib/storage.js";
import { rm, mkdir } from "fs/promises";
import { join } from "path";

const TEST_DIR = join(process.cwd(), "test-storage");

describe("storage", () => {
  beforeEach(async () => {
    process.env.STORAGE_DIR = TEST_DIR;
    await mkdir(TEST_DIR, { recursive: true });
  });

  afterEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  describe("generateUploadId", () => {
    it("generates unique 32-character hex IDs", async () => {
      const id1 = await generateUploadId();
      const id2 = await generateUploadId();
      expect(id1).toHaveLength(32);
      expect(id2).toHaveLength(32);
      expect(id1).not.toBe(id2);
    });

    it("contains only hex characters", async () => {
      const id = await generateUploadId();
      expect(id).toMatch(/^[0-9a-f]+$/);
    });
  });

  describe("storeFile and getFile", () => {
    it("stores and retrieves a file", async () => {
      const id = await generateUploadId();
      const content = Buffer.from("Hello, World!");
      const contentType = "text/plain";

      const stored = await storeFile(id, content, contentType);
      expect(stored.id).toBe(id);
      expect(stored.size).toBe(content.length);
      expect(stored.contentType).toBe(contentType);
      expect(stored.sha256).toHaveLength(64);

      const retrieved = await getFile(id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.data).toEqual(content);
      expect(retrieved!.file.id).toBe(id);
      expect(retrieved!.file.size).toBe(content.length);
    });

    it("stores JSON content and retrieves it correctly", async () => {
      const id = await generateUploadId();
      const content = Buffer.from('{"name":"test","value":123}');
      const contentType = "application/json";

      await storeFile(id, content, contentType);
      const retrieved = await getFile(id);

      expect(retrieved).not.toBeNull();
      expect(JSON.parse(retrieved!.data.toString())).toEqual({
        name: "test",
        value: 123,
      });
    });

    it("stores binary content and retrieves it correctly", async () => {
      const id = await generateUploadId();
      const content = Buffer.from([0x00, 0x01, 0x02, 0xff, 0xfe, 0xfd]);
      const contentType = "application/octet-stream";

      await storeFile(id, content, contentType);
      const retrieved = await getFile(id);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.data).toEqual(content);
    });

    it("returns null for non-existent file", async () => {
      const result = await getFile("nonexistent12345678901234567890");
      expect(result).toBeNull();
    });

    it("computes correct SHA256 hash", async () => {
      const id = await generateUploadId();
      const content = Buffer.from("test content");
      const contentType = "text/plain";

      const stored = await storeFile(id, content, contentType);
      expect(stored.sha256).toHaveLength(64);
      expect(stored.sha256).toMatch(/^[0-9a-f]+$/);
    });

    it("stores and retrieves file with correct content type based on extension", async () => {
      const id = await generateUploadId();
      const content = Buffer.from("# Hello\n\nThis is markdown.");
      const contentType = "text/markdown";

      const stored = await storeFile(id, content, contentType);
      expect(stored.contentType).toBe("text/markdown");

      const retrieved = await getFile(id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.file.contentType).toBe("text/markdown");
    });
  });
});
