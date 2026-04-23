"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Search } from "lucide-react";

import type { PaymentPage } from "@/lib/qpp-types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function AdminPagesClient() {
  const [pages, setPages] = React.useState<PaymentPage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      queueMicrotask(() => {
        if (cancelled) return;
        setLoading(true);
        setError(null);
      });
      try {
        const res = await fetch("/api/admin/payment-pages");
        const json = (await res.json()) as { pages?: PaymentPage[]; error?: string };
        if (!res.ok) throw new Error(json.error || "Failed to load pages");
        if (cancelled) return;
        queueMicrotask(() => {
          if (cancelled) return;
          setPages(json.pages ?? []);
        });
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : "Failed to load pages";
        queueMicrotask(() => {
          if (cancelled) return;
          setError(msg);
        });
      } finally {
        queueMicrotask(() => {
          if (cancelled) return;
          setLoading(false);
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xl font-semibold tracking-tight text-zinc-900">Payment Pages</div>
          <div className="mt-1 text-sm text-zinc-500">
            Create, configure, and share Quick Payment Pages.
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/admin/pages/new">
            <Button variant="primary">
              <Plus className="h-4 w-4" />
              New page
            </Button>
          </Link>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <Card className="bg-white/80 backdrop-blur">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm font-semibold text-zinc-900">All pages</div>
          <div className="relative w-full sm:w-[340px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input placeholder="Search pages…" className="pl-10" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-t border-zinc-200 bg-zinc-50/70">
                <tr className="text-xs font-medium text-zinc-600">
                  <th className="px-5 py-3">Page</th>
                  <th className="px-5 py-3">Slug</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Updated</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200">
                {loading ? (
                  <tr className="bg-white/60">
                    <td className="px-5 py-6 text-zinc-600" colSpan={5}>
                      Loading…
                    </td>
                  </tr>
                ) : pages.length === 0 ? (
                  <tr className="bg-white/60">
                    <td className="px-5 py-6 text-zinc-600" colSpan={5}>
                      No pages yet.
                    </td>
                  </tr>
                ) : (
                  pages.map((p) => (
                    <tr key={p.id} className="bg-white/60">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-9 w-9 rounded-2xl border border-zinc-200 bg-white shadow-sm"
                            style={{ boxShadow: `0 0 0 3px ${p.brandColor}22` }}
                            aria-hidden="true"
                          />
                          <div>
                            <div className="font-semibold text-zinc-900">{p.title}</div>
                            <div className="text-xs text-zinc-500">{p.subtitle}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs text-zinc-700">/pay/{p.slug}</span>
                      </td>
                      <td className="px-5 py-4">
                        {p.isActive ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="warning">Disabled</Badge>
                        )}
                      </td>
                      <td className="px-5 py-4 text-zinc-600">
                        {new Date(p.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Link href={`/pay/${p.slug}`}>
                            <Button variant="secondary" size="sm">
                              View
                            </Button>
                          </Link>
                          <Link href={`/admin/pages/${p.slug}`}>
                            <Button variant="primary" size="sm">
                              Edit
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

