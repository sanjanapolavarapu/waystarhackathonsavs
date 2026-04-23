"use client";

import * as React from "react";
import Link from "next/link";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OrgSwitcher } from "@/components/org-switcher";
import { copyTextToClipboard } from "@/lib/clipboard";
import { getSupabaseClient } from "@/lib/supabase";
import { getSelectedOrgId } from "@/lib/org";

export default function InviteCodesPage() {
  const [role, setRole] = React.useState("member");
  const [maxUses, setMaxUses] = React.useState("1");
  const [inviteCode, setInviteCode] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  return (
    <div className="mx-auto w-full max-w-lg">
      <div className="mb-4 flex justify-end">
        <OrgSwitcher />
      </div>
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <div className="text-xl font-semibold tracking-tight text-zinc-900">Invite codes</div>
          <div className="mt-1 text-sm text-zinc-500">
            Generate a code so teammates can join your selected organization.
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-600" htmlFor="role">
              Role
            </label>
            <Input
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="member (or finance, admin, etc.)"
            />
            <div className="text-xs text-zinc-500">
              Keep it simple for now (e.g. <span className="font-mono">member</span>).
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-600" htmlFor="max_uses">
              Max uses
            </label>
            <Input
              id="max_uses"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              inputMode="numeric"
              placeholder="1"
            />
          </div>

          {inviteCode ? (
            <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
              <div className="text-xs font-medium text-zinc-600">New invite code</div>
              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="font-mono text-sm text-zinc-900">{inviteCode}</div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={async () => {
                        const res = await copyTextToClipboard(inviteCode);
                    if (!res.ok) {
                      setError("Could not copy. Please select and copy manually.");
                      return;
                    }
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1200);
                  }}
                >
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="flex items-center justify-between pt-2">
            <Link href="/admin/pages" className="text-sm text-zinc-600 hover:text-zinc-900">
              Back
            </Link>
            <Button
              variant="primary"
              type="button"
              disabled={loading}
              onClick={async () => {
                const supabase = getSupabaseClient();
                const orgId = getSelectedOrgId();
                if (!supabase) {
                  setError("Supabase isn’t configured.");
                  return;
                }
                const { data: sessionData } = await supabase.auth.getSession();
                if (!sessionData.session) {
                  setError("Your session expired. Please sign in again.");
                  return;
                }
                if (!orgId) {
                  setError("Select an organization first (top right).");
                  return;
                }
                setLoading(true);
                setError(null);
                setInviteCode(null);
                try {
                  const { data, error } = await supabase
                    .rpc("create_invite", {
                      invite_role: role.trim() || "member",
                      max_uses: Number(maxUses || "1"),
                      org_id: orgId,
                    })
                    .single();
                  if (error) {
                    setError(error.message);
                    return;
                  }
                  setInviteCode(String(data ?? ""));
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? "Generating…" : "Generate code"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

