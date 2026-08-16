import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { getDashboardContext } from "@/lib/dashboard/data";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const ctx = await getDashboardContext();
    return (
      <DashboardShell
        merchant={ctx.merchant}
        merchants={ctx.merchants}
        user={ctx.user}
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
    throw e;
  }
}
