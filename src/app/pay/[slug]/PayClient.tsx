"use client";

import * as React from "react";

import PaymentWrapper from "@/components/PaymentWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Field = {
  id: string;
  label: string;
  required: boolean;
  placeholder?: string | null;
  helperText?: string | null;
  order: number;
};

type AmountMode = "FIXED" | "RANGE" | "USER_ENTERED";

export function PayClient({
  pageSlug,
  pageTitle,
  amountMode,
  fixedAmountCents,
  minAmountCents,
  maxAmountCents,
  fields,
}: {
  pageSlug: string;
  pageTitle: string;
  amountMode: AmountMode;
  fixedAmountCents?: number | null;
  minAmountCents?: number | null;
  maxAmountCents?: number | null;
  fields: Field[];
}) {
  const [payerEmail, setPayerEmail] = React.useState("");
  const [amountInput, setAmountInput] = React.useState<string>(() => {
    if (amountMode === "FIXED") return String((fixedAmountCents ?? 0) / 100);
    if (amountMode === "RANGE") return String(((minAmountCents ?? 0) / 100).toFixed(2));
    return "";
  });

  const [isStarting, setIsStarting] = React.useState(false);
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [startError, setStartError] = React.useState<string | null>(null);

  const minDollars = (minAmountCents ?? 0) / 100;
  const maxDollars = (maxAmountCents ?? 0) / 100;

  const resolvedAmountCents = React.useMemo(() => {
    if (amountMode === "FIXED") return fixedAmountCents ?? 0;
    const n = Number(amountInput);
    if (!Number.isFinite(n)) return 0;
    const cents = Math.round(n * 100);
    if (amountMode === "RANGE") {
      const min = minAmountCents ?? 0;
      const max = maxAmountCents ?? 0;
      return Math.min(Math.max(cents, min), max);
    }
    return cents;
  }, [amountInput, amountMode, fixedAmountCents, minAmountCents, maxAmountCents]);

  async function startPayment() {
    setStartError(null);

    if (!payerEmail.trim()) {
      setStartError("Please enter your email.");
      return;
    }

    if (!Number.isFinite(resolvedAmountCents) || resolvedAmountCents <= 0) {
      setStartError("Please enter a valid amount.");
      return;
    }

    setIsStarting(true);
    try {
      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          pageSlug,
          amount: resolvedAmountCents,
          payerEmail: payerEmail.trim(),
        }),
      });

      const json = (await res.json()) as
        | { clientSecret: string; paymentIntentId: string }
        | { error: string };

      if (!res.ok || "error" in json) {
        setStartError("Unable to initialize payment. Please try again.");
        return;
      }

      setClientSecret(json.clientSecret);
    } catch {
      setStartError("Unable to initialize payment. Please try again.");
    } finally {
      setIsStarting(false);
    }
  }

  if (clientSecret) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700">
          Paying for <span className="font-semibold">{pageTitle}</span>
        </div>
        <PaymentWrapper
          clientSecret={clientSecret}
          returnUrl={`${window.location.origin}/pay/success`}
        />
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void startPayment();
      }}
    >
      <div className="space-y-2">
        <label className="text-xs font-medium text-zinc-600" htmlFor="payer_email">
          Email <span className="text-red-600">*</span>
        </label>
        <Input
          id="payer_email"
          placeholder="you@company.com"
          inputMode="email"
          value={payerEmail}
          onChange={(e) => setPayerEmail(e.target.value)}
          required
        />
        <div className="text-xs text-zinc-500">Receipt will be sent to this email.</div>
      </div>

      {amountMode === "USER_ENTERED" || amountMode === "RANGE" ? (
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-600" htmlFor="amount">
            Amount (USD) <span className="text-red-600">*</span>
          </label>
          <Input
            id="amount"
            placeholder="0.00"
            inputMode="decimal"
            value={amountInput}
            onChange={(e) => setAmountInput(e.target.value)}
            required
          />
          {amountMode === "RANGE" ? (
            <div className="text-xs text-zinc-500">
              Min ${minDollars.toFixed(2)} · Max ${maxDollars.toFixed(2)}
            </div>
          ) : null}
        </div>
      ) : null}

      {fields
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((f) => (
          <div key={f.id} className="space-y-2">
            <label className="text-xs font-medium text-zinc-600" htmlFor={f.id}>
              {f.label} {f.required ? <span className="text-red-600">*</span> : null}
            </label>
            <Input
              id={f.id}
              placeholder={f.placeholder || ""}
              aria-required={f.required}
              required={f.required}
            />
            {f.helperText ? <div className="text-xs text-zinc-500">{f.helperText}</div> : null}
          </div>
        ))}

      <Button variant="primary" className="w-full" type="submit" disabled={isStarting}>
        {isStarting ? "Starting…" : "Continue to payment"}
      </Button>

      {startError ? (
        <div
          className="text-red-600 text-sm mt-2 font-medium bg-red-50 p-3 rounded-md border border-red-200"
          role="alert"
        >
          {startError}
        </div>
      ) : null}
    </form>
  );
}

