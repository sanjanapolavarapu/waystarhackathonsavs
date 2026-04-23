"use client";

import Link from "next/link";
import * as React from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getSupabaseClient } from "@/lib/supabase";
import { getSelectedOrgId } from "@/lib/org";

export default function NewPageUi() {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <div className="text-xl font-semibold tracking-tight text-zinc-900">
            Create a new payment page
          </div>
          <div className="mt-1 text-sm text-zinc-500">
            Creates a page under the currently selected organization.
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-600" htmlFor="title">
              Page title
            </label>
            <Input
              id="title"
              placeholder="e.g., Consulting Session"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-600" htmlFor="slug">
              URL slug
            </label>
            <Input
              id="slug"
              placeholder="e.g., consulting-session"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
            <div className="text-xs text-zinc-500">
              Becomes <span className="font-mono">/pay/&lt;slug&gt;</span>
            </div>
          </div>
          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}
          <div className="flex items-center justify-between pt-2">
            <Link href="/admin/pages" className="text-sm text-zinc-600 hover:text-zinc-900">
              Cancel
            </Link>
            <Button
              variant="primary"
              type="button"
              disabled={loading}
              onClick={async () => {
                const supabase = getSupabaseClient();
                const orgId = getSelectedOrgId();
                if (!supabase) {
                  setError("Supabase isn’t configured.");
                  return;
                }
                if (!orgId) {
                  setError("Select an organization first (top right).");
                  return;
                }
                if (!title.trim() || !slug.trim()) {
                  setError("Title and slug are required.");
                  return;
                }
                setLoading(true);
                setError(null);
                try {
                  const { data, error } = await supabase
                    .from("payment_pages")
                    .insert({
                      organization_id: orgId,
                      title: title.trim(),
                      slug: slug.trim(),
                      is_active: true,
                    })
                    .select("slug")
                    .single();

                  if (error) {
                    setError(error.message);
                    return;
                  }
                  router.replace(`/admin/pages/${data?.slug ?? slug.trim()}`);
                  router.refresh();
                } finally {
                  setLoading(false);
                }
              }}
            >
              {loading ? "Creating…" : "Create page"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

