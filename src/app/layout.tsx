import type { Metadata } from "next";
import { Outfit, Syne, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PaySynk — embeddable commerce by Paradigm Studio",
  description:
    "Multi-tenant catalogue, cart, and checkout. Hosted or embedded. Stripe today, more providers next.",
  icons: {
    icon: "/brand/PaySynk-Wht-Logo-2.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={cn("h-full", outfit.variable, syne.variable, "font-sans", geist.variable)}>
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
