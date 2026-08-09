import { redirect } from "next/navigation";
import { AuthError } from "next-auth";
import { auth, signIn } from "@/lib/auth";

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
        <p className="eyebrow">PaySynk merchant</p>
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
              defaultValue="merchant@slf.test"
              autoComplete="username"
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              name="password"
              type="password"
              required
              defaultValue="password123"
              autoComplete="current-password"
            />
          </label>
          <button type="submit" className="btn btn-primary btn-block">
            Sign in
          </button>
        </form>
        <p className="muted small">
          Seed demo: merchant@slf.test / password123
        </p>
      </div>
    </main>
  );
}
