"use client";

import Link from "next/link";
import { Plus, Search } from "lucide-react";
import * as React from "react";

import { getSupabaseClient } from "@/lib/supabase";
import { getSelectedOrgId } from "@/lib/org";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default function AdminPagesList() {
  const [pages, setPages] = React.useState<
    {
      id: string;
      title: string | null;
      subtitle: string | null;
      slug: string;
      is_active: boolean | null;
      brand_color: string | null;
      updated_at: string | null;
    }[]
  >([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    const supabase = getSupabaseClient();
    const orgId = getSelectedOrgId();

    if (!supabase || !orgId) {
      setPages([]);
      return;
    }

    void (async () => {
      setError(null);
      const { data, error } = await supabase
        .from("payment_pages")
        .select("id, title, subtitle, slug, is_active, brand_color, updated_at")
        .eq("organization_id", orgId)
        .order("updated_at", { ascending: false });

      if (!mounted) return;
      if (error) {
        setError(error.message);
        setPages([]);
        return;
      }
      setPages((data as typeof pages) ?? []);
    })();

    return () => {
      mounted = false;
    };
  }, []);

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

      <Card className="bg-white/80 backdrop-blur">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm font-semibold text-zinc-900">All pages</div>
          <div className="relative w-full sm:w-[340px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <Input placeholder="Search pages…" className="pl-10" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="px-5 py-4 text-sm text-red-700 bg-red-50 border-t border-red-200">
              Couldn’t load pages from Supabase: {error}
            </div>
          ) : null}
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
                {pages.map((p) => (
                  <tr key={p.id} className="bg-white/60">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-9 w-9 rounded-2xl border border-zinc-200 bg-white shadow-sm"
                          style={{
                            boxShadow: `0 0 0 3px ${(p.brand_color ?? "#6366f1")}22`,
                          }}
                          aria-hidden="true"
                        />
                        <div>
                          <div className="font-semibold text-zinc-900">
                            {p.title ?? "Untitled"}
                          </div>
                          <div className="text-xs text-zinc-500">{p.subtitle ?? ""}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs text-zinc-700">
                        /pay/{p.slug}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {p.is_active ? (
                        <Badge variant="success">Active</Badge>
                      ) : (
                        <Badge variant="warning">Disabled</Badge>
                      )}
                    </td>
                    <td className="px-5 py-4 text-zinc-600">
                      {p.updated_at ? new Date(p.updated_at).toLocaleDateString() : "—"}
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

      <div className="text-xs text-zinc-500">Showing pages for the currently selected organization.</div>
    </div>
  );
}
