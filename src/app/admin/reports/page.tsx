"use client";

import * as React from "react";
import { Download } from "lucide-react";

import { OrgSwitcher } from "@/components/org-switcher";
import { getSelectedOrgId } from "@/lib/org";
import { getSupabaseClient } from "@/lib/supabase";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

function fmtMoney(amount: number) {
  return amount.toLocaleString(undefined, { style: "currency", currency: "USD" });
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

      // Verify org membership (RLS should also enforce, but this gives a friendly message).
      const { data: membership, error: mErr } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("organization_id", orgId)
        .limit(1);

      if (!mounted) return;
      if (mErr) {
        setError(mErr.message);
        setLoading(false);
        return;
      }
      if (!membership || membership.length === 0) {
        setError("You don’t have access to this organization. Join with a code or switch orgs.");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("transactions")
        .select("id, page_slug, created_at, status, payment_method, amount, amount_cents, payer_email, gl_code")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false });

      if (!mounted) return;
      if (error) {
        setError(error.message);
        setTx([]);
        setLoading(false);
        return;
      }
      setTx((data as typeof tx) ?? []);
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const success = tx.filter((t) => String(t.status ?? "").toLowerCase() === "success");
  const totalPayments = success.length;
  const totalAmount = success.reduce((sum, t) => {
    const a =
      typeof t.amount === "number"
        ? t.amount
        : typeof t.amount_cents === "number"
          ? t.amount_cents / 100
          : 0;
    return sum + a;
  }, 0);
  const avg = totalPayments ? totalAmount / totalPayments : 0;

  const csv = toCsv(
    tx.map((t) => ({
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

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xl font-semibold tracking-tight text-zinc-900">Reporting</div>
          <div className="mt-1 text-sm text-zinc-500">
            Reports are scoped to your selected organization.
          </div>
        </div>
        <div className="flex items-center gap-2">
          <OrgSwitcher />
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
              Filters are UI-only placeholders
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input placeholder="Date range (e.g., 2026-04-01..2026-04-30)" className="sm:w-[320px]" />
            <Input placeholder="Filter by page slug" className="sm:w-[220px]" />
            <Input placeholder="Status (success/failed/pending)" className="sm:w-[260px]" />
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
                {tx.map((t) => (
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
                      {String(t.status ?? "").toLowerCase() === "success" ? (
                        <Badge variant="success">Success</Badge>
                      ) : String(t.status ?? "").toLowerCase() === "failed" ? (
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
            UI placeholders for “Breakdown by GL code” and “Breakdown by payment method”.
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="text-xs font-medium text-zinc-600">By GL code</div>
            <div className="mt-3 space-y-2 text-sm text-zinc-700">
              {Array.from(
                tx.reduce((m, t) => {
                  const k = t.gl_code ?? "—";
                  const ok = String(t.status ?? "").toLowerCase() === "success";
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
                tx.reduce((m, t) => {
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

