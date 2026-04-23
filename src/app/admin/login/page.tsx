"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = React.useState("admin@demo.com");
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
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!res.ok || !data?.ok) {
        setError("Invalid password.");
        return;
      }
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
          <div className="text-lg font-semibold text-zinc-900 tracking-tight">
            Admin Login
          </div>
          <div className="mt-1 text-sm text-zinc-500">
            Sign in to access the admin portal
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={onSubmit}>
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

            <div className="text-xs text-zinc-500">
              Dev default password is <span className="font-mono">admin</span> (override with{" "}
              <span className="font-mono">ADMIN_PASSWORD</span>).
            </div>
          </form>

          <div className="mt-5 flex items-center justify-between text-sm">
            <Link className="text-zinc-600 hover:text-zinc-900" href="/admin/pages">
              Continue to pages
            </Link>
            <Link className="text-zinc-600 hover:text-zinc-900" href="/">
              Back to demo
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
