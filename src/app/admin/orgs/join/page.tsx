"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OrgSwitcher } from "@/components/org-switcher";
import { getSupabaseClient } from "@/lib/supabase";
import { setSelectedOrgId } from "@/lib/org";

export default function JoinOrganizationPage() {
  const router = useRouter();
  const [code, setCode] = React.useState("");
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
            Join an organization
          </div>
          <div className="mt-1 text-sm text-zinc-500">
            Paste the invite code from your organization admin.
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-600" htmlFor="invite_code">
              Invite code
            </label>
            <Input
              id="invite_code"
              placeholder="e.g., QPP-7F2K9A"
              value={code}
              onChange={(e) => setCode(e.target.value)}
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
                if (!code.trim()) {
                  setError("Invite code is required.");
                  return;
                }
                setLoading(true);
                setError(null);
                try {
                  const { data, error } = await supabase
                    .rpc("accept_invite", { invite_code: code.trim() })
                    .single();

                  if (error) {
                    setError(error.message);
                    return;
                  }
                  const orgId = String(data ?? "");
                  if (orgId) setSelectedOrgId(orgId);
                  router.replace("/admin/pages");
                  router.refresh();
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? "Joining…" : "Join"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

