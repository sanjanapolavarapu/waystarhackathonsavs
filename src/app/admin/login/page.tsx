"use client";

import * as React from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function AdminLoginPage() {
  const [email, setEmail] = React.useState("admin@demo.com");
  const [password, setPassword] = React.useState("••••••••");

  return (
    <div className="min-h-[calc(100vh-96px)] flex items-center justify-center">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur">
        <CardHeader>
          <div className="text-lg font-semibold text-zinc-900 tracking-tight">
            Admin Login
          </div>
          <div className="mt-1 text-sm text-zinc-500">
            UI-only screen — wire to auth API later
          </div>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
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
                autoComplete="current-password"
              />
            </div>

            <Button variant="primary" className="w-full" type="submit">
              Sign in
            </Button>

            <div className="text-xs text-zinc-500">
              Tip for teammates: replace this form submit with a call to{" "}
              <span className="font-mono">POST /api/auth/login</span> and set a session cookie.
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
