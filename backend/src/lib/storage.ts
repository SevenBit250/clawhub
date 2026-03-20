import { createHash } from "crypto";
import { join } from "path";
import { mkdir, writeFile, readFile, stat } from "fs/promises";
import { randomBytes } from "crypto";

const STORAGE_DIR = process.env.STORAGE_DIR || "./storage";

export interface StorageFile {
  id: string;
  path: string;
  size: number;
  contentType: string;
  sha256: string;
  createdAt: Date;
}

export async function ensureStorageDir() {
  await mkdir(STORAGE_DIR, { recursive: true });
}

export async function generateUploadId(): Promise<string> {
  return randomBytes(16).toString("hex");
}

export async function storeFile(
  id: string,
  data: Buffer,
  contentType: string
): Promise<StorageFile> {
  await ensureStorageDir();

  const dir = join(STORAGE_DIR, id.slice(0, 2));
  await mkdir(dir, { recursive: true });

  const filePath = join(dir, id);
  await writeFile(filePath, data);

  const sha256 = createHash("sha256").update(data).digest("hex");
  const stats = await stat(filePath);

  return {
    id,
    path: filePath,
    size: stats.size,
    contentType,
    sha256,
    createdAt: new Date(),
  };
}

export async function getFile(id: string): Promise<{ data: Buffer; file: StorageFile } | null> {
  const dir = join(STORAGE_DIR, id.slice(0, 2));
  const filePath = join(dir, id);

  try {
    const data = await readFile(filePath);
    const stats = await stat(filePath);
    const contentType = getContentType(filePath);
    const sha256 = createHash("sha256").update(data).digest("hex");

    return {
      data,
      file: {
        id,
        path: filePath,
        size: stats.size,
        contentType,
        sha256,
        createdAt: stats.mtime,
      },
    };
  } catch {
    return null;
  }
}

function getContentType(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase();
  const types: Record<string, string> = {
    md: "text/markdown",
    txt: "text/plain",
    json: "application/json",
    yaml: "text/yaml",
    yml: "text/yaml",
    ts: "text/typescript",
    js: "application/javascript",
    png: "image/png",
    jpg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
    zip: "application/zip",
    tar: "application/x-tar",
    gz: "application/gzip",
  };
  return types[ext || ""] || "application/octet-stream";
}
