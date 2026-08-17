import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 6 * 1024 * 1024;

export async function saveProductImageFile(opts: {
  storeId: string;
  file: File;
}): Promise<{ url: string; error?: undefined } | { url?: undefined; error: string }> {
  if (!ALLOWED.has(opts.file.type)) {
    return { error: "Use a JPG, PNG, WebP, or GIF." };
  }
  if (opts.file.size > MAX_BYTES) {
    return { error: "Image must be under 6MB." };
  }

  const ext =
    opts.file.type === "image/png"
      ? "png"
      : opts.file.type === "image/webp"
        ? "webp"
        : opts.file.type === "image/gif"
          ? "gif"
          : "jpg";
  const name = `${randomBytes(8).toString("hex")}.${ext}`;
  const dir = path.join(process.cwd(), "public", "uploads", opts.storeId);
  await mkdir(dir, { recursive: true });
  const buffer = Buffer.from(await opts.file.arrayBuffer());
  await writeFile(path.join(dir, name), buffer);
  return { url: `/uploads/${opts.storeId}/${name}` };
}
