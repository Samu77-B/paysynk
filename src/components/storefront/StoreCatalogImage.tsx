"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export function StoreCatalogImage({
  src,
  sizes = "240px",
}: {
  src: string;
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
      alt=""
      fill
      sizes={sizes}
      className={`store-product-img store-catalog-img-anim${
        visible ? " is-visible" : ""
      }`}
      onLoad={() => setVisible(true)}
    />
  );
}
