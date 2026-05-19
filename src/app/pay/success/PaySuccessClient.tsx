"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type ReceiptState =
  | { status: "none" }
  | { status: "loading" }
  | { status: "sent"; previewUrl?: string | null }
  | { status: "already_sent" }
  | { status: "failed"; detail?: string };

export function PaySuccessClient() {
  const searchParams = useSearchParams();
  const [syncState, setSyncState] = React.useState<"idle" | "loading" | "ok" | "err">("idle");
  const [syncDetail, setSyncDetail] = React.useState<string | null>(null);
  const [receipt, setReceipt] = React.useState<ReceiptState>({ status: "none" });

  React.useEffect(() => {
    const pi =
      searchParams.get("payment_intent")?.trim() ||
      searchParams.get("pi")?.trim() ||
      "";
    if (!pi) {
      setSyncState("ok");
      return;
    }

    let cancelled = false;
    setSyncState("loading");
    setReceipt({ status: "loading" });

    void (async () => {
      try {
        const res = await fetch("/api/stripe/sync-payment-intent", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ paymentIntentId: pi }),
        });
        const json = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          error?: string;
          receipt?: {
            sent?: boolean;
            alreadySent?: boolean;
            emailPreviewUrl?: string | null;
            error?: string;
          };
        };
        if (cancelled) return;

        if (res.ok && json.ok) {
          setSyncState("ok");
          const r = json.receipt;
          if (r?.sent) {
            if (r.alreadySent) {
              setReceipt({ status: "already_sent" });
            } else {
              setReceipt({ status: "sent", previewUrl: r.emailPreviewUrl });
            }
          } else if (r && r.sent === false) {
            setReceipt({ status: "failed", detail: r.error });
          } else {
            setReceipt({ status: "none" });
          }
        } else {
          const detail = typeof json.error === "string" ? json.error : `HTTP ${res.status}`;
          setSyncState("err");
          setSyncDetail(detail);
          setReceipt({ status: "failed", detail });
        }
      } catch (e) {
        if (!cancelled) {
          const detail = e instanceof Error ? e.message : "sync_failed";
          setSyncState("err");
          setSyncDetail(detail);
          setReceipt({ status: "failed", detail });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return (
    <div className="min-h-full bg-background px-6 py-16 text-foreground">
      <div className="mx-auto w-full max-w-md">
        <Card className="dark:bg-zinc-950/30">
          <CardHeader>
            <div className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Payment successful
            </div>
            <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-300">
              Thanks — you can safely close this tab.
            </div>
            {syncState === "loading" ? (
              <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                Confirming payment and sending your receipt…
              </div>
            ) : null}
            {receipt.status === "sent" ? (
              <div className="mt-2 text-xs text-emerald-800 dark:text-emerald-200 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2">
                A receipt was sent to your email.
                {receipt.previewUrl ? (
                  <>
                    {" "}
                    <a
                      href={receipt.previewUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="underline font-medium"
                    >
                      Preview (dev inbox)
                    </a>
                  </>
                ) : null}
              </div>
            ) : null}
            {receipt.status === "already_sent" ? (
              <div className="mt-2 text-xs text-zinc-600 dark:text-zinc-300">
                Your receipt was already emailed for this payment.
              </div>
            ) : null}
            {receipt.status === "failed" ? (
              <div className="mt-2 text-xs text-amber-800 dark:text-amber-200 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-3 py-2">
                Payment succeeded, but we could not send the receipt email
                {receipt.detail ? ` (${receipt.detail})` : ""}. Contact support if you need a copy.
              </div>
            ) : null}
            {syncState === "err" ? (
              <div className="mt-2 text-xs text-amber-800 dark:text-amber-200 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 px-3 py-2">
                Your payment went through, but we could not update analytics yet
                {syncDetail ? ` (${syncDetail})` : ""}.
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
