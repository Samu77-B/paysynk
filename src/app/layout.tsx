import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PaySynk — embeddable commerce by Paradigm Studio",
  description:
    "Multi-tenant catalogue, cart, and checkout. Hosted or embedded. Stripe today, more providers next.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
