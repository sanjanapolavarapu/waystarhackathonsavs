"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, LayoutGrid } from "lucide-react";

import { BrandLogoLink } from "@/components/brand-logo-link";
import { primaryButtonClassName } from "@/lib/primary-button-styles";
import { cn } from "@/lib/utils";

type Tab = {
  href: string;
  label: string;
  icon: ReactNode;
  isActive: (pathname: string) => boolean;
};

const TABS: Tab[] = [
  {
    href: "/admin/pages",
    label: "Pages",
    icon: <LayoutGrid className="h-4 w-4" />,
    isActive: (pathname) => pathname.startsWith("/admin/pages") || pathname === "/",
  },
  {
    href: "/admin/reports",
    label: "Reports",
    icon: <BarChart3 className="h-4 w-4" />,
    isActive: (pathname) => pathname.startsWith("/admin/reports"),
  },
];

export function TopTabsNav({
  subtitle,
  actions,
}: {
  subtitle: string;
  actions?: React.ReactNode;
}) {
  const pathname = usePathname() ?? "/";
  // TEMP: org gating disabled (hackathon mode)

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <BrandLogoLink subtitle={subtitle} />

      <div className="flex items-center justify-between gap-3 md:justify-end">
        <div className="admin-tab-nav inline-flex items-center gap-1 rounded-2xl border border-zinc-200 bg-white p-1 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40">
          {TABS.map((tab) => {
            const active = tab.isActive(pathname);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "admin-tab-link inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
                  active
                    ? cn("admin-tab-link-active", primaryButtonClassName)
                    : "admin-tab-link-inactive text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-900/40 dark:hover:text-zinc-100",
                )}
              >
                {tab.icon}
                {tab.label}
              </Link>
            );
          })}
        </div>

        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
