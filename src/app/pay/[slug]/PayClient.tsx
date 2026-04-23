"use client";

import * as React from "react";

import PaymentWrapper from "@/components/PaymentWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { CustomField } from "@/lib/qpp-types";

type AmountMode = "FIXED" | "RANGE" | "USER_ENTERED";

const selectClassName =
  "h-11 w-full appearance-none rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500";

function fieldSignature(fields: CustomField[]) {
  return fields
    .map((f) => `${f.id}:${f.type}:${f.order}:${f.required ? 1 : 0}`)
    .sort()
    .join("|");
}

export function PayClient({
  pageSlug,
  pageTitle,
  amountMode,
  fixedAmountCents,
  minAmountCents,
  maxAmountCents,
  fields,
  onFormStarted,
}: {
  pageSlug: string;
  pageTitle: string;
  amountMode: AmountMode;
  fixedAmountCents?: number | null;
  minAmountCents?: number | null;
  maxAmountCents?: number | null;
  fields: CustomField[];
  onFormStarted?: () => void;
}) {
  const sortedFields = React.useMemo(
    () => [...fields].sort((a, b) => a.order - b.order),
    [fields],
  );

  const [payerEmail, setPayerEmail] = React.useState("");
  const [amountInput, setAmountInput] = React.useState<string>(() => {
    if (amountMode === "FIXED") return String((fixedAmountCents ?? 0) / 100);
    if (amountMode === "RANGE") return String(((minAmountCents ?? 0) / 100).toFixed(2));
    return "";
  });

  const [fieldValues, setFieldValues] = React.useState<Record<string, string>>({});
  const fieldsKey = React.useMemo(() => fieldSignature(sortedFields), [sortedFields]);

  React.useEffect(() => {
    queueMicrotask(() => {
      setFieldValues((prev) => {
        const next: Record<string, string> = {};
        for (const f of sortedFields) {
          if (f.type === "CHECKBOX") {
            next[f.id] = prev[f.id] === "true" ? "true" : "false";
          } else {
            next[f.id] = prev[f.id] ?? "";
          }
        }
        return next;
      });
    });
  }, [fieldsKey, pageSlug, sortedFields]);

  const [isStarting, setIsStarting] = React.useState(false);
  const [clientSecret, setClientSecret] = React.useState<string | null>(null);
  const [startError, setStartError] = React.useState<string | null>(null);
  const formStartedTracked = React.useRef(false);

  function notifyFormStarted() {
    if (formStartedTracked.current || !onFormStarted) return;
    formStartedTracked.current = true;
    onFormStarted();
  }

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

  function validateCustomFields(): string | null {
    for (const f of sortedFields) {
      const v = fieldValues[f.id] ?? "";
      if (!f.required) continue;
      switch (f.type) {
        case "CHECKBOX":
          if (v !== "true") return `Please confirm: ${f.label}`;
          break;
        case "NUMBER": {
          const n = Number(v);
          if (!v.trim() || !Number.isFinite(n)) return `Enter a valid number for ${f.label}`;
          break;
        }
        case "DROPDOWN":
          if (!v.trim()) return `Please select ${f.label}`;
          break;
        case "DATE":
          if (!v.trim()) return `Please enter ${f.label}`;
          break;
        default:
          if (!v.trim()) return `Please enter ${f.label}`;
      }
    }
    return null;
  }

  async function startPayment() {
    setStartError(null);

    if (!payerEmail.trim()) {
      setStartError("Please enter your email.");
      return;
    }

    const fieldErr = validateCustomFields();
    if (fieldErr) {
      setStartError(fieldErr);
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

  function setField(id: string, value: string) {
    setFieldValues((prev) => ({ ...prev, [id]: value }));
  }

  return (
    <form
      className="space-y-4"
      onFocusCapture={(e) => {
        const el = e.target as HTMLElement | null;
        if (!el?.matches?.("input, textarea, select")) return;
        notifyFormStarted();
      }}
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

      {sortedFields.map((f) => {
        const value = fieldValues[f.id] ?? "";

        if (f.type === "CHECKBOX") {
          return (
            <div key={f.id} className="flex items-start gap-3 rounded-xl border border-zinc-100 bg-zinc-50/60 px-3 py-3">
              <input
                type="checkbox"
                id={f.id}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/30"
                checked={value === "true"}
                onChange={(e) => {
                  notifyFormStarted();
                  setField(f.id, e.target.checked ? "true" : "false");
                }}
              />
              <div className="min-w-0 space-y-1">
                <label htmlFor={f.id} className="text-sm font-medium text-zinc-800 leading-snug cursor-pointer">
                  {f.label} {f.required ? <span className="text-red-600">*</span> : null}
                </label>
                {f.helperText ? <div className="text-xs text-zinc-500">{f.helperText}</div> : null}
              </div>
            </div>
          );
        }

        return (
          <div key={f.id} className="space-y-2">
            <label className="text-xs font-medium text-zinc-600" htmlFor={f.id}>
              {f.label} {f.required ? <span className="text-red-600">*</span> : null}
            </label>
            {f.type === "DROPDOWN" ? (
              <select
                id={f.id}
                className={cn(selectClassName, !value && "text-zinc-400")}
                value={value}
                onChange={(e) => setField(f.id, e.target.value)}
                required={f.required}
                aria-required={f.required}
              >
                <option value="">{f.placeholder?.trim() || "Select an option"}</option>
                {(f.options ?? []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            ) : f.type === "DATE" ? (
              <Input
                id={f.id}
                type="date"
                value={value}
                onChange={(e) => setField(f.id, e.target.value)}
                required={f.required}
                aria-required={f.required}
              />
            ) : f.type === "NUMBER" ? (
              <Input
                id={f.id}
                type="number"
                inputMode="decimal"
                step="any"
                placeholder={f.placeholder || ""}
                value={value}
                onChange={(e) => setField(f.id, e.target.value)}
                required={f.required}
                aria-required={f.required}
              />
            ) : (
              <Input
                id={f.id}
                type="text"
                placeholder={f.placeholder || ""}
                value={value}
                onChange={(e) => setField(f.id, e.target.value)}
                required={f.required}
                aria-required={f.required}
              />
            )}
            {f.helperText ? <div className="text-xs text-zinc-500">{f.helperText}</div> : null}
          </div>
        );
      })}

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
