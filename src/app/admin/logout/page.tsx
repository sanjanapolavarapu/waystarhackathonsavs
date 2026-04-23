"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AdminLogoutPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.replace("/admin/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-96px)] flex items-center justify-center">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur">
        <CardHeader>
          <div className="text-lg font-semibold tracking-tight text-zinc-900">Sign out</div>
          <div className="mt-1 text-sm text-zinc-500">End your admin session.</div>
        </CardHeader>
        <CardContent>
          <Button variant="secondary" className="w-full" onClick={logout} disabled={loading}>
            {loading ? "Signing out…" : "Sign out"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

