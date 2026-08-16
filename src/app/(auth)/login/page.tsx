import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { loginMerchant } from "@/lib/dashboard/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const session = await auth();
  const { next, error } = await searchParams;
  if (session?.user) {
    redirect(next?.startsWith("/") ? next : "/app");
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold tracking-tight text-white lg:text-zinc-900">
        Sign in
      </h2>
      <p className="mt-1 text-sm text-zinc-400 lg:text-zinc-600">
        Access your PaySynk merchant dashboard.
      </p>

      <form action={loginMerchant} className="mt-6 space-y-4">
        <input
          type="hidden"
          name="next"
          value={next?.startsWith("/") ? next : "/app"}
        />
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="username"
            className="bg-white"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/forgot-password"
              className="text-xs text-[#1f6b4a] hover:underline lg:text-zinc-600"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="bg-white"
          />
        </div>
        {error && (
          <p className="text-sm text-red-600">Invalid email or password.</p>
        )}
        <Button
          type="submit"
          className="w-full bg-[#9FE870] text-[#141414] hover:bg-[#8fd960]"
        >
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-sm text-zinc-400 lg:text-zinc-600">
        New merchant?{" "}
        <Link href="/register" className="font-medium text-[#9FE870] lg:text-zinc-900 lg:underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
