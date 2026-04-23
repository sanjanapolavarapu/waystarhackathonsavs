"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, LayoutGrid, Settings2 } from "lucide-react";

import { cn } from "@/lib/utils";

type Tab = {
  href: string;
  label: string;
  icon: React.ReactNode;
  isActive: (pathname: string) => boolean;
};

const TABS: Tab[] = [
  {
    href: "/",
    label: "Builder",
    icon: <Settings2 className="h-4 w-4" />,
    isActive: (pathname) => pathname === "/",
  },
  {
    href: "/admin/pages",
    label: "Pages",
    icon: <LayoutGrid className="h-4 w-4" />,
    isActive: (pathname) => pathname.startsWith("/admin/pages"),
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

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-white border border-zinc-200/80 shadow-sm grid place-items-center">
          <div className="h-5 w-5 rounded-lg bg-indigo-600" />
        </div>
        <div>
          <div className="text-sm font-semibold text-zinc-900 tracking-tight">
            Quick Payment Pages
          </div>
          <div className="text-xs text-zinc-500">{subtitle}</div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 md:justify-end">
        <div className="inline-flex items-center gap-1 rounded-2xl border border-zinc-200 bg-white/80 backdrop-blur p-1 shadow-sm">
          {TABS.map((tab) => {
            const active = tab.isActive(pathname);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-zinc-50 text-zinc-900 shadow-sm"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50",
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

