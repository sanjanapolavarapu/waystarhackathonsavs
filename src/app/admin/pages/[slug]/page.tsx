"use client";

import * as React from "react";
import Link from "next/link";
import * as QRCode from "qrcode";
import {
  ChevronUp,
  ChevronDown,
  Copy,
  Eye,
  Link2,
  QrCode,
  Settings2,
  ShieldCheck,
} from "lucide-react";

import { getPageBySlug, savePage } from "@/lib/db";
import { validateGlCodes } from "@/lib/gl-code";
import type { CustomField, CustomFieldType, PaymentPage } from "@/lib/qpp-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { Badge } from "@/components/ui/badge";
import { buildPublicPayUrl, getPublicBaseUrl } from "@/lib/public-url";
import { cn } from "@/lib/utils";

const BRAND_COLORS = ["#0EA5E9", "#06B6D4", "#10B981", "#3B82F6", "#8B5CF6", "#F97316"];
const MAX_CUSTOM_FIELDS = 10;
const FIELD_TYPE_OPTIONS: Array<{ value: CustomFieldType; label: string }> = [
  { value: "TEXT", label: "Text" },
  { value: "NUMBER", label: "Number" },
  { value: "DROPDOWN", label: "Dropdown" },
  { value: "DATE", label: "Date" },
  { value: "CHECKBOX", label: "Checkbox" },
];

const EMPTY_PAGE: PaymentPage = {
  id: "",
  slug: "",
  isActive: false,
  title: "",
  subtitle: "",
  brandColor: BRAND_COLORS[0],
  amountMode: "FIXED",
  fixedAmountCents: 0,
  minAmountCents: 0,
  maxAmountCents: 0,
  glCodes: [],
  fields: [],
  updatedAt: new Date(0).toISOString(),
  createdAt: new Date(0).toISOString(),
};

function normalizeFieldOrder(fields: CustomField[]) {
  return fields.map((field, index) => ({ ...field, order: index }));
}

export default function AdminPageEditor({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params);
  const [page, setPage] = React.useState<PaymentPage>(EMPTY_PAGE);
  const [newFieldId, setNewFieldId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState<string | null>(null);
  const [saveError, setSaveError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function loadPage() {
      setLoading(true);
      setLoadError(null);

      try {
        const loaded = await getPageBySlug(slug);
        if (cancelled) return;

        if (!loaded) {
          setLoadError("Page not found.");
          return;
        }

        setPage(structuredClone(loaded));
      } catch (err) {
        if (cancelled) return;
        setLoadError(err instanceof Error ? err.message : "Failed to load page.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPage();

    return () => {
      cancelled = true;
    };
  }, [slug]);
  const glValidation = validateGlCodes(page.glCodes);

  const amountModeUi: "fixed" | "range" | "custom" =
    page.amountMode === "FIXED"
      ? "fixed"
      : page.amountMode === "RANGE"
        ? "range"
        : "custom";

  const publicUrl = buildPublicPayUrl(page.slug);
  const iframeSnippet = `<iframe src="${publicUrl}" style="width:100%;max-width:480px;border:0;border-radius:16px;overflow:hidden" height="740" title="${page.title}"></iframe>`;

  function setAmountMode(next: "fixed" | "range" | "custom") {
    setPage((p) => ({
      ...p,
      amountMode: next === "fixed" ? "FIXED" : next === "range" ? "RANGE" : "USER_ENTERED",
    }));
  }

  const sortedFields = page.fields.slice().sort((a, b) => a.order - b.order);
  const maxFieldsReached = page.fields.length >= MAX_CUSTOM_FIELDS;

  function addField() {
    if (maxFieldsReached) return;
    const id = `field_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    setNewFieldId(id);
    setPage((p) => ({
      ...p,
      fields: normalizeFieldOrder([
        ...p.fields,
        {
          id,
          label: "",
          type: "TEXT",
          required: false,
          placeholder: "",
          helperText: "",
          options: [],
          order: p.fields.length,
        },
      ]),
    }));
  }

  function updateField(fieldId: string, updates: Partial<CustomField>) {
    setPage((p) => ({
      ...p,
      fields: p.fields.map((field) => (field.id === fieldId ? { ...field, ...updates } : field)),
    }));
  }

  function deleteField(fieldId: string) {
    setPage((p) => ({
      ...p,
      fields: normalizeFieldOrder(p.fields.filter((field) => field.id !== fieldId)),
    }));
  }

  function moveField(fieldId: string, direction: "up" | "down") {
    setPage((p) => {
      const sorted = p.fields.slice().sort((a, b) => a.order - b.order);
      const index = sorted.findIndex((field) => field.id === fieldId);
      if (index < 0) return p;

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= sorted.length) return p;

      const next = sorted.slice();
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);

      return { ...p, fields: normalizeFieldOrder(next) };
    });
  }

  async function handlePublish() {
    setSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      await savePage(page);
      setSaveSuccess("Page saved successfully.");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save page.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="py-10 text-sm text-zinc-600">Loading...</div>;
  }

  if (loadError) {
    return <div className="py-10 text-sm text-red-600">{loadError}</div>;
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
          {saveError ? <div className="text-sm text-red-600">{saveError}</div> : null}
          {saveSuccess ? <div className="text-sm text-emerald-700">{saveSuccess}</div> : null}
          <Link href="/admin/pages">
            <Button variant="secondary">Back</Button>
          </Link>
          <Button variant="ghost" className="hover:bg-white/60">
            Save draft
          </Button>
          <Button variant="primary" onClick={handlePublish} disabled={saving || !glValidation.valid}>
            {saving ? "Saving..." : "Publish"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative z-10 space-y-5">
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
                  <div className="h-9 w-9 rounded-2xl bg-indigo-50 border border-indigo-100 grid place-items-center text-indigo-700 font-semibold">
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
                            ? "border-zinc-900/10 ring-2 ring-indigo-500/30 shadow-sm"
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
                  <div className="h-9 w-9 rounded-2xl bg-fuchsia-50 border border-fuchsia-100 grid place-items-center text-fuchsia-700 font-semibold">
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
                  <div className="h-9 w-9 rounded-2xl bg-indigo-50 border border-indigo-100 grid place-items-center text-indigo-700 font-semibold">
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
              >
                <div className="space-y-3">
                  {sortedFields.map((f, index) => {
                    const fieldBaseId = `custom-field-${f.id}`;

                    return (
                      <div
                        key={f.id}
                        className={cn(
                          "relative z-10 space-y-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm transition hover:shadow-md",
                          newFieldId === f.id && "border-indigo-300 ring-2 ring-indigo-200/70",
                        )}
                      >
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <label
                              htmlFor={`${fieldBaseId}-label`}
                              className="text-xs font-medium text-zinc-600"
                            >
                              Field label
                            </label>
                            <Input
                              id={`${fieldBaseId}-label`}
                              value={f.label}
                              onChange={(e) => updateField(f.id, { label: e.target.value })}
                              onFocus={() => {
                                if (newFieldId === f.id) setNewFieldId(null);
                              }}
                              autoFocus={newFieldId === f.id}
                              className="relative z-10"
                            />
                            <div className="flex items-center gap-2 pt-1">
                              <input
                                id={`${fieldBaseId}-required`}
                                type="checkbox"
                                checked={f.required}
                                onChange={(e) => updateField(f.id, { required: e.target.checked })}
                                className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500"
                              />
                              <label
                                htmlFor={`${fieldBaseId}-required`}
                                className="text-sm font-medium text-zinc-700"
                              >
                                Required
                              </label>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label
                              htmlFor={`${fieldBaseId}-type`}
                              className="text-xs font-medium text-zinc-600"
                            >
                              Field type
                            </label>
                            <select
                              id={`${fieldBaseId}-type`}
                              value={f.type}
                              onChange={(e) => {
                                const nextType = e.target.value as CustomFieldType;
                                updateField(f.id, {
                                  type: nextType,
                                  options: nextType === "DROPDOWN" ? f.options ?? [] : [],
                                });
                              }}
                              className="relative z-10 h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                            >
                              {FIELD_TYPE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label
                            htmlFor={`${fieldBaseId}-placeholder`}
                            className="text-xs font-medium text-zinc-600"
                          >
                            Placeholder text
                          </label>
                          <Input
                            id={`${fieldBaseId}-placeholder`}
                            value={f.placeholder ?? ""}
                            onChange={(e) => updateField(f.id, { placeholder: e.target.value })}
                            className="relative z-10"
                          />
                        </div>

                        {f.type === "DROPDOWN" ? (
                          <div className="space-y-1.5">
                            <label
                              htmlFor={`${fieldBaseId}-options`}
                              className="text-xs font-medium text-zinc-600"
                            >
                              Dropdown options (comma-separated)
                            </label>
                            <Input
                              id={`${fieldBaseId}-options`}
                              value={(f.options ?? []).join(", ")}
                              onChange={(e) =>
                                updateField(f.id, {
                                  options: e.target.value
                                    .split(",")
                                    .map((s) => s.trim())
                                    .filter(Boolean),
                                })
                              }
                              className="relative z-10"
                            />
                          </div>
                        ) : null}

                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => moveField(f.id, "up")}
                              disabled={index === 0}
                              aria-label={`Move ${f.label || "field"} up`}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => moveField(f.id, "down")}
                              disabled={index === sortedFields.length - 1}
                              aria-label={`Move ${f.label || "field"} down`}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteField(f.id)}
                              aria-label={`Delete ${f.label || "field"}`}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {maxFieldsReached ? (
                    <div className="text-xs font-medium text-amber-700">
                      Maximum of {MAX_CUSTOM_FIELDS} fields reached.
                    </div>
                  ) : null}

                  <div className="pt-1">
                    <Button variant="secondary" size="sm" onClick={addField} disabled={maxFieldsReached}>
                      + Add Field
                    </Button>
                  </div>
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
                    placeholder="e.g., 100-5000, 200-1100"
                  />
                  {!glValidation.valid ? (
                    <div className="text-xs text-red-600">
                      Invalid GL codes: {glValidation.invalid.join(", ")}. Expected format:{" "}
                      <span className="font-mono">XXX-XXXX</span>
                    </div>
                  ) : (
                    <div className="text-xs text-zinc-500">
                      Format: <span className="font-mono">XXX-XXXX</span> (example: 100-5000)
                    </div>
                  )}
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
                      className="min-h-28 w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
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
                <QRCodePanel url={publicUrl} title={page.title} />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="relative z-0 h-fit lg:sticky lg:top-6 lg:pointer-events-none">
          <PreviewShell brandColor={page.brandColor} urlPath={`/pay/${page.slug}`}>
            <PaymentPreview page={page} />
          </PreviewShell>
          <div className="mt-3 flex items-center justify-end gap-2 lg:pointer-events-auto">
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
  const baseUrl = getPublicBaseUrl();
  const displayHost = baseUrl ? baseUrl.replace(/^https?:\/\//i, "") : "your-domain";
  return (
    <div className="rounded-[28px] border border-zinc-200/80 bg-white/75 backdrop-blur p-4 shadow-[0_20px_60px_-30px_rgba(2,6,23,0.22)]">
      <div className="flex items-center justify-between rounded-2xl bg-zinc-50/80 border border-zinc-200 px-3 py-2 text-xs text-zinc-700">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-red-400/90" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-300/90" />
            <div className="h-2.5 w-2.5 rounded-full bg-green-400/90" />
          </div>
          <div className="ml-2 rounded-lg bg-white/70 border border-zinc-200 px-2 py-1 text-[11px] text-zinc-600">
            {displayHost}{urlPath}
          </div>
        </div>
        <div
          className="h-2.5 w-10 rounded-full opacity-90"
          style={{ backgroundColor: brandColor }}
          aria-hidden="true"
        />
      </div>
      <div className="mt-4 rounded-2xl bg-white p-6 shadow-sm">{children}</div>
    </div>
  );
}

function fmtMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function QRCodePanel({ url, title }: { url: string; title: string }) {
  const [pngDataUrl, setPngDataUrl] = React.useState<string | null>(null);
  const [svg, setSvg] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [debug, setDebug] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        setDebug(null);
        const [png, svgString] = await Promise.all([
          QRCode.toDataURL(url, {
            margin: 2,
            scale: 8,
            errorCorrectionLevel: "M",
            color: { dark: "#0f172a", light: "#ffffff" },
          }),
          QRCode.toString(url, {
            type: "svg",
            margin: 2,
            errorCorrectionLevel: "M",
            color: { dark: "#0f172a", light: "#ffffff" },
          }),
        ]);
        if (cancelled) return;
        setPngDataUrl(png);
        setSvg(svgString);
      } catch {
        if (cancelled) return;
        setError("Could not generate QR code.");
        setDebug(
          `QR debug: typeof QRCode=${typeof QRCode}, keys=${Object.keys(QRCode).slice(0, 6).join(",")}`,
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url]);

  const safeSlug = title
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, "-")
    .replaceAll(/(^-|-$)/g, "");

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 rounded-2xl border border-zinc-200 bg-zinc-50 grid place-items-center overflow-hidden">
          {pngDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={pngDataUrl} alt={`QR code for ${url}`} className="h-full w-full" />
          ) : (
            <QrCode className="h-6 w-6 text-zinc-700" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0">
          <div className="text-xs font-medium text-zinc-600">QR code</div>
          <div className="mt-1 text-xs text-zinc-500 truncate font-mono">{url}</div>
          {error ? <div className="mt-1 text-xs text-red-600">{error}</div> : null}
          {debug ? <div className="mt-1 text-[11px] text-zinc-500">{debug}</div> : null}
        </div>
      </div>

      <div className="flex items-center gap-2 justify-end">
        <Button
          variant="secondary"
          size="sm"
          disabled={!svg}
          onClick={() => {
            if (!svg) return;
            downloadBlob(`${safeSlug || "qpp"}-qr.svg`, new Blob([svg], { type: "image/svg+xml" }));
          }}
        >
          Download SVG
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={!pngDataUrl}
          onClick={async () => {
            if (!pngDataUrl) return;
            const res = await fetch(pngDataUrl);
            const blob = await res.blob();
            downloadBlob(`${safeSlug || "qpp"}-qr.png`, blob);
          }}
        >
          Download PNG
        </Button>
      </div>
    </div>
  );
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
      <div className="mt-2 text-xs text-zinc-400">Powered by Quick Payment Pages</div>
    </div>
  );
}

