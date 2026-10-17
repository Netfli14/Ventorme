import { list, put, get, BlobError } from "@vercel/blob";
import { mkdir, writeFile, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

// Explicit development adapter for real end-to-end testing; never used on Vercel.
const localRoot = () =>
  !process.env.VERCEL && process.env.NODE_ENV !== "production"
    ? process.env.VENTORME_LOCAL_DATA_DIR
    : undefined;
export const storageConfigured = () =>
  Boolean(
    localRoot() ||
      process.env.BLOB_READ_WRITE_TOKEN ||
      process.env.BLOB_STORE_ID,
  );
const safe = (key: string) => {
  if (!/^[a-zA-Z0-9/_.-]+$/.test(key) || key.includes(".."))
    throw new Error("Invalid key");
  return key;
};
export type StoredFile = { pathname: string; uploadedAt: Date };
export async function savePrivate(
  key: string,
  data: unknown,
): Promise<"created" | "exists"> {
  safe(key);
  const root = localRoot();
  if (root) {
    const file = path.join(root, key);
    await mkdir(path.dirname(file), { recursive: true });
    try {
      await writeFile(file, JSON.stringify(data), { flag: "wx", mode: 0o600 });
      return "created";
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "EEXIST") return "exists";
      throw e;
    }
  }
  if (!storageConfigured()) throw new Error("Storage not configured");
  try {
    await put(key, JSON.stringify(data), {
      access: "private",
      addRandomSuffix: false,
      allowOverwrite: false,
      contentType: "application/json",
    });
    return "created";
  } catch (e) {
    if (e instanceof BlobError && /already exists/i.test(e.message))
      return "exists";
    throw e;
  }
}
export async function readPrivate<T>(key: string): Promise<T | null> {
  safe(key);
  const root = localRoot();
  if (root) {
    try {
      return JSON.parse(await readFile(path.join(root, key), "utf8")) as T;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw e;
    }
  }
  const result = await get(key, { access: "private", useCache: false });
  if (!result) return null;
  if (result.statusCode !== 200) throw new Error("Read failed");
  return (await new Response(result.stream).json()) as T;
}
export async function listPrivate(prefix: string): Promise<StoredFile[]> {
  safe(prefix);
  const root = localRoot();
  if (root) {
    const result: StoredFile[] = [];
    async function walk(dir: string) {
      let files;
      try {
        files = await readdir(path.join(root!, dir), { withFileTypes: true });
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code === "ENOENT") return;
        throw e;
      }
      for (const f of files) {
        const key = path.posix.join(dir, f.name);
        if (f.isDirectory()) await walk(key);
        else
          result.push({
            pathname: key,
            uploadedAt: (await stat(path.join(root!, key))).mtime,
          });
      }
    }
    await walk(prefix);
    return result;
  }
  const result: StoredFile[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    result.push(
      ...page.blobs.map((b) => ({
        pathname: b.pathname,
        uploadedAt: b.uploadedAt,
      })),
    );
    if (!page.hasMore) break;
    if (!page.cursor || page.cursor === cursor)
      throw new Error("Invalid pagination");
    cursor = page.cursor;
  } while (true);
  return result;
}
