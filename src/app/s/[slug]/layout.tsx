import type { CSSProperties } from "react";
import {
  storefrontCssVars,
  storefrontPageClassName,
} from "@/lib/embed-brand";
import { findStoreByPublicSlug } from "@/lib/store-lookup";

export default async function StorePublicLayout({
  children,
  params,
}: LayoutProps<"/s/[slug]">) {
  const { slug } = await params;
  const store = await findStoreByPublicSlug(slug);

  if (!store) return children;

  return (
    <div
      className={storefrontPageClassName(store)}
      style={storefrontCssVars(store) as CSSProperties}
    >
      {children}
    </div>
  );
}
