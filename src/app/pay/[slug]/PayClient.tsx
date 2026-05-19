"use client";

import * as React from "react";

import PaymentWrapper from "@/components/PaymentWrapper";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { CustomFieldType } from "@/lib/qpp-types";

const selectClassName =
  [
    "h-11 w-full appearance-none rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 shadow-sm",
    "focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500",
    "dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-100",
  ].join(" ");

type AmountMode = "FIXED" | "RANGE" | "USER_ENTERED";

/**
 * Public pay form field payload. The API and mock data must send `type` (and
 * `options` for DROPDOWN); unknown shapes are normalized when rendering.
 */
export type PayField = {
  id: string;
  label: string;
  type: CustomFieldType;
  required: boolean;
  order: number;
  placeholder?: string;
  helperText?: string;
  /** Used when `type` is `"DROPDOWN"`. */
  options?: string[];
};

function normalizePayField(raw: unknown): PayField | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const id = typeof r.id === "string" ? r.id : null;
  const label = typeof r.label === "string" ? r.label : null;
  const order = typeof r.order === "number" ? r.order : 0;
  if (!id || label === null) return null;

  const allowed: CustomFieldType[] = ["TEXT", "NUMBER", "DROPDOWN", "DATE", "CHECKBOX"];
  const t = r.type;
  const type: CustomFieldType =
    typeof t === "string" && (allowed as string[]).includes(t) ? (t as CustomFieldType) : "TEXT";

  const required = Boolean(r.required);
  const placeholder = typeof r.placeholder === "string" ? r.placeholder : undefined;
  const helperText = typeof r.helperText === "string" ? r.helperText : undefined;

  let options: string[] | undefined;
  if (Array.isArray(r.options)) {
    options = r.options.map(String).filter(Boolean);
  }

  return { id, label, type, required, order, placeholder, helperText, options };
}

function fieldSignature(fields: PayField[]) {
  return fields
    .map((f) => `${f.id}:${f.type}:${f.order}:${f.required ? 1 : 0}:${(f.options ?? []).join(",")}`)
    .sort()
    .join("|");
}

function PayFieldControl({
  field: f,
  value,
  onChange,
  onInteract,
}: {
  field: PayField;
  value: string;
  onChange: (next: string) => void;
  onInteract: () => void;
}) {
  const helper = f.helperText ? (
    <div className="text-xs text-zinc-500 dark:text-zinc-400">{f.helperText}</div>
  ) : null;

  switch (f.type) {
    case "CHECKBOX":
      return (
        <div className="flex items-start gap-3 rounded-xl border border-zinc-100 bg-zinc-50/60 px-3 py-3 dark:border-zinc-800 dark:bg-zinc-950/30">
          <input
            type="checkbox"
            id={f.id}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 text-indigo-600 focus:ring-2 focus:ring-indigo-500/30"
            checked={value === "true"}
            onChange={(e) => {
              onInteract();
              onChange(e.target.checked ? "true" : "false");
            }}
          />
          <div className="min-w-0 space-y-1">
            <label
              htmlFor={f.id}
              className="text-sm font-medium text-zinc-800 leading-snug cursor-pointer dark:text-zinc-100"
            >
              {f.label} {f.required ? <span className="text-red-600">*</span> : null}
            </label>
            {helper}
          </div>
        </div>
      );

    case "DROPDOWN": {
      const opts = f.options ?? [];
      return (
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300" htmlFor={f.id}>
            {f.label} {f.required ? <span className="text-red-600">*</span> : null}
          </label>
          <select
            id={f.id}
            className={cn(selectClassName, !value && "text-zinc-400")}
            value={value}
            onFocus={onInteract}
            onChange={(e) => {
              onInteract();
              onChange(e.target.value);
            }}
            required={f.required}
            aria-required={f.required}
          >
            <option value="">{f.placeholder?.trim() || "Select an option"}</option>
            {opts.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          {helper}
        </div>
      );
    }

    case "DATE":
      return (
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300" htmlFor={f.id}>
            {f.label} {f.required ? <span className="text-red-600">*</span> : null}
          </label>
          <Input
            id={f.id}
            type="date"
            value={value}
            onFocus={onInteract}
            onChange={(e) => {
              onInteract();
              onChange(e.target.value);
            }}
            required={f.required}
            aria-required={f.required}
          />
          {helper}
        </div>
      );

    case "NUMBER":
      return (
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300" htmlFor={f.id}>
            {f.label} {f.required ? <span className="text-red-600">*</span> : null}
          </label>
          <Input
            id={f.id}
            type="number"
            inputMode="decimal"
            step="any"
            placeholder={f.placeholder || ""}
            value={value}
            onFocus={onInteract}
            onChange={(e) => {
              onInteract();
              onChange(e.target.value);
            }}
            required={f.required}
            aria-required={f.required}
          />
          {helper}
        </div>
      );

    case "TEXT":
    default:
      return (
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300" htmlFor={f.id}>
            {f.label} {f.required ? <span className="text-red-600">*</span> : null}
          </label>
          <Input
            id={f.id}
            type="text"
            placeholder={f.placeholder || ""}
            value={value}
            onFocus={onInteract}
            onChange={(e) => {
              onInteract();
              onChange(e.target.value);
            }}
            required={f.required}
            aria-required={f.required}
          />
          {helper}
        </div>
      );
  }
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
  /** Accepts `CustomField[]` from the page loader; each row is normalized to `PayField`. */
  fields: PayField[];
  onFormStarted?: () => void;
}) {
  const sortedFields = React.useMemo(() => {
    const normalized = (fields ?? [])
      .map((raw) => normalizePayField(raw))
      .filter((f): f is PayField => Boolean(f));
    return normalized.sort((a, b) => a.order - b.order);
  }, [fields]);

  const [payerName, setPayerName] = React.useState("");
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

    if (!payerName.trim()) {
      setStartError("Please enter your name.");
      return;
    }
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

    notifyFormStarted();

    setIsStarting(true);
    try {
      // Persist the payload so CheckoutForm can finalize /api/payments/complete after Stripe confirms.
      try {
        window.sessionStorage.setItem(
          "qpp_pending_payment",
          JSON.stringify({
            pageSlug,
            amount: resolvedAmountCents / 100,
            payerName: payerName.trim(),
            payerEmail: payerEmail.trim(),
            paymentMethod: "card",
            customResponses: fieldValues,
          }),
        );
      } catch {
        // ignore
      }

      const res = await fetch("/api/create-payment-intent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          pageSlug,
          amount: resolvedAmountCents,
          payerName: payerName.trim(),
          payerEmail: payerEmail.trim(),
          customResponses: fieldValues,
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
        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300" htmlFor="payer_name">
          Name <span className="text-red-600">*</span>
        </label>
        <Input
          id="payer_name"
          placeholder="Your name"
          value={payerName}
          onChange={(e) => setPayerName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300" htmlFor="payer_email">
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
        <div className="text-xs text-zinc-500 dark:text-zinc-400">Receipt will be sent to this email.</div>
      </div>

      {amountMode === "USER_ENTERED" || amountMode === "RANGE" ? (
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-600 dark:text-zinc-300" htmlFor="amount">
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
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Min ${minDollars.toFixed(2)} · Max ${maxDollars.toFixed(2)}
            </div>
          ) : null}
        </div>
      ) : null}

      {sortedFields.map((f) => (
        <PayFieldControl
          key={f.id}
          field={f}
          value={fieldValues[f.id] ?? ""}
          onChange={(next) => setField(f.id, next)}
          onInteract={notifyFormStarted}
        />
      ))}

      <Button variant="primary" className="w-full" type="submit" disabled={isStarting}>
        {isStarting ? "Starting…" : "Continue to payment"}
      </Button>

      {startError ? (
        <div
          className="text-red-600 text-sm mt-2 font-medium bg-red-50 p-3 rounded-md border border-red-200 dark:bg-red-500/10 dark:border-red-500/30 dark:text-red-200"
          role="alert"
        >
          {startError}
        </div>
      ) : null}
    </form>
  );
}
