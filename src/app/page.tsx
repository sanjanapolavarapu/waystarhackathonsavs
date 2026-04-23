/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  Copy,
  Eye,
  LayoutGrid,
  Link2,
  QrCode,
  Settings2,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { TopTabsNav } from "@/components/top-tabs-nav";
import { getSupabaseClient } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type CustomField = {
  id: string;
  label: string;
  type: "Text" | "Number" | "Dropdown" | "Date" | "Checkbox";
};

const BRAND_COLORS = [
  "#0EA5E9",
  "#06B6D4",
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#F97316",
];

type StatItem = {
  label: string;
  value: string;
  delta: string;
  icon: React.ComponentType<{ className?: string }>;
};

const DEFAULT_STATS: StatItem[] = [
  { label: "Active Pages", value: "0", delta: "+0 this week", icon: LayoutGrid },
  { label: "Payments", value: "0", delta: "No data yet", icon: BarChart3 },
  { label: "Revenue Collected", value: "$0.00", delta: "No data yet", icon: Copy },
  { label: "Avg. Payment", value: "$0.00", delta: "Across all pages", icon: Settings2 },
];

function formatPercentChange(current: number, previous: number) {
  if (previous === 0 && current === 0) return "No change from last month";
  if (previous === 0 && current > 0) return "New this month";
  const pct = ((current - previous) / previous) * 100;
  const rounded = Math.round(Math.abs(pct));
  const sign = pct >= 0 ? "+" : "-";
  return `${sign}${rounded}% from last month`;
}

export default function Home() {
  const [brandColor, setBrandColor] = React.useState(BRAND_COLORS[0]);
  const [pageTitle, setPageTitle] = React.useState("Consulting Session");
  const [subtitle, setSubtitle] = React.useState(
    "A fast, reusable payment link for any business",
  );
  const [amountMode, setAmountMode] = React.useState<"fixed" | "range" | "custom">(
    "fixed",
  );
  const [fixedAmount, setFixedAmount] = React.useState("89");
  const [customFields, setCustomFields] = React.useState<CustomField[]>([
    { id: "name", label: "Full Name", type: "Text" },
    { id: "serviceDate", label: "Service Date", type: "Date" },
    { id: "reference", label: "Reference ID", type: "Text" },
  ]);
  const [stats, setStats] = React.useState<StatItem[]>(DEFAULT_STATS);
  const [newFieldId, setNewFieldId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      const supabase = getSupabaseClient();
      if (!supabase) {
        // Env not configured; keep default/fallback stats and avoid runtime crashes.
        setStats(DEFAULT_STATS);
        return;
      }

      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - 7);

      const [activePagesResult, newPagesThisWeekResult, monthlyTxResult, allSuccessTxResult] =
        await Promise.all([
          supabase
            .from("payment_pages")
            .select("id", { count: "exact", head: true })
            .eq("is_active", true),
          supabase
            .from("payment_pages")
            .select("id", { count: "exact", head: true })
            .gte("created_at", weekStart.toISOString()),
          supabase
            .from("transactions")
            .select("amount, status, created_at")
            .gte("created_at", previousMonthStart.toISOString()),
          supabase
            .from("transactions")
            .select("amount, status"),
        ]);

      if (!isMounted) return;

      if (
        activePagesResult.error ||
        newPagesThisWeekResult.error ||
        monthlyTxResult.error ||
        allSuccessTxResult.error
      ) {
        setStats([
          { label: "Active Pages", value: "—", delta: "Unable to load", icon: LayoutGrid },
          { label: "Payments", value: "—", delta: "Unable to load", icon: BarChart3 },
          { label: "Revenue Collected", value: "—", delta: "Unable to load", icon: Copy },
          { label: "Avg. Payment", value: "—", delta: "Unable to load", icon: Settings2 },
        ]);
        return;
      }

      const successStatuses = new Set(["success", "succeeded", "paid", "completed"]);
      const monthlyRows = monthlyTxResult.data ?? [];

      const currentMonthRows = monthlyRows.filter((row) => {
        const createdAt = row.created_at ? new Date(row.created_at) : null;
        return (
          createdAt &&
          createdAt >= currentMonthStart &&
          successStatuses.has((row.status ?? "").toLowerCase())
        );
      });

      const previousMonthRows = monthlyRows.filter((row) => {
        const createdAt = row.created_at ? new Date(row.created_at) : null;
        return (
          createdAt &&
          createdAt >= previousMonthStart &&
          createdAt < currentMonthStart &&
          successStatuses.has((row.status ?? "").toLowerCase())
        );
      });

      const currentPayments = currentMonthRows.length;
      const previousPayments = previousMonthRows.length;
      const currentRevenue = currentMonthRows.reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
      const previousRevenue = previousMonthRows.reduce(
        (sum, row) => sum + Number(row.amount ?? 0),
        0,
      );

      const allSuccessRows = (allSuccessTxResult.data ?? []).filter((row) =>
        successStatuses.has((row.status ?? "").toLowerCase()),
      );
      const totalRevenue = allSuccessRows.reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
      const avgPayment = allSuccessRows.length > 0 ? totalRevenue / allSuccessRows.length : 0;

      setStats([
        {
          label: "Active Pages",
          value: (activePagesResult.count ?? 0).toLocaleString(),
          delta: `+${(newPagesThisWeekResult.count ?? 0).toLocaleString()} this week`,
          icon: LayoutGrid,
        },
        {
          label: "Payments",
          value: currentPayments.toLocaleString(),
          delta: formatPercentChange(currentPayments, previousPayments),
          icon: BarChart3,
        },
        {
          label: "Revenue Collected",
          value: currentRevenue.toLocaleString(undefined, {
            style: "currency",
            currency: "USD",
          }),
          delta: formatPercentChange(currentRevenue, previousRevenue),
          icon: Copy,
        },
        {
          label: "Avg. Payment",
          value: avgPayment.toLocaleString(undefined, {
            style: "currency",
            currency: "USD",
          }),
          delta: "Across all pages",
          icon: Settings2,
        },
      ]);
    }

    void loadStats();

    return () => {
      isMounted = false;
    };
  }, []);
  function addField() {
    const id = `field_${Date.now()}`;
    setNewFieldId(id);
    setCustomFields((prev) => [
      ...prev,
      { id, label: "", type: "Text" },
    ]);
  }

  function removeField(id: string) {
    setCustomFields((prev) => prev.filter((f) => f.id !== id));
  }

  function updateField(id: string, updates: Partial<CustomField>) {
    setCustomFields((prev) =>
      prev.map((field) => (field.id === id ? { ...field, ...updates } : field)),
    );
  }

  function moveField(id: string, direction: "up" | "down") {
    setCustomFields((prev) => {
      const index = prev.findIndex((field) => field.id === id);
      if (index < 0) return prev;

      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= prev.length) return prev;

      const next = prev.slice();
      const [moved] = next.splice(index, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-[#fbfbff] bg-[radial-gradient(1200px_600px_at_15%_20%,rgba(99,102,241,0.14),transparent_60%),radial-gradient(900px_500px_at_90%_10%,rgba(217,70,239,0.12),transparent_55%)]">
      <div className="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6">
        <TopTabsNav
          subtitle="Reusable payment links for any business"
          actions={
            <>
              <Button variant="ghost" className="h-10 px-3 hover:bg-white/60">
                Save Draft
              </Button>
              <Button variant="primary">Publish Page</Button>
            </>
          }
        />

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-5">
            <Card className="bg-white/80 backdrop-blur">
              <CardHeader className="flex flex-row items-start justify-between">
                <div>
                  <div className="text-sm font-semibold tracking-tight text-zinc-900">
                    Configure Your Payment Page
                  </div>
                  <div className="mt-1 text-sm text-zinc-500">
                    Customize it for your organization
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="h-9 px-3 text-zinc-700 hover:bg-zinc-100/70"
                >
                  <Settings2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-5">
                <Section
                  title="Branding & Style"
                  icon={
                    <div className="h-9 w-9 rounded-2xl bg-indigo-50 border border-indigo-100 grid place-items-center text-indigo-700 font-semibold">
                      C
                    </div>
                  }
                >
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-zinc-600">
                      Brand Color
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {BRAND_COLORS.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setBrandColor(c)}
                          className={cn(
                            "h-9 w-14 rounded-2xl border transition-all hover:-translate-y-[1px]",
                            c === brandColor
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
                        style={{ backgroundColor: brandColor }}
                        aria-hidden="true"
                      />
                      <div className="text-sm font-mono text-zinc-700">
                        {brandColor.toLowerCase()}
                      </div>
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
                    <Field label="Page Title">
                      <Input
                        value={pageTitle}
                        onChange={(e) => setPageTitle(e.target.value)}
                      />
                    </Field>
                    <Field label="Subtitle">
                      <Input
                        value={subtitle}
                        onChange={(e) => setSubtitle(e.target.value)}
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
                        { id: "fixed", label: "Fixed" },
                        { id: "range", label: "Range" },
                        { id: "custom", label: "Custom" },
                      ]}
                      value={amountMode}
                      onChange={(v) =>
                        setAmountMode(v as "fixed" | "range" | "custom")
                      }
                    />
                    <Field label="Amount">
                      <div className="relative">
                        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
                          $
                        </span>
                        <Input
                          className="pl-8"
                          value={fixedAmount}
                          onChange={(e) => setFixedAmount(e.target.value)}
                        />
                      </div>
                      <div className="mt-2 text-xs text-zinc-500">
                        {amountMode === "fixed"
                          ? "Payers will pay a single amount."
                          : amountMode === "range"
                            ? "Payers choose an amount within a range."
                            : "Payers enter a custom amount."}
                      </div>
                    </Field>
                  </div>
                </Section>

                <Section
                  title="Custom Fields"
                  icon={
                    <div className="h-9 w-9 rounded-2xl bg-zinc-50 border border-zinc-200 grid place-items-center text-zinc-700">
                      ≡
                    </div>
                  }
                  action={
                    <button
                      type="button"
                      onClick={addField}
                      className="text-sm font-medium text-indigo-700 hover:text-indigo-800 hover:underline underline-offset-4"
                    >
                      + Add Field
                    </button>
                  }
                >
                  <div className="space-y-3">
                    {customFields.map((f, index) => (
                      <div
                        key={f.id}
                        className={cn(
                          "rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm transition hover:shadow-md",
                          newFieldId === f.id && "border-indigo-300 ring-2 ring-indigo-200/70",
                        )}
                      >
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
                          <div className="space-y-1.5">
                            <label
                              htmlFor={`field-label-${f.id}`}
                              className="text-xs font-medium text-zinc-600"
                            >
                              Field name
                            </label>
                            <Input
                              id={`field-label-${f.id}`}
                              value={f.label}
                              onChange={(e) =>
                                updateField(f.id, { label: e.target.value })
                              }
                              autoFocus={newFieldId === f.id}
                              onFocus={() => {
                                if (newFieldId === f.id) setNewFieldId(null);
                              }}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label
                              htmlFor={`field-type-${f.id}`}
                              className="text-xs font-medium text-zinc-600"
                            >
                              Type
                            </label>
                            <select
                              id={`field-type-${f.id}`}
                              value={f.type}
                              onChange={(e) =>
                                updateField(f.id, {
                                  type: e.target.value as CustomField["type"],
                                })
                              }
                              className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                            >
                              <option value="Text">Text</option>
                              <option value="Number">Number</option>
                              <option value="Dropdown">Dropdown</option>
                              <option value="Date">Date</option>
                              <option value="Checkbox">Checkbox</option>
                            </select>
                          </div>
                          <div className="flex items-center gap-1 sm:pb-0.5">
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
                              disabled={index === customFields.length - 1}
                              aria-label={`Move ${f.label || "field"} down`}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeField(f.id)}
                            className="h-11 w-11 rounded-xl hover:bg-zinc-100 text-zinc-500"
                            aria-label={`Remove ${f.label}`}
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="text-sm font-semibold text-zinc-900">
                  Distribution Options
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <DistributionOption
                    icon={<Link2 className="h-4 w-4" />}
                    title="Copy Link"
                    subtitle="Share a URL"
                  />
                  <DistributionOption
                    icon={<QrCode className="h-4 w-4" />}
                    title="QR Code"
                    subtitle="Print & scan"
                  />
                  <DistributionOption
                    icon={<Eye className="h-4 w-4" />}
                    title="Embed"
                    subtitle="Website widget"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:sticky lg:top-6 h-fit">
            <PreviewShell brandColor={brandColor}>
              <PaymentPreview
                brandColor={brandColor}
                title={pageTitle}
                subtitle={subtitle}
                amount={fixedAmount}
                fields={customFields}
              />
            </PreviewShell>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  delta,
  icon: Icon,
}: {
  label: string;
  value: string;
  delta: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="overflow-hidden bg-white/80 backdrop-blur">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-medium text-zinc-500">{label}</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
              {value}
            </div>
            <div className="mt-1 text-xs text-indigo-600">{delta}</div>
          </div>
          <div className="h-10 w-10 rounded-2xl bg-indigo-50 border border-indigo-100 grid place-items-center text-indigo-700">
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
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

function DistributionOption({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <button
      type="button"
      className="flex items-center gap-3 rounded-3xl border border-zinc-200 bg-white px-4 py-4 text-left shadow-sm transition hover:shadow-md hover:-translate-y-[1px]"
    >
      <div className="h-10 w-10 rounded-2xl bg-zinc-50 border border-zinc-200 grid place-items-center text-zinc-700">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-zinc-900">{title}</div>
        <div className="text-xs text-zinc-500">{subtitle}</div>
      </div>
    </button>
  );
}

function PreviewShell({
  brandColor,
  children,
}: {
  brandColor: string;
  children: React.ReactNode;
}) {
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
            yourdomain.com/pay/consulting-session
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

function PaymentPreview({
  brandColor,
  title,
  subtitle,
  amount,
  fields,
}: {
  brandColor: string;
  title: string;
  subtitle: string;
  amount: string;
  fields: CustomField[];
}) {
  return (
    <div className="flex flex-col items-center">
      <div className="h-14 w-14 rounded-full border border-zinc-200 bg-zinc-50 grid place-items-center">
        <div
          className="h-7 w-7 rounded-lg"
          style={{ backgroundColor: brandColor }}
          aria-hidden="true"
        />
      </div>
      <div className="mt-4 text-xl font-semibold text-zinc-900 text-center">
        {title}
      </div>
      <div className="mt-1 text-sm text-zinc-500 text-center">{subtitle}</div>

      <div className="mt-6 w-full max-w-sm rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-zinc-50 px-5 py-4 border-b border-zinc-200">
          <div className="text-xs font-medium text-zinc-500 text-center">
            Payment Amount
          </div>
          <div className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900 text-center">
            ${Number(amount || 0).toFixed(2)}
          </div>
        </div>
        <div className="p-5 space-y-4">
          {fields.map((f) => (
            <div key={f.id} className="space-y-1.5">
              <div className="text-xs font-medium text-zinc-600">{f.label}</div>
              <div className="h-11 rounded-xl border border-zinc-200 bg-zinc-50 px-4 flex items-center text-sm text-zinc-400">
                {f.type === "Date"
                  ? "mm/dd/yyyy"
                  : f.type === "Dropdown"
                    ? "Select option"
                    : f.type === "Checkbox"
                      ? "□"
                      : f.type === "Number"
                        ? "Enter number"
                        : "Enter text"}
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
            style={{ backgroundColor: brandColor }}
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

      <div className="mt-4 text-xs text-zinc-400">Powered by Quick Payment Pages</div>
    </div>
  );
}

