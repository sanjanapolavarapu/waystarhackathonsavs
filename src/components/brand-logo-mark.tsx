"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/** Gradient link mark — matches primary button indigo → fuchsia. */
export function BrandLogoMark({
  className,
  title = "Quick Payment Pages",
  decorative = false,
}: {
  className?: string;
  title?: string;
  /** When true, hides from assistive tech (e.g. inside a labeled link). */
  decorative?: boolean;
}) {
  const gradientId = React.useId().replace(/:/g, "");

  return (
    <svg
      className={cn("shrink-0", className)}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={decorative ? undefined : "img"}
      aria-hidden={decorative ? true : undefined}
      aria-label={decorative ? undefined : title}
    >
      {!decorative ? <title>{title}</title> : null}
      <defs>
        <linearGradient
          id={gradientId}
          x1="6"
          y1="4"
          x2="26"
          y2="28"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#4f46e5" />
          <stop offset="1" stopColor="#c026d3" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#${gradientId})`} />
      <path
        d="M11.5 14.5a3.5 3.5 0 0 1 4.95-4.95l1.2 1.2M20.5 17.5a3.5 3.5 0 0 1-4.95 4.95l-1.2-1.2M13.8 18.2l4.4-4.4M17.8 14.2l-4.4 4.4"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
