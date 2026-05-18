"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { OrgSwitcher } from "@/components/org-switcher";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getSelectedOrgId, setSelectedOrgId } from "@/lib/org";
import { getSupabaseClient } from "@/lib/supabase";

type OrgRow = {
  organization_id: string;
  organizations: { id: string; name: string } | { id: string; name: string }[] | null;
};

async function selectRemainingOrg(
  supabase: NonNullable<ReturnType<typeof getSupabaseClient>>,
  deletedOrgId: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("organization_members")
    .select("organization_id, organizations:organization_id ( id, name )")
    .order("created_at", { ascending: false });

  if (error) return false;

  const rows = (data as unknown as OrgRow[] | null) ?? [];
  const orgs = rows
    .flatMap((r) => {
      const o = r.organizations;
      if (!o) return [];
      return Array.isArray(o) ? o : [o];
    })
    .filter((o): o is { id: string; name: string } => Boolean(o?.id));

  const remaining = [...new Map(orgs.map((o) => [o.id, o])).values()].filter(
    (o) => o.id !== deletedOrgId,
  );

  if (remaining.length === 0) {
    setSelectedOrgId("");
    return false;
  }

  setSelectedOrgId(remaining[0].id, remaining[0].name);
  return true;
}

export default function DeleteOrganizationPage() {
  const router = useRouter();
  const [orgName, setOrgName] = React.useState<string>("");
  const [confirmName, setConfirmName] = React.useState("");
  const [confirmWord, setConfirmWord] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    const supabase = getSupabaseClient();
    const orgId = getSelectedOrgId();
    if (!supabase || !orgId) return;

    void (async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", orgId)
        .maybeSingle();
      if (!mounted) return;
      if (error) return;
      setOrgName(data?.name ?? "");
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const orgId = getSelectedOrgId();
  const canDelete =
    orgId &&
    orgName &&
    confirmName.trim() === orgName.trim() &&
    confirmWord.trim().toUpperCase() === "DELETE";

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-4 flex justify-end">
        <OrgSwitcher />
      </div>

      <Card className="bg-white/80 backdrop-blur border-red-200">
        <CardHeader>
          <div className="text-xl font-semibold tracking-tight text-zinc-900">
            Delete organization
          </div>
          <div className="mt-1 text-sm text-zinc-600">
            This will remove the organization and access for its members. This action can’t be
            undone.
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!orgId ? (
            <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700">
              Select an organization first.
            </div>
          ) : null}

          <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
            <div className="text-xs font-medium text-zinc-600">Selected organization</div>
            <div className="mt-1 text-sm font-semibold text-zinc-900">
              {orgName || "—"}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-600" htmlFor="confirm_name">
              Type the organization name to confirm
            </label>
            <Input
              id="confirm_name"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={orgName ? `Type “${orgName}”` : "Type the org name"}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-600" htmlFor="confirm_word">
              Type <span className="font-mono">DELETE</span> to confirm
            </label>
            <Input
              id="confirm_word"
              value={confirmWord}
              onChange={(e) => setConfirmWord(e.target.value)}
              placeholder="DELETE"
            />
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="flex items-center justify-between pt-2">
            <Link href="/admin/pages" className="text-sm text-zinc-600 hover:text-zinc-900">
              Cancel
            </Link>
            <Button
              variant="secondary"
              className="border-red-200 text-red-700 hover:bg-red-50"
              disabled={!canDelete || loading}
              onClick={async () => {
                const supabase = getSupabaseClient();
                const orgId = getSelectedOrgId();
                if (!supabase) {
                  setError("Supabase isn’t configured.");
                  return;
                }
                if (!orgId) {
                  setError("Select an organization first.");
                  return;
                }
                if (!canDelete) {
                  setError("Double confirmation is required.");
                  return;
                }

                setLoading(true);
                setError(null);
                try {
                  const { error } = await supabase.rpc("delete_organization", { org_id: orgId });
                  if (error) {
                    setError(error.message);
                    return;
                  }

                  // Switch to another org if the user still has memberships; otherwise
                  // clear selection so OrgRequiredModal prompts create/join on /admin/pages.
                  await selectRemainingOrg(supabase, orgId);
                  router.replace("/admin/pages");
                  router.refresh();
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? "Deleting…" : "Delete organization"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

