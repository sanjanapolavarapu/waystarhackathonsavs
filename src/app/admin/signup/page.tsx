"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSupabaseClient } from "@/lib/supabase";
import { setSelectedOrgId } from "@/lib/org";

export default function AdminSignupPage() {
  const router = useRouter();

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [note, setNote] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNote(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string; detail?: string; note?: string; session?: { access_token: string; refresh_token: string } | null }
        | null;

      if (!res.ok || !data?.ok) {
        setError(
          data?.error === "supabase_not_configured"
            ? "Supabase isn’t configured yet."
            : data?.detail || "Couldn’t create account.",
        );
        return;
      }

      if (data.note) setNote(data.note);

      const supabase = getSupabaseClient();
      const session = data.session;
      if (supabase && session?.access_token && session?.refresh_token) {
        await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });
      }

      // new users start with no org selected
      setSelectedOrgId("");
      router.replace("/admin/pages");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-96px)] flex items-center justify-center">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur">
        <CardHeader>
          <div className="text-lg font-semibold text-zinc-900 tracking-tight">Create account</div>
          <div className="mt-1 text-sm text-zinc-500">
            Sign up to access the admin portal.
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-600" htmlFor="name">
                Name
              </label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-600" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                inputMode="email"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-600" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="new-password"
              />
            </div>

            {error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
                {error}
              </div>
            ) : null}
            {note ? (
              <div className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700">
                {note}
              </div>
            ) : null}

            <Button variant="primary" className="w-full" type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create account"}
            </Button>
          </form>

          <div className="mt-5 text-sm text-zinc-600">
            Already have an account?{" "}
            <Link className="font-medium text-zinc-900 hover:underline underline-offset-4" href="/admin/login">
              Sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

