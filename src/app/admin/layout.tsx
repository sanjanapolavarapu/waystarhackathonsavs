import Link from "next/link";
import { BarChart3, LayoutGrid, Settings2 } from "lucide-react";

import { cn } from "@/lib/utils";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_15%_20%,rgba(14,165,233,0.10),transparent_60%),radial-gradient(900px_500px_at_90%_10%,rgba(16,185,129,0.10),transparent_55%)]">
      <div className="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white border border-zinc-200/80 shadow-sm grid place-items-center">
              <div className="h-5 w-5 rounded-lg bg-sky-600" />
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-900 tracking-tight">
                ClearCare Pay
              </div>
              <div className="text-xs text-zinc-500">Admin Portal</div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 md:justify-end">
            <div className="inline-flex items-center gap-1 rounded-2xl border border-zinc-200 bg-white/80 backdrop-blur p-1 shadow-sm">
              <AdminNavLink href="/admin/pages" icon={<LayoutGrid className="h-4 w-4" />}>
                Pages
              </AdminNavLink>
              <AdminNavLink href="/admin/reports" icon={<BarChart3 className="h-4 w-4" />}>
                Reports
              </AdminNavLink>
              <AdminNavLink href="/" icon={<Settings2 className="h-4 w-4" />}>
                Builder Demo
              </AdminNavLink>
            </div>

            <Link
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
              href="/admin/login"
            >
              Login UI
            </Link>
          </div>
        </div>

        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}

function AdminNavLink({
  href,
  icon,
  children,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-zinc-700 hover:text-zinc-900 hover:bg-zinc-50",
      )}
    >
      {icon}
      {children}
    </Link>
  );
}
