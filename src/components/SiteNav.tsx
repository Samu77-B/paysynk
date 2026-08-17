"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

const LINKS = [
  { href: "/s/slf", label: "Demo store" },
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "#embed", label: "Embed" },
] as const;

export function SiteNav() {
  const [open, setOpen] = useState(false);

  function close() {
    setOpen(false);
  }

  return (
    <header className="site-nav">
      <Link href="/" className="nav-logo" aria-label="PaySynk home" onClick={close}>
        <BrandLogo variant="white" height={34} priority />
      </Link>

      <nav className="site-nav-desktop" aria-label="Primary">
        {LINKS.map((link) =>
          link.href.startsWith("#") ? (
            <a key={link.href} href={link.href}>
              {link.label}
            </a>
          ) : (
            <Link key={link.href} href={link.href}>
              {link.label}
            </Link>
          ),
        )}
        <Link href="/login">
          Sign in
        </Link>
        <Link href="/register" className="nav-cta">
          Create store
        </Link>
      </nav>

      <button
        type="button"
        className="site-nav-toggle"
        aria-expanded={open}
        aria-controls="site-nav-mobile"
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {open && (
        <nav id="site-nav-mobile" className="site-nav-mobile" aria-label="Mobile">
          {LINKS.map((link) =>
            link.href.startsWith("#") ? (
              <a key={link.href} href={link.href} onClick={close}>
                {link.label}
              </a>
            ) : (
              <Link key={link.href} href={link.href} onClick={close}>
                {link.label}
              </Link>
            ),
          )}
          <Link href="/login" onClick={close}>
            Sign in
          </Link>
          <Link href="/register" className="nav-cta" onClick={close}>
            Create store
          </Link>
        </nav>
      )}
    </header>
  );
}
