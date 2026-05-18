"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSupabaseClient } from "@/lib/supabase";
import { setSelectedOrgId } from "@/lib/org";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = React.useState("owner@demo.com");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string; detail?: string }
        | null;
      if (!res.ok || !data?.ok) {
        setError(
          data?.error === "supabase_not_configured"
            ? "Supabase isn’t configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local."
            : data?.error === "supabase_auth_failed"
              ? data.detail || "Supabase login failed."
              : "Invalid email or password.",
        );
        return;
      }

      const supabase = getSupabaseClient();
      const session = (data as { session?: { access_token: string; refresh_token: string } | null })
        .session;
      if (supabase && session?.access_token && session?.refresh_token) {
        await supabase.auth.setSession({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
        });

        // If user has no org memberships, make sure we land on the "join/create org" prompt.
        const { data: memberships } = await supabase
          .from("organization_members")
          .select("organization_id")
          .limit(1);
        if (!memberships || memberships.length === 0) {
          setSelectedOrgId("");
        }
      }

      router.replace("/admin/pages");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-96px)] flex items-center justify-center">
      <Card className="auth-card admin-data-card w-full max-w-md border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40">
        <CardHeader>
          <div className="text-lg font-semibold tracking-tight text-heading">Admin Login</div>
          <div className="mt-1 text-sm text-subheading">Sign in to access the admin portal</div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
            <div className="space-y-2">
              <label className="text-xs font-medium text-subheading" htmlFor="email">
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
              <label className="text-xs font-medium text-subheading" htmlFor="password">
                Admin password
              </label>
              <Input
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="current-password"
              />
            </div>

            {error ? (
              <div
                className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                role="alert"
              >
                {error}
              </div>
            ) : null}

            <Button variant="primary" className="w-full" type="submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 space-y-3">
            <div className="text-sm text-subheading">Don’t have an account?</div>
            <Link href="/admin/signup" className="block">
              <Button
                className="admin-auth-secondary-btn w-full rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-100 dark:hover:bg-zinc-900/60"
                variant="secondary"
                type="button"
              >
                Create one
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
