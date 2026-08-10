import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-[#141414] text-zinc-100">
      <div className="relative hidden w-1/2 overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-10">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(700px 400px at 20% 10%, rgba(159,232,112,0.18), transparent 55%), linear-gradient(160deg,#1a1a1a,#101010)",
          }}
        />
        <div className="relative z-10">
          <BrandLogo variant="white" height={36} />
        </div>
        <div className="relative z-10 max-w-md">
          <p className="mb-3 text-xs uppercase tracking-[0.16em] text-[#9FE870]">
            Merchant dashboard
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold leading-tight tracking-tight">
            Run your cart, stock, and payouts in one place.
          </h1>
          <p className="mt-4 text-zinc-400">
            Flat-rate PaySynk plans. Zero platform fees on transactions. Funds
            flow to your Stripe or PayPal account.
          </p>
        </div>
        <p className="relative z-10 text-sm text-zinc-500">
          A Paradigm Studio product · paysynk.com
        </p>
      </div>

      <div className="flex w-full flex-col justify-center px-6 py-10 lg:w-1/2 lg:bg-zinc-50 lg:text-zinc-900">
        <div className="mx-auto mb-8 w-full max-w-md lg:hidden">
          <BrandLogo variant="white" height={32} />
        </div>
        <div className="mx-auto hidden w-full max-w-md lg:block">
          <BrandLogo variant="black" height={36} />
        </div>
        <div className="mx-auto w-full max-w-md">{children}</div>
        <p className="mx-auto mt-8 w-full max-w-md text-center text-sm text-zinc-500 lg:text-zinc-500">
          <Link href="/" className="underline-offset-4 hover:underline">
            ← Back to paysynk.com
          </Link>
        </p>
      </div>
    </div>
  );
}
