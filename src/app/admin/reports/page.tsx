import { Download } from "lucide-react";

import { listPages, listTransactions } from "@/lib/mock-qpp";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

function fmtMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
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
  const pages = listPages();
  const tx = listTransactions();

  const totalPayments = tx.filter((t) => t.status === "success").length;
  const totalAmount = tx
    .filter((t) => t.status === "success")
    .reduce((sum, t) => sum + t.amountCents, 0);
  const avg = totalPayments ? Math.round(totalAmount / totalPayments) : 0;

  const csv = toCsv(
    tx.map((t) => ({
      id: t.id,
      page: t.pageSlug,
      created_at: t.createdAt,
      status: t.status,
      payment_method: t.paymentMethod,
      amount: fmtMoney(t.amountCents),
      payer_email: t.payerEmail,
      gl_code: t.glCode,
    })),
  );

  const downloadHref = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xl font-semibold tracking-tight text-zinc-900">Reporting</div>
          <div className="mt-1 text-sm text-zinc-500">
            UI-only reports — teammates can replace mock data with API results.
          </div>
        </div>
        <a href={downloadHref} download="transactions.csv">
          <Button variant="secondary">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        </a>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="bg-white/80 backdrop-blur">
          <CardContent className="p-5">
            <div className="text-xs font-medium text-zinc-500">Total payments</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
              {totalPayments}
            </div>
            <div className="mt-1 text-xs text-indigo-600">Success only</div>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur">
          <CardContent className="p-5">
            <div className="text-xs font-medium text-zinc-500">Total amount collected</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
              {fmtMoney(totalAmount)}
            </div>
            <div className="mt-1 text-xs text-indigo-600">Across all pages</div>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur">
          <CardContent className="p-5">
            <div className="text-xs font-medium text-zinc-500">Average payment</div>
            <div className="mt-2 text-2xl font-semibold tracking-tight text-zinc-900">
              {fmtMoney(avg)}
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
                        {new Date(t.createdAt).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-zinc-800">
                      <div className="font-medium">{t.pageSlug}</div>
                      <div className="text-xs text-zinc-500">
                        {pages.find((p) => p.slug === t.pageSlug)?.title ?? "—"}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {t.status === "success" ? (
                        <Badge variant="success">Success</Badge>
                      ) : t.status === "failed" ? (
                        <Badge variant="danger">Failed</Badge>
                      ) : (
                        <Badge variant="warning">Pending</Badge>
                      )}
                    </td>
                    <td className="px-5 py-4 text-zinc-700">{t.paymentMethod}</td>
                    <td className="px-5 py-4 text-zinc-700">{t.glCode ?? "—"}</td>
                    <td className="px-5 py-4 text-right font-semibold text-zinc-900">
                      {fmtMoney(t.amountCents)}
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
                  const k = t.glCode ?? "—";
                  m.set(k, (m.get(k) ?? 0) + (t.status === "success" ? t.amountCents : 0));
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
                  m.set(t.paymentMethod, (m.get(t.paymentMethod) ?? 0) + 1);
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

