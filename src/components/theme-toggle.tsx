"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  // Avoid hydration mismatch: theme comes from client-side storage/media query.
  const [hydrated, setHydrated] = React.useState(false);
  React.useEffect(() => setHydrated(true), []);
  const stableTheme = hydrated ? theme : "dark";
  const label = stableTheme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  return (
    <Button
      type="button"
      variant="ghost"
      className={className}
      aria-label={hydrated ? label : "Toggle theme"}
      title={hydrated ? label : "Toggle theme"}
      onClick={toggle}
    >
      {stableTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}

