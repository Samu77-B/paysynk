/** Allow only same-origin relative paths. Blocks protocol-relative (`//evil`) redirects. */
export function safeInternalPath(value: unknown, fallback = "/app"): string {
  if (typeof value !== "string") return fallback;
  const path = value.trim();
  if (!path.startsWith("/")) return fallback;
  if (path.startsWith("//") || path.startsWith("/\\")) return fallback;
  if (path.includes("\\") || path.includes("://")) return fallback;
  return path;
}
