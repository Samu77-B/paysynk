import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { put } from "@vercel/blob";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 6 * 1024 * 1024;

function resolveType(file: File): string | null {
  if (file.type === "image/jpg") return "image/jpeg";
  if (ALLOWED.has(file.type)) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return null;
}

function extensionFor(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  return "jpg";
}

export async function saveProductImageFile(opts: {
  storeId: string;
  file: File;
  folder?: "products" | "logos";
}): Promise<{ url: string; error?: undefined } | { url?: undefined; error: string }> {
  const type = resolveType(opts.file);
  if (!type) {
    return { error: "Use a JPG, PNG, WebP, or GIF." };
  }
  if (opts.file.size > MAX_BYTES) {
    return { error: "Image must be under 6MB." };
  }

  const folder = opts.folder ?? "products";
  const name = `${randomBytes(8).toString("hex")}.${extensionFor(type)}`;
  const pathname = `${folder}/${opts.storeId}/${name}`;
  const blobStoreId =
    process.env["BLOB2_STORE_ID"] || process.env["BLOB_STORE_ID"];

  const blobOptions = {
    access: "public" as const,
    contentType: type,
    addRandomSuffix: false,
    ...(blobStoreId ? { storeId: blobStoreId } : {}),
  };

  // On Vercel always use Blob. Pass storeId explicitly because this project
  // connected the public store as BLOB2_STORE_ID, not BLOB_STORE_ID.
  if (process.env.VERCEL) {
    try {
      const blob = await put(pathname, opts.file, blobOptions);
      return { url: blob.url };
    } catch (err) {
      console.error("blob upload failed", err);
      const detail = err instanceof Error ? err.message : "unknown error";
      return {
        error: `Could not save photo. ${detail}`,
      };
    }
  }

  if (process.env["BLOB_READ_WRITE_TOKEN"] || blobStoreId) {
    const blob = await put(pathname, opts.file, blobOptions);
    return { url: blob.url };
  }

  const dir = path.join(process.cwd(), "public", "uploads", opts.storeId);
  await mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await opts.file.arrayBuffer());
  await writeFile(path.join(dir, name), buffer);
  return { url: `/uploads/${opts.storeId}/${name}` };
}
