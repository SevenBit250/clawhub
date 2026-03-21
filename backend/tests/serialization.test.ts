import { describe, it, expect } from "vitest";

describe("JSON serialization utilities", () => {
  describe("files array serialization", () => {
    it("serializes files array to JSON string", () => {
      const files = [
        {
          path: "SKILL.md",
          size: 100,
          storageId: "abc123def456",
          sha256: "xyz789",
          contentType: "text/markdown",
        },
      ];

      const serialized = JSON.stringify(files);
      const parsed = JSON.parse(serialized);

      expect(parsed).toEqual(files);
      expect(parsed[0].path).toBe("SKILL.md");
      expect(parsed[0].storageId).toBe("abc123def456");
    });

    it("handles multiple files", () => {
      const files = [
        { path: "file1.md", size: 50, storageId: "id1", sha256: "hash1" },
        { path: "file2.ts", size: 75, storageId: "id2", sha256: "hash2" },
        { path: "file3.json", size: 100, storageId: "id3", sha256: "hash3" },
      ];

      const serialized = JSON.stringify(files);
      const parsed = JSON.parse(serialized);

      expect(parsed).toHaveLength(3);
      expect(parsed[1].path).toBe("file2.ts");
    });

    it("does not corrupt data when round-tripping", () => {
      const original = {
        path: "test.md",
        size: 12345,
        storageId: "a".repeat(32),
        sha256: "b".repeat(64),
        contentType: "text/markdown",
      };

      const serialized = JSON.stringify([original]);
      const parsed = JSON.parse(serialized);

      expect(parsed[0]).toEqual(original);
    });
  });

  describe("frontmatter serialization", () => {
    it("serializes frontmatter object to JSON", () => {
      const frontmatter = {
        name: "test-skill",
        description: "A test skill",
        tags: ["test", "example"],
      };

      const serialized = JSON.stringify(frontmatter);
      const parsed = JSON.parse(serialized);

      expect(parsed).toEqual(frontmatter);
    });

    it("handles null frontmatter", () => {
      const frontmatter = null;
      const serialized = JSON.stringify(frontmatter);
      const parsed = JSON.parse(serialized);

      expect(parsed).toBeNull();
    });

    it("handles nested objects", () => {
      const frontmatter = {
        metadata: {
          author: { name: "Test", email: "test@example.com" },
          nested: { deep: { value: 123 } },
        },
      };

      const serialized = JSON.stringify(frontmatter);
      const parsed = JSON.parse(serialized);

      expect(parsed.metadata.author.name).toBe("Test");
      expect(parsed.metadata.nested.deep.value).toBe(123);
    });
  });

  describe("metadata serialization", () => {
    it("handles mixed content types", () => {
      const metadata = {
        string: "value",
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        object: { key: "value" },
        null: null,
      };

      const serialized = JSON.stringify(metadata);
      const parsed = JSON.parse(serialized);

      expect(parsed).toEqual(metadata);
    });
  });

  describe("clawdis serialization", () => {
    it("serializes clawdis object", () => {
      const clawdis = {
        version: "1.0.0",
        commands: ["build", "test", "deploy"],
        env: { NODE_ENV: "production" },
      };

      const serialized = JSON.stringify(clawdis);
      const parsed = JSON.parse(serialized);

      expect(parsed).toEqual(clawdis);
      expect(parsed.commands).toContain("build");
    });
  });

  describe("error handling", () => {
    it("throws on invalid JSON input when parsing", () => {
      const invalidJson = "{ invalid json }";

      expect(() => JSON.parse(invalidJson)).toThrow();
    });

    it("handles empty array", () => {
      const files: Array<{ path: string; storageId: string }> = [];
      const serialized = JSON.stringify(files);
      const parsed = JSON.parse(serialized);

      expect(parsed).toEqual([]);
      expect(parsed).toHaveLength(0);
    });

    it("handles special characters in strings", () => {
      const files = [
        { path: "file with 'quotes' and \"double quotes\"", storageId: "id" },
      ];
      const serialized = JSON.stringify(files);
      const parsed = JSON.parse(serialized);

      expect(parsed[0].path).toBe("file with 'quotes' and \"double quotes\"");
    });

    it("handles unicode characters", () => {
      const files = [
        { path: "文件.md", storageId: "中文" },
      ];
      const serialized = JSON.stringify(files);
      const parsed = JSON.parse(serialized);

      expect(parsed[0].path).toBe("文件.md");
      expect(parsed[0].storageId).toBe("中文");
    });
  });
});
