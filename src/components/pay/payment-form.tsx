"use client";

import * as React from "react";
import { ShieldCheck } from "lucide-react";

import type { PaymentPage } from "@/lib/qpp-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function fmtMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

type PaymentFormProps = {
  page: PaymentPage;
};

export function PaymentForm({ page }: PaymentFormProps) {
  const [payerName, setPayerName] = React.useState("");
  const [payerEmail, setPayerEmail] = React.useState("");
  const [amount, setAmount] = React.useState(() =>
    page.amountMode === "FIXED" ? String((page.fixedAmountCents ?? 0) / 100) : "",
  );
  const [customResponses, setCustomResponses] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitState, setSubmitState] = React.useState<{
    ok: boolean;
    message: string;
    previewUrl?: string | null;
  } | null>(null);

  const amountText =
    page.amountMode === "FIXED"
      ? fmtMoney(page.fixedAmountCents ?? 0)
      : page.amountMode === "RANGE"
        ? `${fmtMoney(page.minAmountCents ?? 0)}–${fmtMoney(page.maxAmountCents ?? 0)}`
        : "Enter amount";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitState(null);

    const amountNumber = Number(amount);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0) {
      setSubmitState({ ok: false, message: "Enter a valid payment amount." });
      return;
    }
    if (
      page.amountMode === "RANGE" &&
      ((page.minAmountCents && amountNumber * 100 < page.minAmountCents) ||
        (page.maxAmountCents && amountNumber * 100 > page.maxAmountCents))
    ) {
      setSubmitState({ ok: false, message: "Amount is outside the allowed range." });
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/payments/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageSlug: page.slug,
          amount: amountNumber,
          payerName,
          payerEmail,
          paymentMethod: "card",
          customResponses,
        }),
      });

      const json = (await res.json()) as
        | { ok: true; transactionId: string; emailPreviewUrl?: string | null }
        | { ok: false; error?: string };
      if (!res.ok || !json.ok) {
        setSubmitState({ ok: false, message: "Payment was saved, but confirmation failed." });
        return;
      }

      setSubmitState({
        ok: true,
        message: `Payment successful. Transaction ${json.transactionId}.`,
        previewUrl: json.emailPreviewUrl,
      });
    } catch {
      setSubmitState({ ok: false, message: "Could not submit payment. Try again." });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <div className="bg-zinc-50 px-6 py-5 border-b border-zinc-200">
        <div className="text-xs font-medium text-zinc-500 text-center">Payment Amount</div>
        <div className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900 text-center">
          {amountText}
        </div>
      </div>
      <div className="p-6 space-y-4">
        {page.headerMessage ? (
          <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700">
            {page.headerMessage}
          </div>
        ) : null}

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-600" htmlFor="payer_name">
              Payer Name <span className="text-red-600">*</span>
            </label>
            <Input
              id="payer_name"
              required
              value={payerName}
              onChange={(e) => setPayerName(e.target.value)}
              placeholder="Full name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-600" htmlFor="payer_email">
              Payer Email <span className="text-red-600">*</span>
            </label>
            <Input
              id="payer_email"
              type="email"
              required
              value={payerEmail}
              onChange={(e) => setPayerEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          {page.amountMode !== "FIXED" ? (
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-600" htmlFor="amount">
                Amount (USD) <span className="text-red-600">*</span>
              </label>
              <Input
                id="amount"
                required
                type="number"
                step="0.01"
                min={page.minAmountCents ? page.minAmountCents / 100 : 0.01}
                max={page.maxAmountCents ? page.maxAmountCents / 100 : undefined}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
          ) : null}

          {page.fields
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
                  required={f.required}
                  type={f.type === "DATE" ? "date" : "text"}
                  value={customResponses[f.label] ?? ""}
                  onChange={(e) =>
                    setCustomResponses((prev) => ({
                      ...prev,
                      [f.label]: e.target.value,
                    }))
                  }
                />
                {f.helperText ? <div className="text-xs text-zinc-500">{f.helperText}</div> : null}
              </div>
            ))}

          <div className="space-y-2">
            <div className="text-xs font-medium text-zinc-600">Card Information</div>
            <Input placeholder="1234 5678 9012 3456" inputMode="numeric" />
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="MM / YY" inputMode="numeric" />
              <Input placeholder="CVC" inputMode="numeric" />
            </div>
            <Input placeholder="Billing ZIP" inputMode="numeric" />
          </div>

          <Button variant="primary" className="w-full" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : "Complete Payment"}
          </Button>
          <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
            <ShieldCheck className="h-4 w-4" />
            Secure, encrypted checkout
          </div>
          {submitState ? (
            <div className={submitState.ok ? "text-xs text-green-700" : "text-xs text-red-700"}>
              {submitState.message}{" "}
              {submitState.previewUrl ? (
                <a
                  href={submitState.previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4"
                >
                  View email preview
                </a>
              ) : null}
            </div>
          ) : null}
        </form>

        {page.footerMessage ? (
          <div className="pt-2 text-xs text-zinc-500 text-center">{page.footerMessage}</div>
        ) : null}
      </div>
    </>
  );
}
