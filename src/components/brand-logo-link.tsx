import Link from "next/link";

import { BrandLogoMark } from "@/components/brand-logo-mark";
import { cn } from "@/lib/utils";

export function BrandLogoLink({
  className,
  showTitle = true,
  subtitle,
}: {
  className?: string;
  showTitle?: boolean;
  subtitle?: string;
}) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-3 rounded-2xl outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-indigo-500/40",
        className,
      )}
      aria-label="Back to Quick Payment Pages home"
    >
      <span className="h-10 w-10 shrink-0 rounded-2xl border border-zinc-200/80 bg-white p-1 shadow-sm grid place-items-center dark:border-zinc-800/70 dark:bg-zinc-950/40">
        <BrandLogoMark className="h-full w-full" decorative />
      </span>
      {showTitle ? (
        <span className="min-w-0 text-left">
          <span className="block text-sm font-semibold tracking-tight text-heading">
            Quick Payment Pages
          </span>
          {subtitle ? (
            <span className="block text-xs text-subheading">{subtitle}</span>
          ) : null}
        </span>
      ) : null}
    </Link>
  );
}
