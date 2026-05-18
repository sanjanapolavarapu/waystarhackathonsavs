import * as React from "react";

import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "neutral" | "success" | "warning" | "danger";
}) {
  return (
    <span
      data-badge-variant={variant}
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium",
        variant === "neutral" &&
          "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/40 dark:text-zinc-200",
        variant === "success" &&
          "border-violet-300 bg-violet-100 text-violet-900 font-semibold dark:border-violet-500/40 dark:bg-violet-950/60 dark:text-violet-100",
        variant === "warning" &&
          "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-200",
        variant === "danger" &&
          "border-red-200 bg-red-50 text-red-700 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-200",
        className,
      )}
      {...props}
    />
  );
}

