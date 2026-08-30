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
          --paysynk-radius: 0;
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
          Button colour, type, and corners come from{" "}
          <code style={{ fontSize: "0.85em" }}>--paysynk-accent</code>,{" "}
          <code style={{ fontSize: "0.85em" }}>--paysynk-font</code>, and{" "}
          <code style={{ fontSize: "0.85em" }}>--paysynk-radius</code>. A store
          owner sets the same values in Settings — no recopy of the snippet.
        </p>
        <p style={{ margin: "0 0 1.5rem", fontSize: "0.95rem", maxWidth: 540, lineHeight: 1.6 }}>
          310 Green Lanes, London N13 5TT — a few steps from
          the heart of Palmers Green.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", marginBottom: "2rem" }}>
          <button
            type="button"
            style={{
              background: "#c4a37a",
              color: "#1a1612",
              border: 0,
              borderRadius: 0,
              padding: "0.85rem 1.4rem",
              font: "inherit",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Contact us
          </button>
          <button
            type="button"
            style={{
              background: "#fff",
              color: "#1a1612",
              border: "1px solid #1a1612",
              borderRadius: 0,
              padding: "0.85rem 1.4rem",
              font: "inherit",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Book
          </button>
        </div>
        <p style={{ margin: "0 0 2rem", fontSize: "0.9rem" }}>
          <Link href="/embed-demo" style={{ color: "#8a7358" }}>
            Default PaySynk look →
          </Link>
        </p>

        <h2
          style={{
            margin: "0 0 1rem",
            fontSize: "0.75rem",
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: "#8a7358",
          }}
        >
          Featured products
        </h2>
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
            data-paysynk-product="shu-uemura-art-of-hair-ultimate-reset"
            data-store="jojo-flo-london"
          />
          <div
            data-paysynk-product="shu-uemura-art-of-hair-izumi-tonic"
            data-store="jojo-flo-london"
          />
          <div
            data-paysynk-product="k-rastase-premi-re-concentr-d-calcifiant-ultra-r-parateur-45ml"
            data-store="jojo-flo-london"
          />
          <div
            data-paysynk-product="davines-nounou-hair-mask-75ml"
            data-store="jojo-flo-london"
          />
        </div>
      </div>

      <Script src="/embed.js" strategy="afterInteractive" />
      <Script
        src="/cart.js"
        data-store="jojo-flo-london"
        data-merchant-id="cmtbbv1k5000004jzbx1wq1s3"
        strategy="afterInteractive"
      />
    </main>
  );
}
