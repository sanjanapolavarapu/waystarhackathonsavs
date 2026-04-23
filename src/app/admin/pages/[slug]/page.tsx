/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import Link from "next/link";
import {
  ChevronDown,
  Copy,
  Eye,
  Link2,
  QrCode,
  Settings2,
  ShieldCheck,
} from "lucide-react";

import { getPageBySlug } from "@/lib/mock-qpp";
import type { PaymentPage } from "@/lib/qpp-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const BRAND_COLORS = ["#0EA5E9", "#06B6D4", "#10B981", "#3B82F6", "#8B5CF6", "#F97316"];

export default function AdminPageEditor({ params }: { params: { slug: string } }) {
  const initial = getPageBySlug(params.slug) ?? getPageBySlug("telehealth-consult");
  const [page, setPage] = React.useState<PaymentPage>(() => structuredClone(initial!));

  const amountModeUi: "fixed" | "range" | "custom" =
    page.amountMode === "FIXED"
      ? "fixed"
      : page.amountMode === "RANGE"
        ? "range"
        : "custom";

  const publicUrl = `https://yourdomain.com/pay/${page.slug}`;
  const iframeSnippet = `<iframe src="${publicUrl}" style="width:100%;max-width:480px;border:0;border-radius:16px;overflow:hidden" height="740" title="${page.title}"></iframe>`;

  function setAmountMode(next: "fixed" | "range" | "custom") {
    setPage((p) => ({
      ...p,
      amountMode: next === "fixed" ? "FIXED" : next === "range" ? "RANGE" : "USER_ENTERED",
    }));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="text-xl font-semibold tracking-tight text-zinc-900">
              Edit page
            </div>
            {page.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="warning">Disabled</Badge>}
          </div>
          <div className="mt-1 text-sm text-zinc-500">
            UI-only editor — hook up save/publish actions later.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/pages">
            <Button variant="secondary">Back</Button>
          </Link>
          <Button variant="ghost" className="hover:bg-white/60">
            Save draft
          </Button>
          <Button variant="primary">Publish</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <Card className="bg-white/80 backdrop-blur">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <div className="text-sm font-semibold tracking-tight text-zinc-900">
                  Payment Page Configuration
                </div>
                <div className="mt-1 text-sm text-zinc-500">Live preview updates as you edit</div>
              </div>
              <Button variant="ghost" className="h-9 px-3 text-zinc-700 hover:bg-zinc-100/70">
                <Settings2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-5">
              <Section
                title="Branding & Styling"
                icon={
                  <div className="h-9 w-9 rounded-2xl bg-sky-50 border border-sky-100 grid place-items-center text-sky-700 font-semibold">
                    C
                  </div>
                }
              >
                <div className="space-y-2">
                  <div className="text-xs font-medium text-zinc-600">Primary brand color</div>
                  <div className="flex flex-wrap gap-2">
                    {BRAND_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setPage((p) => ({ ...p, brandColor: c }))}
                        className={cn(
                          "h-9 w-14 rounded-2xl border transition-all hover:-translate-y-[1px]",
                          c === page.brandColor
                            ? "border-zinc-900/10 ring-2 ring-sky-500/30 shadow-sm"
                            : "border-white/50 shadow-sm hover:shadow-md",
                        )}
                        style={{ backgroundColor: c }}
                        aria-label={`Set brand color ${c}`}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-3 py-2 shadow-sm">
                    <div
                      className="h-7 w-7 rounded-xl border border-zinc-200"
                      style={{ backgroundColor: page.brandColor }}
                      aria-hidden="true"
                    />
                    <div className="text-sm font-mono text-zinc-700">{page.brandColor}</div>
                  </div>
                </div>
              </Section>

              <Section
                title="Page Content"
                icon={
                  <div className="h-9 w-9 rounded-2xl bg-emerald-50 border border-emerald-100 grid place-items-center text-emerald-700 font-semibold">
                    T
                  </div>
                }
              >
                <div className="space-y-4">
                  <Field label="Page title">
                    <Input
                      value={page.title}
                      onChange={(e) => setPage((p) => ({ ...p, title: e.target.value }))}
                    />
                  </Field>
                  <Field label="Subtitle / description">
                    <Input
                      value={page.subtitle ?? ""}
                      onChange={(e) => setPage((p) => ({ ...p, subtitle: e.target.value }))}
                    />
                  </Field>
                  <Field label="Custom header message">
                    <Input
                      value={page.headerMessage ?? ""}
                      onChange={(e) => setPage((p) => ({ ...p, headerMessage: e.target.value }))}
                      placeholder="Optional"
                    />
                  </Field>
                  <Field label="Custom footer message">
                    <Input
                      value={page.footerMessage ?? ""}
                      onChange={(e) => setPage((p) => ({ ...p, footerMessage: e.target.value }))}
                      placeholder="Optional"
                    />
                  </Field>
                </div>
              </Section>

              <Section
                title="Payment Amount"
                icon={
                  <div className="h-9 w-9 rounded-2xl bg-sky-50 border border-sky-100 grid place-items-center text-sky-700 font-semibold">
                    $
                  </div>
                }
              >
                <div className="space-y-4">
                  <Segmented
                    options={[
                      { id: "fixed", label: "Fixed Amount" },
                      { id: "range", label: "Min/Max Range" },
                      { id: "custom", label: "User-Entered" },
                    ]}
                    value={amountModeUi}
                    onChange={(v) => setAmountMode(v as "fixed" | "range" | "custom")}
                  />

                  {amountModeUi === "fixed" ? (
                    <Field label="Fixed amount (USD)">
                      <div className="relative">
                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                          $
                        </span>
                        <Input
                          className="pl-8"
                          value={String((page.fixedAmountCents ?? 0) / 100)}
                          onChange={(e) => {
                            const n = Number(e.target.value || "0");
                            setPage((p) => ({ ...p, fixedAmountCents: Math.round(n * 100) }));
                          }}
                        />
                      </div>
                    </Field>
                  ) : amountModeUi === "range" ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Field label="Min (USD)">
                        <Input
                          value={String((page.minAmountCents ?? 0) / 100)}
                          onChange={(e) => {
                            const n = Number(e.target.value || "0");
                            setPage((p) => ({ ...p, minAmountCents: Math.round(n * 100) }));
                          }}
                        />
                      </Field>
                      <Field label="Max (USD)">
                        <Input
                          value={String((page.maxAmountCents ?? 0) / 100)}
                          onChange={(e) => {
                            const n = Number(e.target.value || "0");
                            setPage((p) => ({ ...p, maxAmountCents: Math.round(n * 100) }));
                          }}
                        />
                      </Field>
                    </div>
                  ) : (
                    <div className="text-sm text-zinc-600">
                      Payers will enter any amount they choose.
                    </div>
                  )}
                </div>
              </Section>

              <Section
                title="Custom Data Fields (up to 10)"
                icon={
                  <div className="h-9 w-9 rounded-2xl bg-zinc-50 border border-zinc-200 grid place-items-center text-zinc-700">
                    ≡
                  </div>
                }
                action={
                  <button
                    type="button"
                    onClick={() =>
                      setPage((p) => ({
                        ...p,
                        fields: [
                          ...p.fields,
                          {
                            id: `field_${p.fields.length + 1}`,
                            label: "New field",
                            type: "TEXT",
                            required: false,
                            order: p.fields.length,
                          },
                        ],
                      }))
                    }
                    className="text-sm font-medium text-sky-700 hover:text-sky-800 hover:underline underline-offset-4"
                  >
                    + Add Field
                  </button>
                }
              >
                <div className="space-y-3">
                  {page.fields
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((f) => (
                      <div
                        key={f.id}
                        className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-3 py-2 shadow-sm transition hover:shadow-md"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-zinc-900">{f.label}</div>
                          <div className="mt-1 text-xs text-zinc-500">
                            {f.required ? "Required" : "Optional"}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="inline-flex items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-700">
                            {f.type}
                            <ChevronDown className="h-3.5 w-3.5 opacity-70" />
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setPage((p) => ({ ...p, fields: p.fields.filter((x) => x.id !== f.id) }))
                            }
                            className="h-9 w-9 rounded-xl hover:bg-zinc-100 text-zinc-500"
                            aria-label={`Remove ${f.label}`}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </Section>

              <Section
                title="General Ledger (GL) Codes"
                icon={
                  <div className="h-9 w-9 rounded-2xl bg-white border border-zinc-200 grid place-items-center text-zinc-700 font-semibold">
                    #
                  </div>
                }
              >
                <div className="space-y-2">
                  <div className="text-xs font-medium text-zinc-600">
                    Associate one or more GL codes with this page
                  </div>
                  <Input
                    value={page.glCodes.join(", ")}
                    onChange={(e) =>
                      setPage((p) => ({
                        ...p,
                        glCodes: e.target.value
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      }))
                    }
                    placeholder="e.g., GL-1001, GL-1002"
                  />
                </div>
              </Section>

              <Section
                title="Confirmation Email Templates"
                icon={
                  <div className="h-9 w-9 rounded-2xl bg-white border border-zinc-200 grid place-items-center text-zinc-700 font-semibold">
                    @
                  </div>
                }
              >
                <div className="space-y-3">
                  <Field label="Subject template">
                    <Input
                      value={page.emailSubjectTemplate ?? ""}
                      onChange={(e) => setPage((p) => ({ ...p, emailSubjectTemplate: e.target.value }))}
                      placeholder='e.g., "Receipt for {{title}}"'
                    />
                  </Field>
                  <Field label="Body template">
                    <textarea
                      className="min-h-28 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                      value={page.emailBodyTemplate ?? ""}
                      onChange={(e) => setPage((p) => ({ ...p, emailBodyTemplate: e.target.value }))}
                      placeholder="Use variables like {{payer_name}}, {{amount}}, {{transaction_id}}, {{date}}"
                    />
                  </Field>
                  <div className="text-xs text-zinc-500">
                    Variables:{" "}
                    <span className="font-mono">
                      {"{{payer_name}} {{amount}} {{transaction_id}} {{date}} {{title}}"}
                    </span>
                  </div>
                </div>
              </Section>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur">
            <CardHeader>
              <div className="text-sm font-semibold text-zinc-900">Distribution</div>
              <div className="mt-1 text-sm text-zinc-500">
                Copy the public URL, iframe snippet, or show QR.
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
                <div className="text-xs font-medium text-zinc-600">Public URL</div>
                <div className="mt-1 flex items-center justify-between gap-3">
                  <div className="min-w-0 font-mono text-xs text-zinc-700 truncate">
                    {publicUrl}
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={async () => {
                      await navigator.clipboard.writeText(publicUrl);
                    }}
                  >
                    <Link2 className="h-4 w-4" />
                    Copy
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
                <div className="text-xs font-medium text-zinc-600">Embeddable iframe</div>
                <div className="mt-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 font-mono text-[11px] text-zinc-700 overflow-x-auto">
                  {iframeSnippet}
                </div>
                <div className="mt-2 flex justify-end">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={async () => {
                      await navigator.clipboard.writeText(iframeSnippet);
                    }}
                  >
                    <Copy className="h-4 w-4" />
                    Copy snippet
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-medium text-zinc-600">QR code</div>
                    <div className="mt-1 text-xs text-zinc-500">
                      UI placeholder — teammates can render QR via a library.
                    </div>
                  </div>
                  <div className="h-12 w-12 rounded-2xl border border-zinc-200 bg-zinc-50 grid place-items-center text-zinc-700">
                    <QrCode className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:sticky lg:top-6 h-fit">
          <PreviewShell brandColor={page.brandColor} urlPath={`/pay/${page.slug}`}>
            <PaymentPreview page={page} />
          </PreviewShell>
          <div className="mt-3 flex items-center justify-end gap-2">
            <Link href={`/pay/${page.slug}`}>
              <Button variant="secondary" size="sm">
                <Eye className="h-4 w-4" />
                Open public page
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  action,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-zinc-200/70 bg-white/70 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {icon}
          <div className="text-sm font-semibold text-zinc-900">{title}</div>
        </div>
        {action}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-zinc-600">{label}</div>
      {children}
    </div>
  );
}

function PreviewShell({
  brandColor,
  urlPath,
  children,
}: {
  brandColor: string;
  urlPath: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-zinc-200 bg-gradient-to-b from-zinc-900 to-zinc-950 p-4 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.55)]">
      <div className="flex items-center justify-between rounded-2xl bg-zinc-900/70 px-3 py-2 text-xs text-zinc-200">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400/90" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-300/90" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-400/90" />
          </div>
          <div className="ml-2 rounded-lg bg-black/40 px-2 py-1 text-[11px] text-zinc-300">
            yourdomain.com{urlPath}
          </div>
        </div>
        <div
          className="h-2.5 w-10 rounded-full opacity-90"
          style={{ backgroundColor: brandColor }}
          aria-hidden="true"
        />
      </div>
      <div className="mt-4 rounded-2xl bg-white p-6">{children}</div>
    </div>
  );
}

function fmtMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function PaymentPreview({ page }: { page: PaymentPage }) {
  const amount =
    page.amountMode === "FIXED"
      ? fmtMoney(page.fixedAmountCents ?? 0)
      : page.amountMode === "RANGE"
        ? `${fmtMoney(page.minAmountCents ?? 0)}–${fmtMoney(page.maxAmountCents ?? 0)}`
        : "Enter amount";

  return (
    <div className="flex flex-col items-center">
      <div className="h-14 w-14 rounded-full border border-zinc-200 bg-zinc-50 grid place-items-center">
        <div
          className="h-7 w-7 rounded-lg"
          style={{ backgroundColor: page.brandColor }}
          aria-hidden="true"
        />
      </div>
      <div className="mt-4 text-xl font-semibold text-zinc-900 text-center">{page.title}</div>
      <div className="mt-1 text-sm text-zinc-500 text-center">{page.subtitle}</div>

      {page.headerMessage ? (
        <div className="mt-4 text-sm text-zinc-600 text-center">{page.headerMessage}</div>
      ) : null}

      <div className="mt-6 w-full max-w-sm rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-zinc-50 px-5 py-4 border-b border-zinc-200">
          <div className="text-xs font-medium text-zinc-500 text-center">Payment Amount</div>
          <div className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900 text-center">
            {amount}
          </div>
        </div>
        <div className="p-5 space-y-4">
          {page.fields
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((f) => (
              <div key={f.id} className="space-y-1.5">
                <div className="text-xs font-medium text-zinc-600">
                  {f.label} {f.required ? <span className="text-red-600">*</span> : null}
                </div>
                <div className="h-11 rounded-xl border border-zinc-200 bg-zinc-50 px-4 flex items-center text-sm text-zinc-400">
                  {f.type === "DATE"
                    ? "mm/dd/yyyy"
                    : f.type === "DROPDOWN"
                      ? "Select option"
                      : f.type === "CHECKBOX"
                        ? "□"
                        : "Enter value"}
                </div>
              </div>
            ))}

          <div className="space-y-1.5">
            <div className="text-xs font-medium text-zinc-600">Card Information</div>
            <div className="h-11 rounded-xl border border-zinc-200 bg-zinc-50 px-4 flex items-center justify-between text-sm text-zinc-400">
              <span>1234 5678 9012 3456</span>
              <div className="flex gap-1.5">
                <div className="h-3 w-5 rounded-sm bg-blue-500/80" />
                <div className="h-3 w-5 rounded-sm bg-orange-400/80" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="h-11 rounded-xl border border-zinc-200 bg-zinc-50 px-4 flex items-center text-sm text-zinc-400">
                MM / YY
              </div>
              <div className="h-11 rounded-xl border border-zinc-200 bg-zinc-50 px-4 flex items-center text-sm text-zinc-400">
                CVC
              </div>
            </div>
          </div>

          <button
            type="button"
            className="mt-2 h-11 w-full rounded-xl text-white text-sm font-semibold shadow-sm transition hover:opacity-95"
            style={{ backgroundColor: page.brandColor }}
          >
            Complete Payment
          </button>

          <div className="flex items-center justify-center gap-6 text-xs text-zinc-500 pt-1">
            <div className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-zinc-500" />
              Secure
            </div>
            <div className="inline-flex items-center gap-2">
              <Copy className="h-4 w-4 text-zinc-500" />
              Encrypted
            </div>
          </div>
        </div>
      </div>

      {page.footerMessage ? (
        <div className="mt-4 text-xs text-zinc-500 text-center">{page.footerMessage}</div>
      ) : null}
      <div className="mt-2 text-xs text-zinc-400">Powered by ClearCare Pay</div>
    </div>
  );
}

