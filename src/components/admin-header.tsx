"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { OrgSwitcher } from "@/components/org-switcher";
import { TopTabsNav } from "@/components/top-tabs-nav";

export function AdminHeader() {
  const pathname = usePathname() ?? "";

  // Keep auth pages clean (no tabs/org switcher visible).
  if (pathname === "/admin/login" || pathname === "/admin/signup") return null;

  return (
    <TopTabsNav
      subtitle="Admin Portal"
      actions={
        <>
          <OrgSwitcher />
          <Link className="text-sm font-medium text-zinc-600 hover:text-zinc-900" href="/admin/logout">
            Logout
          </Link>
        </>
      }
    />
  );
}

