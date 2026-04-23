"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, LayoutGrid } from "lucide-react";

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
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-white border border-zinc-200/80 shadow-sm grid place-items-center dark:bg-zinc-950/40 dark:border-zinc-800/70">
          <div className="h-5 w-5 rounded-lg bg-indigo-600" />
        </div>
        <div>
          <div className="text-sm font-semibold text-black tracking-tight dark:text-white">
            Quick Payment Pages
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-300">{subtitle}</div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 md:justify-end">
        <div className="inline-flex items-center gap-1 rounded-2xl border border-zinc-200 bg-white/80 backdrop-blur p-1 shadow-sm dark:border-zinc-800 dark:bg-zinc-950/30">
          {TABS.map((tab) => {
            const active = tab.isActive(pathname);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-zinc-50 text-zinc-900 shadow-sm dark:bg-zinc-950/50 dark:text-zinc-100"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:text-zinc-100 dark:hover:bg-zinc-900/40",
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
