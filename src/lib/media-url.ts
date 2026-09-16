const BLOB_HOST_SUFFIXES = [
  ".public.blob.vercel-storage.com",
  ".blob.vercel-storage.com",
];

const LOCAL_MEDIA_PREFIXES = ["/uploads/", "/products/", "/print/"];

/** Photos must be a local path under `public`, or a Vercel Blob HTTPS URL. */
export function isAllowedMediaUrl(value: string | null | undefined): boolean {
  if (!value) return true;
  const url = value.trim();
  if (!url) return true;
  if (LOCAL_MEDIA_PREFIXES.some((prefix) => url.startsWith(prefix))) {
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
