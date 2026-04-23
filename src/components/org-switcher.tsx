"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

import { getSupabaseClient } from "@/lib/supabase";
import type { Organization } from "@/lib/org";
import { getSelectedOrgId, setSelectedOrgId } from "@/lib/org";
import { cn } from "@/lib/utils";

type OrgRow = {
  organization_id: string;
  organizations: { id: string; name: string } | { id: string; name: string }[] | null;
};

export function OrgSwitcher({ className }: { className?: string }) {
  const router = useRouter();

  const [orgs, setOrgs] = React.useState<Organization[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(() => getSelectedOrgId());
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    void (async () => {
      const { data, error } = await supabase
        .from("organization_members")
        .select("organization_id, organizations:organization_id ( id, name )")
        .order("created_at", { ascending: false });

      if (!mounted) return;
      if (error) {
        setOrgs([]);
        return;
      }

      const rows = (data as unknown as OrgRow[] | null) ?? [];
      const next = rows
        .flatMap((r) => {
          const o = r.organizations;
          if (!o) return [];
          return Array.isArray(o) ? o : [o];
        })
        .filter((o): o is { id: string; name: string } => Boolean(o?.id));

      setOrgs(next);

      // pick a default if none selected
      if (!selectedId && next.length > 0) {
        setSelectedId(next[0].id);
        setSelectedOrgId(next[0].id);
        router.refresh();
      }
    })();

    return () => {
      mounted = false;
    };
  }, [router, selectedId]);

  const selected = orgs.find((o) => o.id === selectedId) ?? null;

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 items-center gap-2 rounded-2xl border border-zinc-200 bg-white/80 px-3 text-sm font-medium text-zinc-800 shadow-sm hover:bg-white"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="max-w-[180px] truncate">
          {selected ? selected.name : orgs.length ? "Select organization" : "No organizations"}
        </span>
        <ChevronDown className="h-4 w-4 text-zinc-500" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg"
        >
          {orgs.length ? (
            <div className="py-1">
              {orgs.map((o) => {
                const active = o.id === selectedId;
                return (
                  <button
                    key={o.id}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setSelectedId(o.id);
                      setSelectedOrgId(o.id);
                      setOpen(false);
                      router.refresh();
                    }}
                    className={cn(
                      "flex w-full items-center justify-between px-3 py-2 text-left text-sm",
                      active ? "bg-indigo-50 text-indigo-900" : "text-zinc-800 hover:bg-zinc-50",
                    )}
                  >
                    <span className="truncate">{o.name}</span>
                    {active ? <span className="text-xs font-semibold">Active</span> : null}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-3 py-2 text-sm text-zinc-600">
              You’re not in any organizations yet. Create one or join with a code below.
            </div>
          )}

          <div className="border-t border-zinc-200 bg-zinc-50/60 p-2">
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/admin/orgs/new"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-center text-sm font-medium text-zinc-800 hover:bg-zinc-50"
              >
                Create org
              </Link>
              <Link
                href="/admin/orgs/join"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-center text-sm font-medium text-zinc-800 hover:bg-zinc-50"
              >
                Join w/ code
              </Link>
            </div>
            <Link
              href="/admin/orgs/invites"
              onClick={() => setOpen(false)}
              className="mt-2 block rounded-xl border border-zinc-200 bg-white px-3 py-2 text-center text-sm font-medium text-zinc-800 hover:bg-zinc-50"
            >
              Invite codes
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

