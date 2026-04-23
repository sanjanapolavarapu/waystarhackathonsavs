"use client";

import * as React from "react";

type Theme = "light" | "dark";
type ThemeSetting = Theme | "system";

const STORAGE_KEY = "qpp_theme";

function getSystemTheme(): Theme {
  if (typeof window === "undefined") return "light";
  return window.matchMedia?.("(prefers-color-scheme: dark)")?.matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
}

type ThemeContextValue = {
  theme: Theme;
  setting: ThemeSetting;
  setSetting: (next: ThemeSetting) => void;
  toggle: () => void;
};

const ThemeContext = React.createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [setting, setSetting] = React.useState<ThemeSetting>(() => {
    if (typeof window === "undefined") return "system";
    try {
      return (window.localStorage.getItem(STORAGE_KEY) as ThemeSetting | null) ?? "system";
    } catch {
      return "system";
    }
  });

  const resolvedTheme: Theme = React.useMemo(
    () => (setting === "system" ? getSystemTheme() : setting),
    [setting],
  );

  React.useEffect(() => {
    queueMicrotask(() => applyTheme(resolvedTheme));
    try {
      window.localStorage.setItem(STORAGE_KEY, setting);
    } catch {
      // ignore
    }

    const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mql || setting !== "system") return;
    const onChange = () => queueMicrotask(() => applyTheme(getSystemTheme()));
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, [resolvedTheme, setting]);

  const theme = resolvedTheme;

  const value = React.useMemo<ThemeContextValue>(
    () => ({
      theme,
      setting,
      setSetting,
      toggle: () => setSetting((s) => (s === "dark" ? "light" : "dark")),
    }),
    [setting, theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = React.useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}

