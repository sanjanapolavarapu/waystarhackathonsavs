"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function DeletePaymentPageDialog({
  open,
  pageTitle,
  pageSlug,
  deleting = false,
  error = null,
  onClose,
  onConfirm,
}: {
  open: boolean;
  pageTitle: string;
  pageSlug: string;
  deleting?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  const [confirmWord, setConfirmWord] = React.useState("");

  React.useEffect(() => {
    if (!open) setConfirmWord("");
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleting) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, deleting, onClose]);

  if (!open) return null;

  const label = pageTitle.trim() || pageSlug;
  const canDelete = confirmWord.trim().toUpperCase() === "DELETE";

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-page-dialog-title"
      onClick={() => {
        if (!deleting) onClose();
      }}
    >
      <div
        className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950"
        onClick={(e) => e.stopPropagation()}
      >
        <div id="delete-page-dialog-title" className="text-lg font-semibold text-heading">
          Delete payment page?
        </div>
        <p className="mt-2 text-sm text-subheading">
          <span className="font-semibold text-heading">{label}</span> and its public link{" "}
          <span className="font-mono text-zinc-800 dark:text-zinc-200">/pay/{pageSlug}</span> will be
          removed permanently. This cannot be undone.
        </p>

        <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900/40">
          <div className="text-xs font-medium text-subheading">Page slug</div>
          <div className="mt-1 font-mono text-sm text-zinc-800 dark:text-zinc-100">{pageSlug}</div>
        </div>

        <div className="mt-4 space-y-2">
          <label htmlFor="delete-page-confirm" className="text-xs font-medium text-subheading">
            Type <span className="font-mono text-heading">DELETE</span> to confirm
          </label>
          <Input
            id="delete-page-confirm"
            value={confirmWord}
            onChange={(e) => setConfirmWord(e.target.value)}
            placeholder="DELETE"
            autoComplete="off"
            disabled={deleting}
          />
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" disabled={deleting} onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={!canDelete || deleting}
            className="border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-300 dark:hover:bg-red-500/20"
            onClick={() => void onConfirm()}
          >
            {deleting ? "Deleting…" : "Delete page"}
          </Button>
        </div>
      </div>
    </div>
  );
}
