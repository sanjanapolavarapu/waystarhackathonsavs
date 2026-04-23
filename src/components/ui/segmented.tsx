import * as React from "react";

import { cn } from "@/lib/utils";

type Option = { id: string; label: string };

export function Segmented({
  options,
  value,
  onChange,
  className,
}: {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex rounded-xl border border-zinc-200 bg-zinc-50 p-1 shadow-sm",
        className,
      )}
      role="tablist"
      aria-label="Segmented control"
    >
      {options.map((opt) => {
        const active = opt.id === value;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={cn(
              "h-9 px-4 rounded-lg text-sm font-medium transition-colors",
              active
                ? "bg-white text-zinc-900 shadow-sm"
                : "text-zinc-600 hover:text-zinc-900",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

