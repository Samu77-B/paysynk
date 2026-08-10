"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    if (!isSupabaseConfigured()) {
      setError("Configure Supabase env vars to register a live merchant.");
      setBusy(false);
      return;
    }

    const supabase = createClient();
    const { error: signError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          store_name: storeName,
        },
      },
    });
    setBusy(false);
    if (signError) {
      setError(signError.message);
      return;
    }
    router.push("/app");
    router.refresh();
  }

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold tracking-tight text-white lg:text-zinc-900">
        Create your store
      </h2>
      <p className="mt-1 text-sm text-zinc-400 lg:text-zinc-600">
        Start on PaySynk Standard (£19/mo). Upgrade to Retail & POS anytime.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Your name</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="bg-white"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="storeName">Store name</Label>
          <Input
            id="storeName"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            required
            className="bg-white"
          />
        </div>
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
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="bg-white"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button
          type="submit"
          disabled={busy}
          className="w-full bg-[#9FE870] text-[#141414] hover:bg-[#8fd960]"
        >
          {busy ? "Creating…" : "Create account"}
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
