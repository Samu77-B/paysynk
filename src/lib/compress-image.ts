/** Shrink a product photo in the browser so uploads stay under Vercel’s 4.5MB limit.
 *  JPEG is flattened onto white. PNG/WebP keep a transparent background.
 */
export async function compressProductImage(file: File): Promise<File> {
  if (typeof createImageBitmap !== "function") return file;
  if (file.type === "image/gif" || file.name.toLowerCase().endsWith(".gif")) {
    return file;
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("Could not read that image. Use a JPG, PNG, or WebP.");
  }

  const keepAlpha = wantsTransparentOutput(file);
  const max = 1600;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  if (!keepAlpha) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const mime = keepAlpha ? "image/png" : "image/jpeg";
  const quality = keepAlpha ? undefined : 0.84;
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mime, quality),
  );
  if (!blob) return file;

  const base = file.name.replace(/\.[^.]+$/, "") || "photo";
  const ext = keepAlpha ? "png" : "jpg";
  return new File([blob], `${base}.${ext}`, { type: mime });
}

function wantsTransparentOutput(file: File) {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return (
    type === "image/png" ||
    type === "image/webp" ||
    name.endsWith(".png") ||
    name.endsWith(".webp")
  );
}
