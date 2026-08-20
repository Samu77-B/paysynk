const BLOB_HOST_SUFFIXES = [
  ".public.blob.vercel-storage.com",
  ".blob.vercel-storage.com",
];

/** Uploaded photos must be local `/uploads/...` or a Vercel Blob HTTPS URL. */
export function isAllowedMediaUrl(value: string | null | undefined): boolean {
  if (!value) return true;
  const url = value.trim();
  if (!url) return true;
  if (url.startsWith("/uploads/")) {
    return !url.includes("..") && !url.includes("\\");
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:") return false;
    return BLOB_HOST_SUFFIXES.some((suffix) => parsed.hostname.endsWith(suffix));
  } catch {
    return false;
  }
}

export function sanitizeMediaUrl(value: string | null | undefined): string | null {
  const url = value?.trim() || null;
  if (!url || !isAllowedMediaUrl(url)) return null;
  return url;
}
