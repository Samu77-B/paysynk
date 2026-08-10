"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Code2,
  Settings,
  CreditCard,
  ExternalLink,
  ChevronDown,
  LogOut,
  Store,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { PLAN_META } from "@/lib/dashboard/demo-data";
import type { Merchant } from "@/types/database";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

const NAV = [
  { href: "/app", label: "Overview", icon: LayoutDashboard },
  { href: "/app/products", label: "Products", icon: Package },
  { href: "/app/orders", label: "Orders", icon: ShoppingBag },
  { href: "/app/integration", label: "Integration", icon: Code2 },
  { href: "/app/settings", label: "Settings", icon: Settings },
  { href: "/app/settings/billing", label: "Billing", icon: CreditCard },
];

type Props = {
  merchant: Merchant;
  merchants: Merchant[];
  user: { email: string; name: string };
  mode: "demo" | "supabase";
  children: React.ReactNode;
};

export function DashboardShell({
  merchant,
  merchants,
  user,
  mode,
  children,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const plan = PLAN_META[merchant.plan_tier];

  async function signOut() {
    if (isSupabaseConfigured()) {
      const supabase = createClient();
      await supabase.auth.signOut();
    }
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen bg-zinc-100 text-zinc-900">
      <aside className="flex w-64 shrink-0 flex-col border-r border-zinc-800 bg-[#141414] text-zinc-100">
        <div className="border-b border-zinc-800 px-4 py-4">
          <Link href="/app" className="mb-4 block">
            <BrandLogo variant="white" height={28} />
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-auto w-full justify-between gap-2 rounded-lg border border-zinc-700 bg-zinc-900/60 px-3 py-2 text-left text-zinc-100 hover:bg-zinc-800 hover:text-white"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <Store className="size-4 shrink-0 text-[#9FE870]" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">
                      {merchant.name}
                    </span>
                    <span className="block truncate text-xs text-zinc-400">
                      {plan.name}
                    </span>
                  </span>
                </span>
                <ChevronDown className="size-4 shrink-0 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuLabel>Stores</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {merchants.map((m) => (
                <DropdownMenuItem
                  key={m.id}
                  onClick={() => {
                    document.cookie = `paysynk_merchant=${m.id}; path=/; max-age=31536000`;
                    router.refresh();
                  }}
                >
                  {m.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map((item) => {
            const active =
              item.href === "/app"
                ? pathname === "/app"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-[#9FE870]/15 text-[#9FE870]"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-white",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="space-y-2 border-t border-zinc-800 p-3">
          <Button
            asChild
            variant="outline"
            className="w-full justify-start gap-2 border-zinc-700 bg-transparent text-zinc-200 hover:bg-zinc-900 hover:text-white"
          >
            <Link href={`/s/${merchant.slug}`} target="_blank">
              <ExternalLink className="size-4" />
              View Online Store
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-zinc-900"
              >
                <Avatar className="size-8">
                  <AvatarFallback className="bg-zinc-800 text-xs text-[#9FE870]">
                    {user.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{user.name}</span>
                  <span className="block truncate text-xs text-zinc-500">
                    {user.email}
                  </span>
                </span>
                <ChevronDown className="size-4 text-zinc-500" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/app/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={signOut}>
                <LogOut className="size-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {mode === "demo" && (
            <p className="px-1 text-[11px] leading-snug text-zinc-500">
              Demo mode — add Supabase env vars for live auth & RLS.
            </p>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
