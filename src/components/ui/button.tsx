import * as React from "react";

import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
};

export function Button({
  className,
  variant = "secondary",
  size = "md",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
        size === "sm" ? "h-9 px-3 text-sm" : "h-10 px-4 text-sm",
        variant === "primary" &&
          "text-white shadow-sm bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-700 hover:to-fuchsia-700",
        variant === "secondary" &&
          "bg-white text-zinc-900 border border-zinc-200 hover:bg-zinc-50 shadow-sm",
        variant === "secondary" &&
          "dark:bg-zinc-950/40 dark:text-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-950/60",
        variant === "ghost" && "bg-transparent hover:bg-zinc-100 text-zinc-800",
        variant === "ghost" && "dark:text-zinc-200 dark:hover:bg-zinc-900/40",
        className,
      )}
      {...props}
    />
  );
}

