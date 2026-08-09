import Link from "next/link";

export default function HomePage() {
  return (
    <main className="home">
      <div className="home-glow" aria-hidden />
      <header className="home-nav">
        <span className="logo">PaySynk</span>
        <nav>
          <Link href="/s/slf">Demo store</Link>
          <Link href="/admin">Merchant admin</Link>
          <a href="#embed">Embed</a>
        </nav>
      </header>

      <section className="home-hero">
        <p className="eyebrow">A Paradigm Studio product</p>
        <h1 className="brand-hero">PaySynk</h1>
        <p className="lede">
          Multi-tenant catalogue, cart, and checkout you can host or embed —
          with each store&apos;s payouts on its own payment credentials.
        </p>
        <div className="cta-row">
          <Link className="btn btn-primary" href="/s/slf">
            Open SLF demo store
          </Link>
          <Link className="btn btn-ghost" href="/admin/login">
            Merchant sign in
          </Link>
        </div>
        <p className="muted small">
          Alongside UrNextEvent and Salon Synk from Paradigm Studio.
        </p>
      </section>

      <section className="home-section">
        <h2>What merchants get</h2>
        <p className="muted">
          Products and variants with stock, a cart, Stripe Checkout today, and a
          payment-provider interface ready for FAC / PowerTranz and a future POS
          till on the same inventory.
        </p>
      </section>

      <section className="home-section" id="embed">
        <h2>Embed on any site</h2>
        <p className="muted">
          Drop the snippet below on any page. It mounts the storefront for{" "}
          <code>data-store</code> into the host element (or opens the hosted
          storefront while the full widget matures).
        </p>
        <pre className="code-block">{`<div id="paysynk-shop" data-store="slf"></div>
<script src="https://paysynk.com/embed.js" defer></script>`}</pre>
        <p className="muted small">
          Locally: <code>/embed.js</code> · Hosted testing without embed:{" "}
          <Link href="/s/slf">/s/slf</Link>
        </p>
      </section>

      <footer className="home-footer">
        <span>PaySynk · Paradigm Studio</span>
        <span className="muted">paysynk.com</span>
      </footer>
    </main>
  );
}
