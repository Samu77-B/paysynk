import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getDashboardContext } from "@/lib/dashboard/data";
import { isSupabaseConfigured } from "@/lib/supabase/client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const preferred = cookieStore.get("paysynk_merchant")?.value;

  try {
    const ctx = await getDashboardContext(preferred);
    return (
      <DashboardShell
        merchant={ctx.merchant}
        merchants={ctx.merchants}
        user={ctx.user}
        mode={ctx.mode}
      >
        {children}
      </DashboardShell>
    );
  } catch (e) {
    if (e instanceof Error && e.message === "UNAUTHENTICATED") {
      redirect("/login");
    }
    if (e instanceof Error && e.message === "NO_MERCHANT") {
      redirect("/register");
    }
    if (!isSupabaseConfigured()) {
      redirect("/login");
    }
    throw e;
  }
}
