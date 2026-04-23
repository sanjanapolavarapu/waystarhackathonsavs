"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OrgSwitcher } from "@/components/org-switcher";
import { getSupabaseClient } from "@/lib/supabase";
import { setSelectedOrgId } from "@/lib/org";

function extractOrgId(value: unknown) {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";
  const v = value as Record<string, unknown>;
  const candidate =
    (typeof v.id === "string" && v.id) ||
    (typeof v.org_id === "string" && v.org_id) ||
    (typeof v.organization_id === "string" && v.organization_id) ||
    "";
  return candidate;
}

export default function NewOrganizationPage() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-4 flex justify-end">
        <OrgSwitcher />
      </div>
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <div className="text-xl font-semibold tracking-tight text-zinc-900">
            Create organization
          </div>
          <div className="mt-1 text-sm text-zinc-500">
            Make an organization for a business (you’ll be the owner).
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-600" htmlFor="org_name">
              Organization name
            </label>
            <Input
              id="org_name"
              placeholder="e.g., Acme Consulting LLC"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              variant="primary"
              type="button"
              disabled={loading}
              onClick={async () => {
                const supabase = getSupabaseClient();
                if (!supabase) {
                  setError("Supabase isn’t configured.");
                  return;
                }
                const { data: sessionData } = await supabase.auth.getSession();
                if (!sessionData.session) {
                  setError("Your session expired. Please sign in again.");
                  router.replace("/admin/login");
                  return;
                }
                if (!name.trim()) {
                  setError("Name is required.");
                  return;
                }
                setLoading(true);
                setError(null);
                try {
                  const { data, error } = await supabase
                    .rpc("create_organization", { org_name: name.trim() })
                    .single();
                  if (error) {
                    setError(error.message);
                    return;
                  }
                  let orgId = extractOrgId(data);
                  if (!orgId) {
                    // Fallback: query most recent membership.
                    const { data: membershipRows } = await supabase
                      .from("organization_members")
                      .select("organization_id")
                      .order("created_at", { ascending: false })
                      .limit(1);
                    orgId =
                      typeof membershipRows?.[0]?.organization_id === "string"
                        ? membershipRows[0].organization_id
                        : "";
                  }
                  if (!orgId) {
                    setError("Organization created, but could not select it yet. Please refresh and try again.");
                    return;
                  }
                  setSelectedOrgId(orgId);
                  router.replace("/admin/pages");
                  router.refresh();
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? "Creating…" : "Create"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

