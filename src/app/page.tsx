import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

export default function HomePage() {
  return (
    <main className="home">
      <header className="site-nav">
        <Link href="/" className="nav-logo" aria-label="PaySynk home">
          <BrandLogo variant="white" height={34} priority />
        </Link>
        <nav>
          <Link href="/s/slf">Demo store</Link>
          <a href="#features">Features</a>
          <a href="#pricing">Pricing</a>
          <a href="#embed">Embed</a>
          <Link href="/login" className="nav-cta">
            Sign in
          </Link>
        </nav>
      </header>

      <section className="hero hero-media">
        <div className="hero-media-bg" aria-hidden />
        <div className="hero-inner">
          <BrandLogo variant="white" height={52} className="hero-brand" priority />
          <p className="eyebrow accent-text">A Paradigm Studio product</p>
          <h1>COMMERCE THAT FITS ANY SITE</h1>
          <p className="lede">
            Catalogue, stock, cart, and checkout — hosted or embedded. Each
            merchant gets paid on their own credentials. Stripe today; FAC and
            POS on the same inventory next.
          </p>
          <div className="cta-row">
            <Link className="btn btn-primary" href="/s/slf">
              Explore demo store
            </Link>
            <Link className="btn btn-ghost" href="/login">
              Merchant sign in
            </Link>
          </div>
        </div>
      </section>

      <section className="home-section" id="features">
        <p className="eyebrow accent-text">About PaySynk</p>
        <h2>Sell on your site. Run stock in one place.</h2>
        <p className="section-copy">
          Like Ecwid-style embeddable commerce, built for Paradigm Studio
          merchants — alongside{" "}
          <a href="https://www.smartsynk.net/" target="_blank" rel="noreferrer">
            SmartSynk
          </a>{" "}
          platforms such as SalonSynk.
        </p>

        <div className="feature-grid">
          <article className="feature-card">
            <h3>Hosted storefront</h3>
            <p>Instant shop at /s/your-store — products, variants, cart, checkout.</p>
          </article>
          <article className="feature-card">
            <h3>Embed anywhere</h3>
            <p>Drop a snippet on any website. One catalogue, many surfaces.</p>
          </article>
          <article className="feature-card">
            <h3>Merchant payouts</h3>
            <p>Payment-provider interface with Stripe Checkout; FAC stub ready.</p>
          </article>
          <article className="feature-card">
            <h3>Shared inventory</h3>
            <p>Online now; POS channel designed in so till sales can share stock.</p>
          </article>
        </div>
      </section>

      <section className="home-section stats-band">
        <div className="stat">
          <strong>Multi-store</strong>
          <span>Tenant-ready from day one</span>
        </div>
        <div className="stat">
          <strong>Stripe</strong>
          <span>Hosted Checkout + webhooks</span>
        </div>
        <div className="stat">
          <strong>SLF</strong>
          <span>Live demo catalogue seeded</span>
        </div>
        <div className="stat">
          <strong>Bundle</strong>
          <span>Tee + tote pricing built in</span>
        </div>
      </section>

      <section className="home-section" id="pricing">
        <p className="eyebrow accent-text">Pricing</p>
        <h2>Simple plans. Keep your payouts.</h2>
        <p className="section-copy">
          No PaySynk platform fees on transactions — connect Stripe or PayPal
          and get paid directly. Pick the tier that matches how you sell.
        </p>

        <div className="pricing-grid">
          <article className="pricing-card">
            <p className="pricing-tier">Tier 1</p>
            <h3>PaySynk Standard</h3>
            <p className="pricing-price">
              £19 <span>/ month</span>
            </p>
            <p className="pricing-target">
              For small online shops, boutiques, and barbers/salons adding a
              light online cart.
            </p>
            <ul className="pricing-features">
              <li>Embeddable cart widget for any website (WordPress, Next.js, Webflow, Framer)</li>
              <li>Up to 500 catalog products</li>
              <li>0% PaySynk platform fees</li>
              <li>Direct Stripe / PayPal connection</li>
              <li>Digital receipts via email/SMS</li>
            </ul>
            <Link className="btn btn-ghost btn-block" href="/register">
              Start with Standard
            </Link>
          </article>

          <article className="pricing-card pricing-card-featured">
            <p className="pricing-badge">Most popular</p>
            <p className="pricing-tier">Tier 2</p>
            <h3>PaySynk Retail &amp; POS</h3>
            <p className="pricing-price">
              £39 <span>/ month</span>
            </p>
            <p className="pricing-target">
              For established physical stores, cafes, and multi-channel merchants
              who need the web cart and the counter till.
            </p>
            <ul className="pricing-features">
              <li>Everything in Standard</li>
              <li>PaySynk POS / Till interface (iPad, Android, tablet)</li>
              <li>Real-time inventory sync — in-store sales update online stock</li>
              <li>Unlimited products &amp; unlimited staff accounts</li>
              <li>Multi-location reporting</li>
            </ul>
            <Link className="btn btn-primary btn-block" href="/register">
              Start with Retail &amp; POS
            </Link>
          </article>
        </div>
      </section>

      <section className="home-section" id="embed">
        <p className="eyebrow accent-text">Embed</p>
        <h2>Add a shop to any page</h2>
        <p className="section-copy">
          Mount with <code>data-store</code>. Full in-page widget comes next;
          today the launcher opens the hosted storefront.
        </p>
        <pre className="code-block">{`<div id="paysynk-shop" data-store="slf"></div>
<script src="https://paysynk.com/embed.js" defer></script>`}</pre>
        <p className="muted small">
          Local: <code>/embed.js</code> · Demo: <Link href="/s/slf">/s/slf</Link>
        </p>
      </section>

      <section className="home-cta-band">
        <div>
          <h2>Ready to open a store?</h2>
          <p className="muted">
            Browse the Saturday Love Funk demo, or sign in to manage stock and
            orders.
          </p>
        </div>
        <div className="cta-row">
          <Link className="btn btn-primary" href="/s/slf">
            Open demo
          </Link>
          <Link className="btn btn-ghost" href="/login">
            Sign in
          </Link>
        </div>
      </section>

      <footer className="site-footer">
        <BrandLogo variant="white" height={28} />
        <div className="footer-links">
          <a href="https://www.smartsynk.net/" target="_blank" rel="noreferrer">
            SmartSynk
          </a>
          <span className="muted">Paradigm Studio</span>
          <span className="muted">paysynk.com</span>
        </div>
      </footer>
    </main>
  );
}
