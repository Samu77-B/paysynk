import Image from "next/image";

export function StoreBrand({
  name,
  logoUrl,
  compact = false,
}: {
  name: string;
  logoUrl?: string | null;
  compact?: boolean;
}) {
  const height = compact ? 40 : 72;
  return (
    <div className={compact ? "store-brand store-brand-compact" : "store-brand"}>
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={name}
          width={compact ? 180 : 280}
          height={height}
          unoptimized={logoUrl.startsWith("http")}
          className="store-logo"
          priority={!compact}
        />
      ) : (
        <p className="store-brand-name">{name}</p>
      )}
    </div>
  );
}
