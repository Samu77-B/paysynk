"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMessage(null);

    if (!isSupabaseConfigured()) {
      setError("Configure Supabase to send reset emails.");
      setBusy(false);
      return;
    }

    const supabase = createClient();
    const origin = window.location.origin;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo: `${origin}/login` },
    );
    setBusy(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setMessage("Check your email for a password reset link.");
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold tracking-tight text-white lg:text-zinc-900">
        Reset password
      </h2>
      <p className="mt-1 text-sm text-zinc-400 lg:text-zinc-600">
        We&apos;ll email you a secure link to choose a new password.
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
        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-emerald-700">{message}</p>}
        <Button
          type="submit"
          disabled={busy}
          className="w-full bg-[#9FE870] text-[#141414] hover:bg-[#8fd960]"
        >
          {busy ? "Sending…" : "Send reset link"}
        </Button>
      </form>

      <p className="mt-6 text-sm">
        <Link href="/login" className="underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
