"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { BrandLogoLink } from "@/components/brand-logo-link";
import { OrgSwitcher } from "@/components/org-switcher";
import { TopTabsNav } from "@/components/top-tabs-nav";
import { ThemeToggle } from "@/components/theme-toggle";

const themeToggleClassName =
  "admin-theme-toggle h-10 w-10 px-0 rounded-lg border border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-200 dark:hover:bg-zinc-900/60";

export function AdminHeader() {
  const pathname = usePathname() ?? "";

  const isAuthShell =
    pathname === "/admin/login" ||
    pathname === "/admin/signup" ||
    pathname === "/admin/logout";

  if (isAuthShell) {
    return (
      <div className="flex items-center justify-between gap-3">
        <BrandLogoLink />
        <ThemeToggle className={themeToggleClassName} />
      </div>
    );
  }

  return (
    <TopTabsNav
      subtitle="Admin Portal"
      actions={
        <>
          <OrgSwitcher />
          <ThemeToggle className={themeToggleClassName} />
          <Link
            className="text-sm font-medium text-subheading hover:text-heading"
            href="/admin/logout"
          >
            Logout
          </Link>
        </>
      }
    />
  );
}

