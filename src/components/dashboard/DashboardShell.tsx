"use client";

import { useState } from "react";
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
  Menu,
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { PLAN_META } from "@/lib/dashboard/demo-data";
import type { Merchant } from "@/types/database";
import { signOutMerchant } from "@/lib/dashboard/auth-actions";

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
  children: React.ReactNode;
};

function SidebarBody({
  merchant,
  merchants,
  user,
  pathname,
  onNavigate,
  onSignOut,
  onSelectMerchant,
}: {
  merchant: Merchant;
  merchants: Merchant[];
  user: { email: string; name: string };
  pathname: string;
  onNavigate?: () => void;
  onSignOut: () => void;
  onSelectMerchant: (id: string) => void;
}) {
  const plan = PLAN_META[merchant.plan_tier];

  return (
    <>
      <div className="border-b border-zinc-800 px-4 py-4">
        <Link href="/app" className="mb-4 block" onClick={onNavigate}>
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
                onClick={() => onSelectMerchant(m.id)}
              >
                {m.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
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
              onClick={onNavigate}
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
          <Link href={`/s/${merchant.slug}`} target="_blank" onClick={onNavigate}>
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
              <Link href="/app/settings" onClick={onNavigate}>
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onSignOut}>
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  );
}

export function DashboardShell({
  merchant,
  merchants,
  user,
  children,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function signOut() {
    await signOutMerchant();
  }

  function selectMerchant(id: string) {
    document.cookie = `paysynk_merchant=${id}; path=/; max-age=31536000`;
    setMobileOpen(false);
    router.refresh();
  }

  const sidebarProps = {
    merchant,
    merchants,
    user,
    pathname,
    onSignOut: signOut,
    onSelectMerchant: selectMerchant,
  };

  return (
    <div className="flex min-h-screen bg-zinc-100 text-zinc-900">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-zinc-800 bg-[#141414] text-zinc-100 lg:flex">
        <SidebarBody {...sidebarProps} />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex min-w-0 items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Open menu">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="flex w-[min(100%,18rem)] flex-col border-zinc-800 bg-[#141414] p-0 text-zinc-100"
              >
                <SheetHeader className="sr-only">
                  <SheetTitle>Dashboard menu</SheetTitle>
                </SheetHeader>
                <SidebarBody
                  {...sidebarProps}
                  onNavigate={() => setMobileOpen(false)}
                />
              </SheetContent>
            </Sheet>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{merchant.name}</p>
              <p className="truncate text-xs text-zinc-500">
                {PLAN_META[merchant.plan_tier].name}
              </p>
            </div>
          </div>
          <BrandLogo variant="black" height={22} />
        </header>

        <main className="flex-1 overflow-x-auto p-4 sm:p-6 md:p-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
