"use client";

import * as React from "react";
import { Download } from "lucide-react";

import { getSupabaseClient } from "@/lib/supabase";
import { getSelectedOrgId } from "@/lib/org";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

function fmtMoney(amount: number) {
  return amount.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function normalizeStatus(status: string | null | undefined) {
  const s = String(status ?? "").toLowerCase();
  if (s === "success" || s === "succeeded") return "succeeded";
  if (s === "failed" || s === "canceled" || s === "cancelled") return "failed";
  return "other";
}

function pct(part: number, total: number) {
  if (!total) return "0.0%";
  return `${((part / total) * 100).toFixed(1)}%`;
}

function parseYmd(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

function endOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

/** Parses `YYYY-MM-DD..YYYY-MM-DD`, optional start/end, or a single `YYYY-MM-DD` (that day only). */
function parseDateRangeInput(raw: string): { start: Date | null; end: Date | null } | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.includes("..")) {
    const [a, b] = trimmed.split("..").map((x) => x.trim());
    const start = a ? parseYmd(a) : null;
    const endDay = b ? parseYmd(b) : null;
    const end = endDay ? endOfLocalDay(endDay) : null;
    return { start, end };
  }
  const day = parseYmd(trimmed);
  if (!day) return null;
  return { start: day, end: endOfLocalDay(day) };
}

function rowInDateRange(
  iso: string | null | undefined,
  range: { start: Date | null; end: Date | null } | null,
): boolean {
  if (!range || (!range.start && !range.end)) return true;
  if (!iso) return false;
  const t = new Date(iso).getTime();
  if (range.start && t < range.start.getTime()) return false;
  if (range.end && t > range.end.getTime()) return false;
  return true;
}

function statusFilterMatches(rowStatus: string | null | undefined, filterRaw: string): boolean {
  const f = filterRaw.trim().toLowerCase();
  if (!f) return true;
  const n = normalizeStatus(rowStatus);
  if (f === "success" || f === "succeeded") return n === "succeeded";
  if (f === "failed" || f === "fail") return n === "failed";
  if (f === "pending" || f === "other") return n === "other";
  return n === f;
}

function slugFilterMatches(slug: string | null | undefined, filterRaw: string): boolean {
  const f = filterRaw.trim().toLowerCase();
  if (!f) return true;
  const s = String(slug ?? "").toLowerCase();
  return s.includes(f);
}

function toCsv(rows: Record<string, string | number | undefined>[]) {
  const headers = Array.from(
    rows.reduce((acc, r) => {
      Object.keys(r).forEach((k) => acc.add(k));
      return acc;
    }, new Set<string>()),
  );
  const esc = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => esc(r[h])).join(",")),
  ];
  return lines.join("\n");
}

export default function ReportsUi() {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [tx, setTx] = React.useState<
    {
      id: string;
      page_slug?: string | null;
      created_at?: string | null;
      status?: string | null;
      payment_method?: string | null;
      amount?: number | null;
      amount_cents?: number | null;
      payer_email?: string | null;
      gl_code?: string | null;
    }[]
  >([]);
  const [visits, setVisits] = React.useState<
    {
      id: string;
      page_slug?: string | null;
      visited_at?: string | null;
    }[]
  >([]);
  const [visitsWarning, setVisitsWarning] = React.useState<string | null>(null);
  const [filterDateRange, setFilterDateRange] = React.useState("");
  const [filterPageSlug, setFilterPageSlug] = React.useState("");
  const [filterStatus, setFilterStatus] = React.useState("");

  React.useEffect(() => {
    let mounted = true;
    const supabase = getSupabaseClient();
    const orgId = getSelectedOrgId();

    if (!supabase) {
      queueMicrotask(() => {
        if (!mounted) return;
        setError("Supabase isn’t configured.");
        setLoading(false);
      });
      return;
    }

    if (!orgId) {
      queueMicrotask(() => {
        if (!mounted) return;
        setError("Select or join an organization to view reports.");
        setLoading(false);
      });
      return;
    }

    void (async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from("transactions")
        .select("id, page_slug, created_at, status, payment_method, amount, amount_cents, payer_email, gl_code")
        .order("created_at", { ascending: false });

      if (!mounted) return;
      if (error) {
        setError(error.message);
        setTx([]);
        setLoading(false);
        return;
      }
      setTx((data as typeof tx) ?? []);

      const visitsRes = await supabase
        .from("page_visits")
        .select("id, page_slug, visited_at")
        .order("visited_at", { ascending: false });
      if (visitsRes.error) {
        setVisits([]);
        setVisitsWarning(
          "Page visit tracking is unavailable. Create the page_visits table to enable funnel analytics.",
        );
      } else {
        setVisits((visitsRes.data as typeof visits) ?? []);
        setVisitsWarning(null);
      }

      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const dateRangeParsed = React.useMemo(
    () => parseDateRangeInput(filterDateRange),
    [filterDateRange],
  );

  const filteredTx = React.useMemo(() => {
    return tx.filter((t) => {
      if (!slugFilterMatches(t.page_slug, filterPageSlug)) return false;
      if (!statusFilterMatches(t.status, filterStatus)) return false;
      if (!rowInDateRange(t.created_at, dateRangeParsed)) return false;
      return true;
    });
  }, [tx, filterPageSlug, filterStatus, dateRangeParsed]);

  const filteredVisits = React.useMemo(() => {
    return visits.filter((v) => {
      if (!slugFilterMatches(v.page_slug, filterPageSlug)) return false;
      if (!rowInDateRange(v.visited_at, dateRangeParsed)) return false;
      return true;
    });
  }, [visits, filterPageSlug, dateRangeParsed]);

  const successfulTx = filteredTx.filter((t) => normalizeStatus(t.status) === "succeeded");
  const failedTx = filteredTx.filter((t) => normalizeStatus(t.status) === "failed");
  const totalPayments = successfulTx.length;
  const totalAmount = successfulTx.reduce((sum, t) => {
    const a =
      typeof t.amount === "number"
        ? t.amount
        : typeof t.amount_cents === "number"
          ? t.amount_cents / 100
          : 0;
    return sum + a;
  }, 0);
  const avg = totalPayments ? totalAmount / totalPayments : 0;
  const funnelVisited = filteredVisits.length;
  const funnelStarted = filteredTx.length;
  const funnelPaid = successfulTx.length;
  const conversionRateText = pct(funnelPaid, funnelVisited);
  const failedRateText = pct(failedTx.length, successfulTx.length + failedTx.length);

  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setHours(0, 0, 0, 0);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const dailyVolume = Array.from({ length: 7 }, (_, idx) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + idx);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString(undefined, { weekday: "short" });
    return { key, label, amount: 0 };
  });
  const dayMap = new Map(dailyVolume.map((d) => [d.key, d]));
  for (const row of successfulTx) {
    if (!row.created_at) continue;
    const key = new Date(row.created_at).toISOString().slice(0, 10);
    const day = dayMap.get(key);
    if (!day) continue;
    const amount =
      typeof row.amount === "number"
        ? row.amount
        : typeof row.amount_cents === "number"
          ? row.amount_cents / 100
          : 0;
    day.amount += amount;
  }
  const maxDayAmount = Math.max(...dailyVolume.map((d) => d.amount), 0);

  const csv = toCsv(
    filteredTx.map((t) => ({
      id: t.id,
      page: t.page_slug ?? "",
      created_at: t.created_at ?? "",
      status: t.status ?? "",
      payment_method: t.payment_method ?? "",
      amount: fmtMoney(
        typeof t.amount === "number"
          ? t.amount
          : typeof t.amount_cents === "number"
            ? t.amount_cents / 100
            : 0,
      ),
      payer_email: t.payer_email ?? "",
      gl_code: t.gl_code ?? "",
    })),
  );

  const downloadHref = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;

  const filtersActive =
    Boolean(filterDateRange.trim()) || Boolean(filterPageSlug.trim()) || Boolean(filterStatus.trim());

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xl font-semibold tracking-tight text-zinc-900">Reporting</div>
          <div className="mt-1 text-sm text-zinc-500">
            Conversion, payment volume, and failure analytics.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a href={downloadHref} download="transactions.csv">
          <Button variant="secondary">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          </a>
        </div>
      </div>

      {error ? (
        <Card className="bg-white/80 backdrop-blur">
          <CardContent className="p-5 text-sm text-zinc-700">
            {error}
          </CardContent>
        </Card>
      ) : null}
      {visitsWarning ? (
        <Card className="bg-amber-50 border-amber-200">
          <CardContent className="p-4 text-sm text-amber-900">{visitsWarning}</CardContent>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="bg-white/80 backdrop-blur lg:col-span-2">
          <CardHeader>
            <div className="text-sm font-semibold text-zinc-900">Conversion Funnel</div>
            <div className="mt-1 text-sm text-zinc-500">Who visited, started checkout, and paid.</div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-2xl border border-zinc-200 bg-white p-3">
                <div className="text-xs text-zinc-500">Visited</div>
                <div className="mt-1 text-2xl font-semibold text-zinc-900">{loading ? "—" : funnelVisited}</div>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-3">
                <div className="text-xs text-zinc-500">Started form</div>
                <div className="mt-1 text-2xl font-semibold text-zinc-900">{loading ? "—" : funnelStarted}</div>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-white p-3">
                <div className="text-xs text-zinc-500">Paid</div>
                <div className="mt-1 text-2xl font-semibold text-zinc-900">{loading ? "—" : funnelPaid}</div>
              </div>
            </div>
            <div className="text-sm font-medium text-indigo-700">
              Conversion rate: {loading ? "—" : conversionRateText}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur">
          <CardHeader>
            <div className="text-sm font-semibold text-zinc-900">Failed Payment Rate</div>
            <div className="mt-1 text-sm text-zinc-500">How many payment attempts failed.</div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm text-zinc-700">
              <span className="font-semibold">{loading ? "—" : successfulTx.length}</span> succeeded
            </div>
            <div className="text-sm text-zinc-700">
              <span className="font-semibold">{loading ? "—" : failedTx.length}</span> failed
            </div>
            <div className="text-sm font-medium text-rose-700">
              Rate: {loading ? "—" : failedRateText}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <div className="text-sm font-semibold text-zinc-900">Daily Payment Volume (Sun-Sat)</div>
          <div className="mt-1 text-sm text-zinc-500">Successful payments for the current week.</div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-3 items-end h-48">
            {dailyVolume.map((d) => {
              const height = maxDayAmount > 0 ? Math.max(12, Math.round((d.amount / maxDayAmount) * 140)) : 12;
              return (
                <div key={d.key} className="flex flex-col items-center gap-2">
                  <div className="text-[11px] text-zinc-500">{fmtMoney(d.amount)}</div>
                  <div className="w-full rounded-t-xl bg-indigo-500/80" style={{ height }} />
                  <div className="text-xs text-zinc-600">{d.label}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="bg-white/80 backdrop-blur">
          <CardContent className="p-5">
            <div className="text-xs font-medium text-zinc-500">Total payments</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
              {loading ? "—" : totalPayments}
            </div>
            <div className="mt-1 text-xs text-indigo-600">Success only</div>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur">
          <CardContent className="p-5">
            <div className="text-xs font-medium text-zinc-500">Total amount collected</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
              {loading ? "—" : fmtMoney(totalAmount)}
            </div>
            <div className="mt-1 text-xs text-indigo-600">Across all pages</div>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur">
          <CardContent className="p-5">
            <div className="text-xs font-medium text-zinc-500">Average payment</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
              {loading ? "—" : fmtMoney(avg)}
            </div>
            <div className="mt-1 text-xs text-indigo-600">Success only</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/80 backdrop-blur">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-zinc-900">Transactions</div>
            <div className="mt-1 text-sm text-zinc-500">
              {filtersActive ? (
                <>
                  Showing <span className="font-medium text-zinc-700">{filteredTx.length}</span> of{" "}
                  <span className="font-medium text-zinc-700">{tx.length}</span> rows. Date uses{" "}
                  <span className="font-mono text-xs">YYYY-MM-DD</span> or{" "}
                  <span className="font-mono text-xs">start..end</span> (inclusive).
                </>
              ) : (
                <>
                  Filter by visit/payment date, page slug (partial match), or status. Same filters apply to
                  totals, chart, export, and breakdowns.
                </>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              aria-label="Filter by date or date range"
              placeholder="Date: 2026-04-01..2026-04-30"
              className="sm:w-[320px]"
              value={filterDateRange}
              onChange={(e) => setFilterDateRange(e.target.value)}
            />
            <Input
              aria-label="Filter by page slug"
              placeholder="Page slug (partial)"
              className="sm:w-[220px]"
              value={filterPageSlug}
              onChange={(e) => setFilterPageSlug(e.target.value)}
            />
            <Input
              aria-label="Filter by status"
              placeholder="Status: success, failed, pending"
              className="sm:w-[260px]"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-t border-zinc-200 bg-zinc-50/70">
                <tr className="text-xs font-medium text-zinc-600">
                  <th className="px-5 py-3">Transaction</th>
                  <th className="px-5 py-3">Page</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Method</th>
                  <th className="px-5 py-3">GL</th>
                  <th className="px-5 py-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {!loading && filteredTx.length === 0 ? (
                  <tr>
                    <td className="px-5 py-10 text-center text-sm text-zinc-500" colSpan={6}>
                      {tx.length === 0
                        ? "No transactions loaded yet."
                        : "No transactions match these filters."}
                    </td>
                  </tr>
                ) : null}
                {filteredTx.map((t) => (
                  <tr key={t.id} className="bg-white/60">
                    <td className="px-5 py-4">
                      <div className="font-mono text-xs text-zinc-700">{t.id}</div>
                      <div className="text-xs text-zinc-500">
                        {t.created_at ? new Date(t.created_at).toLocaleString() : "—"}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-zinc-800">
                      <div className="font-medium">{t.page_slug ?? "—"}</div>
                    </td>
                    <td className="px-5 py-4">
                      {normalizeStatus(t.status) === "succeeded" ? (
                        <Badge variant="success">Success</Badge>
                      ) : normalizeStatus(t.status) === "failed" ? (
                        <Badge variant="danger">Failed</Badge>
                      ) : (
                        <Badge variant="warning">Pending</Badge>
                      )}
                    </td>
                    <td className="px-5 py-4 text-zinc-700">{t.payment_method ?? "—"}</td>
                    <td className="px-5 py-4 text-zinc-700">{t.gl_code ?? "—"}</td>
                    <td className="px-5 py-4 text-right font-semibold text-zinc-900">
                      {fmtMoney(
                        typeof t.amount === "number"
                          ? t.amount
                          : typeof t.amount_cents === "number"
                            ? t.amount_cents / 100
                            : 0,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <div className="text-sm font-semibold text-zinc-900">Breakdowns</div>
          <div className="mt-1 text-sm text-zinc-500">
            Successful volume by GL code and attempt counts by payment method (uses the same filters as
            above).
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-medium text-zinc-600">By GL code</div>
            <div className="mt-3 space-y-2 text-sm text-zinc-700">
              {Array.from(
                filteredTx.reduce((m, t) => {
                  const k = t.gl_code ?? "—";
                  const ok = normalizeStatus(t.status) === "succeeded";
                  const amt =
                    typeof t.amount === "number"
                      ? t.amount
                      : typeof t.amount_cents === "number"
                        ? t.amount_cents / 100
                        : 0;
                  m.set(k, (m.get(k) ?? 0) + (ok ? amt : 0));
                  return m;
                }, new Map<string, number>()),
              ).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="font-mono text-xs">{k}</span>
                  <span className="font-semibold">{fmtMoney(v)}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-medium text-zinc-600">By payment method</div>
            <div className="mt-3 space-y-2 text-sm text-zinc-700">
              {Array.from(
                filteredTx.reduce((m, t) => {
                  const k = t.payment_method ?? "unknown";
                  m.set(k, (m.get(k) ?? 0) + 1);
                  return m;
                }, new Map<string, number>()),
              ).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="capitalize">{k}</span>
                  <span className="font-semibold">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

