 "use client";

import Link from "next/link";
import * as React from "react";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function PaySuccessPage() {
  const searchParams = useSearchParams();
  const pi = searchParams.get("pi");

  type PaymentIntentDetails = {
    paymentIntent: {
      id: string;
      status: string;
      amount: number;
      amount_received: number | null;
      currency: string;
      created: number;
      receipt_email: string | null;
      payment_method_types: string[] | null;
    };
  };

  const [details, setDetails] = React.useState<{
    paymentIntent: {
      id: string;
      status: string;
      amount: number;
      amount_received: number | null;
      currency: string;
      created: number;
      receipt_email: string | null;
      payment_method_types: string[] | null;
    };
  } | null>(null);
  const [detailError, setDetailError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!pi) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/stripe/payment-intent?pi=${encodeURIComponent(pi)}`);
        const json = (await res.json().catch(() => null)) as
          | PaymentIntentDetails
          | { error?: string }
          | null;
        if (!res.ok) throw new Error((json && "error" in json && json.error) || `HTTP ${res.status}`);
        if (cancelled) return;
        if (!json || !("paymentIntent" in json)) throw new Error("Invalid payment details response");
        setDetails(json);
        setDetailError(null);
      } catch (e) {
        if (cancelled) return;
        setDetails(null);
        setDetailError(e instanceof Error ? e.message : "Failed to load payment details");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pi]);

  const money = (cents?: number | null, currency?: string | null) => {
    if (cents == null || !currency) return null;
    return (cents / 100).toLocaleString(undefined, { style: "currency", currency: currency.toUpperCase() });
  };

  return (
    <div className="min-h-screen bg-[#fbfbff] px-6 py-16">
      <div className="mx-auto w-full max-w-md">
        <Card className="bg-white/80 backdrop-blur">
          <CardHeader>
            <div className="text-xl font-semibold tracking-tight text-zinc-900">
              Payment successful
            </div>
            <div className="mt-1 text-sm text-zinc-500">
              Thanks — you can safely close this tab.
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {pi ? (
              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700">
                <div className="text-xs font-medium text-zinc-500">Transaction details</div>
                {detailError ? (
                  <div className="mt-1 text-xs text-amber-700">{detailError}</div>
                ) : details?.paymentIntent ? (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-zinc-500">Amount</span>
                      <span className="font-semibold">
                        {money(details.paymentIntent.amount_received ?? details.paymentIntent.amount, details.paymentIntent.currency) ?? "—"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-zinc-500">Status</span>
                      <span className="font-mono text-xs">{details.paymentIntent.status}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-zinc-500">Payment ID</span>
                      <span className="font-mono text-[11px] truncate max-w-[220px]">{details.paymentIntent.id}</span>
                    </div>
                    {details.paymentIntent.receipt_email ? (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-zinc-500">Receipt email</span>
                        <span className="text-xs">{details.paymentIntent.receipt_email}</span>
                      </div>
                    ) : null}
                    {Array.isArray(details.paymentIntent.payment_method_types) && details.paymentIntent.payment_method_types.length ? (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs text-zinc-500">Method</span>
                        <span className="text-xs">{details.paymentIntent.payment_method_types.join(", ")}</span>
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-1 text-xs text-zinc-500">Loading…</div>
                )}
              </div>
            ) : null}
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

