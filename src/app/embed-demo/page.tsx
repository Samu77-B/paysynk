import type { Metadata } from "next";
import Script from "next/script";
import { BrandLogo } from "@/components/BrandLogo";

export const metadata: Metadata = {
  title: "Embed demo · PaySynk",
  description: "Product embeds and shop cart on a host page",
};

/**
 * Host-page simulation: product widgets + shop-wide cart.js,
 * same snippets merchants copy from the dashboard.
 */
export default function EmbedDemoPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(165deg, #fafafa 0%, #f4f4f5 45%, #eef2ff 100%)",
        color: "#18181b",
        fontFamily: "Outfit, system-ui, sans-serif",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "1rem",
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid #e4e4e7",
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(8px)",
        }}
      >
        <a href="/" aria-label="PaySynk home">
          <BrandLogo variant="black" height={28} />
        </a>
        <a
          href="/s/acme"
          style={{ color: "#52525b", fontSize: "0.9rem", textDecoration: "none" }}
        >
          Full Acme Store →
        </a>
      </header>

      <div style={{ maxWidth: 960, margin: "0 auto", padding: "2.5rem 1.5rem 5rem" }}>
        <p
          style={{
            margin: 0,
            fontSize: "0.72rem",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            color: "#65a30d",
            fontWeight: 600,
          }}
        >
          Host page demo
        </p>
        <h1
          style={{
            margin: "0.5rem 0 0.75rem",
            fontFamily: "Syne, system-ui, sans-serif",
            fontSize: "clamp(1.8rem, 4vw, 2.6rem)",
            lineHeight: 1.15,
          }}
        >
          Acme product embeds
        </h1>
        <p style={{ margin: "0 0 2rem", maxWidth: 540, color: "#52525b", lineHeight: 1.55 }}>
          Each card below is a product snippet. The floating cart is this shop’s
          cart.js — add here, checkout from any page.
        </p>

        <div
          style={{
            display: "grid",
            gap: "1.25rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          }}
        >
          <div
            data-paysynk-product="acme-minimalist-heavyweight-hoodie"
            data-store="acme"
          />
          <div
            data-paysynk-product="acme-insulated-steel-water-bottle-750ml"
            data-store="acme"
          />
          <div
            data-paysynk-product="acme-artisan-ceramic-mug-set"
            data-store="acme"
          />
        </div>
      </div>

      <Script src="/embed.js" strategy="afterInteractive" />
      <Script
        src="/cart.js"
        data-store="acme"
        data-merchant-id="11111111-1111-1111-1111-111111111111"
        strategy="afterInteractive"
      />
    </main>
  );
}
