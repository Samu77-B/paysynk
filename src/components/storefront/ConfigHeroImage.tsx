"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

/** Fades in when the src changes so option picks feel responsive without a hard swap. */
export function ConfigHeroImage({
  src,
  alt,
  className,
  style,
  priority,
  sizes,
}: {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  priority?: boolean;
  sizes?: string;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    let cancelled = false;
    const probe = new window.Image();
    probe.src = src;
    const show = () => {
      if (!cancelled) setVisible(true);
    };
    if (probe.complete) show();
    else probe.onload = show;
    return () => {
      cancelled = true;
      probe.onload = null;
    };
  }, [src]);

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      className={`${className ?? ""} config-hero-layer config-hero-layer-anim${
        visible ? " is-visible" : ""
      }`}
      style={style}
      onLoad={() => setVisible(true)}
      onError={() => setVisible(true)}
    />
  );
}
