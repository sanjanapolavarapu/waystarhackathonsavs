"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { OrgSwitcher } from "@/components/org-switcher";
import { TopTabsNav } from "@/components/top-tabs-nav";
import { ThemeToggle } from "@/components/theme-toggle";

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
          <ThemeToggle className="h-10 w-10 px-0 rounded-lg border border-zinc-200 bg-white/60 backdrop-blur hover:bg-white" />
          <Link className="text-sm font-medium text-zinc-600 hover:text-zinc-900" href="/admin/logout">
            Logout
          </Link>
        </>
      }
    />
  );
}

