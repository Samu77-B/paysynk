import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Salon embed demo · PaySynk",
  description: "Product widgets and cart matching a host salon theme",
};

/**
 * Host-page simulation: serif + tan brand via CSS variables, the same
 * knobs Settings writes for a real shop (Jojo & Flo style).
 */
export default function SalonEmbedDemoPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f6f1ea",
        color: "#2b2622",
        fontFamily: 'Georgia, "Times New Roman", Times, serif',
      }}
    >
      <style>{`
        :root {
          --paysynk-accent: #c4a37a;
          --paysynk-accent-text: #1a1612;
          --paysynk-font: inherit;
        }
      `}</style>
      <header
        style={{
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid #e4d9cc",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "0.72rem",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
          }}
        >
          Home / Art of Hair / Ultimate Reset
        </p>
      </header>

      <div style={{ maxWidth: 920, margin: "0 auto", padding: "2.5rem 1.5rem 6rem" }}>
        <p style={{ margin: 0, fontSize: "0.75rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "#8a7358" }}>
          Match-the-site demo
        </p>
        <h1
          style={{
            margin: "0.4rem 0 0.75rem",
            fontSize: "clamp(1.6rem, 3.5vw, 2.2rem)",
            fontWeight: 500,
            letterSpacing: "0.02em",
          }}
        >
          Product &amp; cart in this page’s type and colour
        </h1>
        <p style={{ margin: "0 0 1.5rem", maxWidth: 540, lineHeight: 1.6, color: "#5c534b" }}>
          Button colour and type come from{" "}
          <code style={{ fontSize: "0.85em" }}>--paysynk-accent</code> and{" "}
          <code style={{ fontSize: "0.85em" }}>--paysynk-font</code>. A store
          owner sets the same values in Settings — no recopy of the snippet.
        </p>
        <p style={{ margin: "0 0 2rem", fontSize: "0.9rem" }}>
          <Link href="/embed-demo" style={{ color: "#8a7358" }}>
            Default PaySynk look →
          </Link>
        </p>

        <div
          style={{
            display: "grid",
            gap: "1.5rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            background: "#fff",
            padding: "1.5rem",
            boxShadow: "0 12px 40px rgba(80, 60, 40, 0.08)",
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
