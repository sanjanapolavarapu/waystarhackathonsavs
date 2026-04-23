"use client";

import Link from "next/link";
import { Plus, Search } from "lucide-react";
import * as React from "react";

import { listPages } from "@/lib/db";
import type { PaymentPage } from "@/lib/qpp-types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function AdminPagesList() {
  const [pages, setPages] = React.useState<PaymentPage[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");

  React.useEffect(() => {
    let cancelled = false;

    async function loadPages() {
      try {
        setError(null);
        const data = await listPages();
        if (!cancelled) setPages(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load pages.");
          setPages([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPages();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredPages = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pages;
    return pages.filter((p) => {
      const title = String(p.title ?? "").toLowerCase();
      const subtitle = String(p.subtitle ?? "").toLowerCase();
      const slug = String(p.slug ?? "").toLowerCase();
      return title.includes(q) || subtitle.includes(q) || slug.includes(q);
    });
  }, [pages, query]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xl font-semibold tracking-tight text-zinc-900">
            Payment Pages
          </div>
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

      <Card className="bg-white/80 backdrop-blur dark:bg-zinc-950/30">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">All pages</div>
          <div className="relative w-full sm:w-[340px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
            <Input
              placeholder="Search pages…"
              className="pl-10"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="px-5 py-4 text-sm text-red-700 bg-red-50 border-t border-red-200 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
              Couldn’t load pages from Supabase: {error}
            </div>
          ) : null}
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-t border-zinc-200 bg-zinc-50/70 dark:border-zinc-800 dark:bg-zinc-900/30">
                <tr className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                  <th className="px-5 py-3">Page</th>
                  <th className="px-5 py-3">Slug</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Updated</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {loading ? (
                  <tr className="bg-white/60 dark:bg-zinc-950/20">
                    <td className="px-5 py-6 text-zinc-600 dark:text-zinc-300" colSpan={5}>
                      Loading...
                    </td>
                  </tr>
                ) : null}
                {!loading && filteredPages.length === 0 ? (
                  <tr className="bg-white/60 dark:bg-zinc-950/20">
                    <td className="px-5 py-6 text-zinc-600 dark:text-zinc-300" colSpan={5}>
                      {pages.length === 0 ? "No pages yet." : "No matching pages."}
                    </td>
                  </tr>
                ) : null}
                {filteredPages.map((p) => (
                  <tr key={p.id} className="bg-white/60 dark:bg-zinc-950/20">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-9 w-9 rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40"
                          style={{
                            boxShadow: `0 0 0 3px ${(p.brandColor ?? "#6366f1")}22`,
                          }}
                          aria-hidden="true"
                        />
                        <div>
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                            {p.title || "Untitled"}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400">{p.subtitle || ""}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs text-zinc-700 dark:text-zinc-300">
                        /pay/{p.slug}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {p.isActive ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="warning">Disabled</Badge>
                      )}
                    </td>
                    <td className="px-5 py-4 text-zinc-600 dark:text-zinc-300">
                      {p.updatedAt ? new Date(p.updatedAt).toLocaleDateString() : "—"}
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
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="text-xs text-zinc-500 dark:text-zinc-400">
        Showing pages from your configured data source.
      </div>
    </div>
  );
}
