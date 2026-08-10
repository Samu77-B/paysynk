"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/app";
  const [email, setEmail] = useState("merchant@slf.test");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      // Demo unlock — middleware allows /app without session when no Supabase
      router.push(next);
      return;
    }

    const supabase = createClient();
    const { error: signError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setBusy(false);
    if (signError) {
      setError(signError.message);
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold tracking-tight text-white lg:text-zinc-900">
        Sign in
      </h2>
      <p className="mt-1 text-sm text-zinc-400 lg:text-zinc-600">
        Access your PaySynk merchant dashboard.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
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
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-white"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button
          type="submit"
          disabled={busy}
          className="w-full bg-[#9FE870] text-[#141414] hover:bg-[#8fd960]"
        >
          {busy ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-sm text-zinc-400 lg:text-zinc-600">
        New merchant?{" "}
        <Link href="/register" className="font-medium text-[#9FE870] lg:text-zinc-900 lg:underline">
          Create an account
        </Link>
      </p>
      {!isSupabaseConfigured() && (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          Supabase is not configured — continue enters demo dashboard mode.
        </p>
      )}
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
