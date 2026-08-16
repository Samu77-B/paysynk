import Link from "next/link";
import { auth } from "@/lib/auth";
import { registerMerchant, signOutMerchant } from "@/lib/dashboard/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ERRORS: Record<string, string> = {
  invalid: "Name, store, email, and an 8+ character password are required.",
  exists: "An account with this email already exists. Sign in instead.",
  signin: "Account created, but sign-in failed. Try logging in.",
};

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  const { error } = await searchParams;

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold tracking-tight text-white lg:text-zinc-900">
        Create your store
      </h2>
      <p className="mt-1 text-sm text-zinc-400 lg:text-zinc-600">
        Start on PaySynk Standard (£19/mo). Upgrade to Retail & POS anytime.
      </p>

      {session?.user && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
          <p>
            You are signed in as <strong>{session.user.email}</strong>. Submitting
            this form creates a <em>new</em> client store and switches you into
            that account.
          </p>
          <form action={signOutMerchant} className="mt-2">
            <button type="submit" className="underline">
              Sign out first
            </button>
          </form>
        </div>
      )}

      <form action={registerMerchant} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Your name</Label>
          <Input
            id="fullName"
            name="fullName"
            required
            className="bg-white"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="storeName">Store name</Label>
          <Input
            id="storeName"
            name="storeName"
            required
            className="bg-white"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="bg-white"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="bg-white"
          />
        </div>
        {error && ERRORS[error] && (
          <p className="text-sm text-red-600">{ERRORS[error]}</p>
        )}
        <Button
          type="submit"
          className="w-full bg-[#9FE870] text-[#141414] hover:bg-[#8fd960]"
        >
          Create account
        </Button>
      </form>

      <p className="mt-6 text-sm text-zinc-400 lg:text-zinc-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
