import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import { put } from "@vercel/blob";

const MAX_BYTES = 6 * 1024 * 1024;

function sniffImageType(bytes: Buffer): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return "image/gif";
  }
  if (
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
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
  if (opts.file.size > MAX_BYTES) {
    return { error: "Image must be under 6MB." };
  }

  const buffer = Buffer.from(await opts.file.arrayBuffer());
  const type = sniffImageType(buffer);
  if (!type) {
    return { error: "Use a JPG, PNG, WebP, or GIF." };
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

  if (process.env.VERCEL) {
    try {
      const blob = await put(pathname, buffer, blobOptions);
      return { url: blob.url };
    } catch (err) {
      console.error("blob upload failed", err);
      return { error: "Could not save photo. Try again." };
    }
  }

  if (process.env["BLOB_READ_WRITE_TOKEN"] || blobStoreId) {
    try {
      const blob = await put(pathname, buffer, blobOptions);
      return { url: blob.url };
    } catch (err) {
      console.error("blob upload failed", err);
      return { error: "Could not save photo. Try again." };
    }
  }

  const dir = path.join(process.cwd(), "public", "uploads", opts.storeId);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buffer);
  return { url: `/uploads/${opts.storeId}/${name}` };
}
