"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function PaySuccessClient() {
  const searchParams = useSearchParams();
  const [syncState, setSyncState] = React.useState<"idle" | "loading" | "ok" | "err">("idle");
  const [syncDetail, setSyncDetail] = React.useState<string | null>(null);

  React.useEffect(() => {
    const pi = searchParams.get("payment_intent");
    if (!pi) {
      setSyncState("ok");
      return;
    }
    let cancelled = false;
    setSyncState("loading");
    void (async () => {
      try {
        const res = await fetch("/api/stripe/sync-payment-intent", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ paymentIntentId: pi }),
        });
        const json = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
        if (cancelled) return;
        if (res.ok && json.ok) {
          setSyncState("ok");
        } else {
          setSyncState("err");
          setSyncDetail(typeof json.error === "string" ? json.error : `HTTP ${res.status}`);
        }
      } catch (e) {
        if (!cancelled) {
          setSyncState("err");
          setSyncDetail(e instanceof Error ? e.message : "sync_failed");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[#fbfbff] px-6 py-16">
      <div className="mx-auto w-full max-w-md">
        <Card>
          <CardHeader>
            <div className="text-xl font-semibold tracking-tight text-zinc-900">Payment successful</div>
            <div className="mt-1 text-sm text-zinc-500">
              Thanks — you can safely close this tab.
            </div>
            {syncState === "loading" ? (
              <div className="mt-2 text-xs text-zinc-500">Updating your receipt in our records…</div>
            ) : null}
            {syncState === "err" ? (
              <div className="mt-2 text-xs text-amber-800 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
                Your payment went through, but we could not update analytics yet
                {syncDetail ? ` (${syncDetail})` : ""}. If reports look empty, confirm{" "}
                <span className="font-mono">SUPABASE_SERVICE_ROLE_KEY</span> is set and try again.
              </div>
            ) : null}
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link href="/">
              <Button variant="primary" className="w-full">
                Back to dashboard
              </Button>
            </Link>
            <Link href="/admin/reports">
              <Button variant="secondary" className="w-full">
                View reports
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
