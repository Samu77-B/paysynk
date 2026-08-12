import Image from "next/image";

const LOGOS = {
  /** Light logo for dark / image backgrounds */
  white: "/brand/PaySynk-Grey-Logo-3.png",
  /** Light logo, transparent background — for use over photos/hero media */
  "white-transparent": "/brand/PaySynk-Grey-Logo-3-transparent.png",
  black: "/brand/PaySynk-Blk-Logo-2.png",
} as const;

type BrandLogoProps = {
  /** white = over images / dark backgrounds; black = light panels */
  variant: keyof typeof LOGOS;
  className?: string;
  priority?: boolean;
  height?: number;
};

/**
 * PaySynk logo v2.
 * Use `white` on dark / image overlays; `black` on white or light surfaces.
 */
export function BrandLogo({
  variant,
  className = "",
  priority = false,
  height = 36,
}: BrandLogoProps) {
  const width = Math.round(height * 5.2);
  return (
    <Image
      src={LOGOS[variant]}
      alt="PaySynk"
      width={width}
      height={height}
      priority={priority}
      className={`brand-logo brand-logo-${variant} ${className}`.trim()}
      style={{ height, width: "auto" }}
    />
  );
}
