"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { getSupabaseClient } from "@/lib/supabase";

export default function AdminLogoutPage() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    async function logout() {
      try {
        await fetch("/api/auth/logout", { method: "POST" });
        const supabase = getSupabaseClient();
        if (supabase) await supabase.auth.signOut();
        if (!cancelled) {
          router.replace("/");
          router.refresh();
        }
      } catch {
        if (!cancelled) setError("Could not sign out. Please try again.");
      }
    }

    void logout();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-96px)] items-center justify-center px-4 text-center text-sm text-red-600 dark:text-red-300">
        {error}
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-96px)] items-center justify-center text-sm text-subheading">
      Signing out…
    </div>
  );
}
