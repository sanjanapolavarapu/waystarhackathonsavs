"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { getSelectedOrgId, SELECTED_ORG_CHANGED_EVENT } from "@/lib/org";
import { Button } from "@/components/ui/button";

export function OrgRequiredModal() {
  const pathname = usePathname() ?? "";
  const [orgId, setOrgId] = React.useState<string | null>(() => getSelectedOrgId());

  React.useEffect(() => {
    const onChange = () => setOrgId(getSelectedOrgId());
    window.addEventListener(SELECTED_ORG_CHANGED_EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(SELECTED_ORG_CHANGED_EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  // Don't block auth + org management screens.
  if (
    pathname === "/admin/login" ||
    pathname === "/admin/signup" ||
    pathname.startsWith("/admin/orgs")
  ) {
    return null;
  }

  if (orgId) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Organization required"
    >
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white/90 p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950/70">
        <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Select an organization to continue
        </div>
        <div className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Payment pages are scoped to an organization. Create one, or join using an invite code.
        </div>

        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Link href="/admin/orgs/new" className="block">
            <Button variant="primary" className="w-full">
              Create org
            </Button>
          </Link>
          <Link href="/admin/orgs/join" className="block">
            <Button variant="secondary" className="w-full">
              Join w/ code
            </Button>
          </Link>
        </div>

        <div className="mt-3">
          <Link
            href="/admin/orgs/invites"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-200"
          >
            View invite codes
          </Link>
        </div>
      </div>
    </div>
  );
}

