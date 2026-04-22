import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import type { FormEvent } from "react";
import { supabase } from "@/lib/supabase/browser-client.ts";

export const Route = createFileRoute("/auth/login")({ component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<
    { kind: "error" | "info"; text: string } | undefined
  >();
  const [pending, setPending] = useState(false);

  async function handleSignIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(undefined);
    setPending(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setPending(false);
    if (error) {
      setMessage({ kind: "error", text: error.message });
      return;
    }
    await navigate({ to: "/" });
  }

  async function handleSignUp() {
    setMessage(undefined);
    setPending(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setPending(false);
    if (error) {
      setMessage({ kind: "error", text: error.message });
      return;
    }
    setMessage({
      kind: "info",
      text: "Check your email to verify your account, then sign in.",
    });
  }

  async function handleMagicLink() {
    if (email.length === 0) {
      setMessage({ kind: "error", text: "Enter your email first." });
      return;
    }
    setMessage(undefined);
    setPending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/api/v1/auth/callback` },
    });
    setPending(false);
    if (error) {
      setMessage({ kind: "error", text: error.message });
      return;
    }
    setMessage({ kind: "info", text: "Magic link sent — check your email." });
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-md space-y-6 p-8">
        <div>
          <Link to="/" className="text-sm text-slate-500 hover:text-slate-900">
            ← Back home
          </Link>
        </div>
        <div>
          <h1 className="text-3xl font-bold">Sign in</h1>
          <p className="mt-1 text-slate-600">
            Use email + password, or get a magic link.
          </p>
        </div>
        <form onSubmit={handleSignIn} className="space-y-3">
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-slate-900 focus:outline-none"
              autoComplete="email"
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="mt-1 w-full rounded border border-slate-300 px-3 py-2 focus:border-slate-900 focus:outline-none"
              autoComplete="current-password"
            />
          </label>
          {message && (
            <p
              className={
                message.kind === "error"
                  ? "text-sm text-rose-600"
                  : "text-sm text-emerald-700"
              }
            >
              {message.text}
            </p>
          )}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded bg-slate-900 px-4 py-2 text-white hover:bg-slate-800 disabled:opacity-50"
          >
            Sign in
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSignUp}
              disabled={pending}
              className="flex-1 rounded border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-100 disabled:opacity-50"
            >
              Sign up
            </button>
            <button
              type="button"
              onClick={handleMagicLink}
              disabled={pending || email.length === 0}
              className="flex-1 rounded border border-slate-300 bg-white px-4 py-2 text-sm hover:bg-slate-100 disabled:opacity-50"
            >
              Magic link
            </button>
          </div>
        </form>
        <p className="text-xs text-slate-500">
          Set <code className="rounded bg-slate-100 px-1">VITE_SUPABASE_URL</code> and{" "}
          <code className="rounded bg-slate-100 px-1">VITE_SUPABASE_ANON_KEY</code> in{" "}
          <code className="rounded bg-slate-100 px-1">.env</code> before trying this.
        </p>
      </main>
    </div>
  );
}
