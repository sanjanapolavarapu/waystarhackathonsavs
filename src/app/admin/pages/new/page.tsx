"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { savePage } from "@/lib/db";
import type { PaymentPage } from "@/lib/qpp-types";

export default function NewPageUi() {
  const router = useRouter();
  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleCreatePage() {
    const safeTitle = title.trim();
    const safeSlug = slug.trim().toLowerCase();
    if (!safeTitle || !safeSlug) {
      setError("Title and slug are required.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      const page: PaymentPage = {
        id: crypto.randomUUID(),
        slug: safeSlug,
        isActive: true,
        title: safeTitle,
        subtitle: "",
        brandColor: "#0EA5E9",
        headerMessage: "",
        footerMessage: "",
        amountMode: "FIXED",
        fixedAmountCents: 0,
        glCodes: [],
        emailSubjectTemplate: "",
        emailBodyTemplate: "",
        fields: [],
        createdAt: now,
        updatedAt: now,
      };

      const created = await savePage(page);
      router.push(`/admin/pages/${created.slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create page.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Card className="auth-card admin-data-card border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950/40">
        <CardHeader>
          <div className="text-xl font-semibold tracking-tight text-heading">Create a new payment page</div>
          <div className="mt-1 text-sm text-subheading">
            Create a new payment page and start editing immediately.
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-subheading" htmlFor="title">
              Page title
            </label>
            <Input
              id="title"
              className="admin-search-input"
              placeholder="e.g., Consulting Session"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-subheading" htmlFor="slug">
              URL slug
            </label>
            <Input
              id="slug"
              className="admin-search-input"
              placeholder="e.g., consulting-session"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
            <div className="text-xs text-subheading">
              Becomes <span className="font-mono text-heading">/pay/&lt;slug&gt;</span>
            </div>
          </div>
          {error ? (
            <div className="text-sm text-red-600 dark:text-red-300" role="alert">
              {error}
            </div>
          ) : null}
          <div className="flex items-center justify-between pt-2">
            <Link
              href="/admin/pages"
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
            >
              Cancel
            </Link>
            <Button variant="primary" type="button" onClick={handleCreatePage} disabled={saving}>
              {saving ? "Creating..." : "Create page"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
