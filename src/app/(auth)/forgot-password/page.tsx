import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold tracking-tight text-white lg:text-zinc-900">
        Reset password
      </h2>
      <p className="mt-2 text-sm text-zinc-400 lg:text-zinc-600">
        Email reset is not wired yet. Sign in if you still know the password, or
        register a new store with a different email.
      </p>
      <p className="mt-6 text-sm">
        <Link href="/login" className="underline">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
