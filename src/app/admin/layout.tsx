import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { BrandLogo } from "@/components/BrandLogo";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <div className="admin-shell">
      <header className="admin-top">
        <div className="admin-brand">
          <Link href="/admin" aria-label="PaySynk admin">
            <BrandLogo variant="white" height={30} />
          </Link>
          {session?.user?.storeSlug && (
            <span className="muted small">
              store/{session.user.storeSlug}
            </span>
          )}
        </div>
        <nav className="admin-nav">
          {session?.user ? (
            <>
              <Link href="/admin">Dashboard</Link>
              <Link href="/admin/products">Products</Link>
              <Link href="/admin/orders">Orders</Link>
              <Link href="/admin/settings">Settings</Link>
              <Link href={`/s/${session.user.storeSlug}`}>View storefront</Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/admin/login" });
                }}
              >
                <button type="submit" className="linkish">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link href="/admin/login">Sign in</Link>
          )}
        </nav>
      </header>
      <div className="admin-main">{children}</div>
    </div>
  );
}
