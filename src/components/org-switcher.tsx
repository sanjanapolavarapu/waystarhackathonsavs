"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";

import { getSupabaseClient } from "@/lib/supabase";
import type { Organization } from "@/lib/org";
import {
  getSelectedOrgDisplayName,
  getSelectedOrgId,
  SELECTED_ORG_CHANGED_EVENT,
  setSelectedOrgId,
} from "@/lib/org";
import { cn } from "@/lib/utils";

type OrgRow = {
  organization_id: string;
  organizations: { id: string; name: string } | { id: string; name: string }[] | null;
};

export function OrgSwitcher({ className }: { className?: string }) {
  const router = useRouter();

  const [orgs, setOrgs] = React.useState<Organization[]>([]);
  // Avoid reading from storage during SSR/first render (causes hydration mismatch).
  const [hydrated, setHydrated] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);

  const loadOrgs = React.useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const currentSelected = getSelectedOrgId();

    const { data, error } = await supabase
      .from("organization_members")
      .select("organization_id, organizations:organization_id ( id, name )")
      .order("created_at", { ascending: false });

    if (error) {
      setOrgs([]);
      return;
    }

    const rows = (data as unknown as OrgRow[] | null) ?? [];
    let next = rows
      .flatMap((r) => {
        const o = r.organizations;
        if (!o) return [];
        return Array.isArray(o) ? o : [o];
      })
      .filter((o): o is { id: string; name: string } => Boolean(o?.id));

    // De-dupe by id (multiple membership rows / odd embed shapes).
    next = [...new Map(next.map((o) => [o.id, o])).values()];

    // If the nested embed didn’t return rows (RLS) but we have a selected org id, load it directly.
    if (currentSelected && !next.some((o) => o.id === currentSelected)) {
      const { data: lone } = await supabase
        .from("organizations")
        .select("id,name")
        .eq("id", currentSelected)
        .maybeSingle();
      if (lone?.id && lone.name) {
        next = [...next, { id: lone.id, name: lone.name }];
      }
    }

    setOrgs(next);

    // Only clear selection when we successfully loaded a non-empty list and the id is missing.
    if (currentSelected && next.length > 0 && !next.some((o) => o.id === currentSelected)) {
      setSelectedId(null);
      setSelectedOrgId("");
      router.refresh();
      return;
    }

    // Default to first org when nothing selected.
    if (!currentSelected && next.length > 0) {
      setSelectedId(next[0].id);
      setSelectedOrgId(next[0].id, next[0].name);
      router.refresh();
    }
  }, [router]);

  React.useEffect(() => {
    setSelectedId(getSelectedOrgId());
    setHydrated(true);
    void loadOrgs();
  }, [loadOrgs]);

  React.useEffect(() => {
    const sync = () => {
      setSelectedId(getSelectedOrgId());
      void loadOrgs();
    };
    window.addEventListener(SELECTED_ORG_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SELECTED_ORG_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [loadOrgs]);

  const selected = orgs.find((o) => o.id === selectedId) ?? null;
  const storedName = hydrated ? getSelectedOrgDisplayName() : null;
  const resolvedName =
    selected?.name ??
    (selectedId && storedName ? storedName : null) ??
    (selectedId ? "Organization" : null);

  const buttonLabel =
    resolvedName ?? (hydrated ? (orgs.length > 0 ? "Select organization" : "No organizations") : "Select organization");

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-10 items-center gap-2 rounded-2xl border border-zinc-200 bg-white/80 px-3 text-sm font-medium text-zinc-800 shadow-sm hover:bg-white dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-100 dark:hover:bg-zinc-950/60"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="max-w-[180px] truncate">{buttonLabel}</span>
        <ChevronDown className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
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
                      setSelectedOrgId(o.id, o.name);
                      setOpen(false);
                      router.refresh();
                    }}
                    className={cn(
                      "flex w-full items-center justify-between px-3 py-2 text-left text-sm",
                      active
                        ? "bg-indigo-50 text-indigo-900 dark:bg-indigo-500/15 dark:text-indigo-100"
                        : "text-zinc-800 hover:bg-zinc-50 dark:text-zinc-200 dark:hover:bg-zinc-900/50",
                    )}
                  >
                    <span className="truncate">{o.name}</span>
                    {active ? <span className="text-xs font-semibold">Active</span> : null}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-3 py-2 text-sm text-zinc-600 dark:text-zinc-300">
              You’re not in any organizations yet. Create one or join with a code below.
            </div>
          )}

          <div className="border-t border-zinc-200 bg-zinc-50/60 p-2 dark:border-zinc-800 dark:bg-zinc-900/40">
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/admin/orgs/new"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-center text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-100 dark:hover:bg-zinc-900/60"
              >
                Create org
              </Link>
              <Link
                href="/admin/orgs/join"
                onClick={() => setOpen(false)}
                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-center text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-100 dark:hover:bg-zinc-900/60"
              >
                Join w/ code
              </Link>
            </div>
            <Link
              href="/admin/orgs/invites"
              onClick={() => setOpen(false)}
              className="mt-2 block rounded-xl border border-zinc-200 bg-white px-3 py-2 text-center text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-100 dark:hover:bg-zinc-900/60"
            >
              Invite codes
            </Link>
            {selectedId ? (
              <Link
                href="/admin/orgs/delete"
                onClick={() => setOpen(false)}
                className="mt-2 block rounded-xl border border-red-200 bg-white px-3 py-2 text-center text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200 dark:hover:bg-red-500/15"
              >
                Delete organization…
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
