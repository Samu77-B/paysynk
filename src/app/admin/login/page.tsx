import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { auth, signIn } from "@/lib/auth";
import { BrandLogo } from "@/components/BrandLogo";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (session?.user) redirect("/admin");

  const { error } = await searchParams;

  async function loginAction(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: String(formData.get("email") || ""),
        password: String(formData.get("password") || ""),
        redirectTo: "/admin",
      });
    } catch (e) {
      if (e instanceof AuthError) {
        redirect("/admin/login?error=1");
      }
      // Successful sign-in throws a Next.js redirect — rethrow it.
      throw e;
    }
  }

  return (
    <main className="admin-login">
      <div className="admin-login-panel">
        {/* Light panel → black logo v2 */}
        <BrandLogo variant="black" height={40} />
        <p className="eyebrow" style={{ marginTop: "1rem" }}>
          Merchant admin
        </p>
        <h1>Sign in</h1>
        <p className="muted">Manage catalogue, stock, and orders for your store.</p>
        {error && <p className="error">Invalid email or password.</p>}
        <form action={loginAction} className="stack-form">
          <label className="field">
            <span>Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="username"
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </label>
          <button type="submit" className="btn btn-primary btn-block">
            Sign in
          </button>
        </form>
        <p className="muted small">Use the merchant email you registered with.</p>
      </div>
    </main>
  );
}
