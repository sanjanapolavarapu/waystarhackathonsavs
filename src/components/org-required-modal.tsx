"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getSelectedOrgId } from "@/lib/org";

export function OrgRequiredModal() {
  const pathname = usePathname() ?? "";
  const orgSelected = Boolean(getSelectedOrgId());

  const isAdmin = pathname.startsWith("/admin");
  const isAuth = pathname === "/admin/login" || pathname === "/admin/signup";
  const isOrgMgmt = pathname.startsWith("/admin/orgs");

  const shouldShow = isAdmin && !isAuth && !isOrgMgmt && !orgSelected;
  if (!shouldShow) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Organization required"
    >
      <Card className="w-full max-w-lg bg-white/90 backdrop-blur">
        <CardHeader>
          <div className="text-lg font-semibold tracking-tight text-zinc-900">
            Join or create an organization
          </div>
          <div className="mt-1 text-sm text-zinc-600">
            To view Pages and Reports, you need to be in an organization.
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Link className="w-full" href="/admin/orgs/new">
              <Button className="w-full" variant="primary">
                Create organization
              </Button>
            </Link>
            <Link className="w-full" href="/admin/orgs/join">
              <Button className="w-full" variant="secondary">
                Join with code
              </Button>
            </Link>
          </div>
          <div className="text-xs text-zinc-500">
            If your company admin gave you an invite code, use “Join with code”.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

