"use client";

import * as React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";

import type { PaymentPage } from "@/lib/qpp-types";
import { getSupabaseClient } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PayClient } from "./PayClient";

function detectDevice() {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

function fmtMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export function PublicPayClient({
  initialPage = null,
}: {
  slug: string;
  initialPage?: PaymentPage | null;
}) {
  const page = initialPage;
  const [logoBroken, setLogoBroken] = React.useState(false);
  const visitRowIdRef = React.useRef<string | null>(null);
  const formStartedSentRef = React.useRef(false);

  React.useEffect(() => {
    queueMicrotask(() => setLogoBroken(false));
  }, [page?.logoUrl]);

  const markVisitFormStarted = React.useCallback(() => {
    if (formStartedSentRef.current) return;
    const visitId = visitRowIdRef.current;
    const supabase = getSupabaseClient();
    if (!visitId || !supabase) return;
    formStartedSentRef.current = true;
    void supabase.from("page_visits").update({ form_started: true }).eq("id", visitId);
  }, []);

  React.useEffect(() => {
    if (!page?.id) return;
    visitRowIdRef.current = null;
    formStartedSentRef.current = false;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    void (async () => {
      try {
        const { data, error } = await supabase
          .from("page_visits")
          .insert({
            page_id: page.id,
            page_slug: page.slug,
            organization_id: page.organizationId ?? null,
            device: detectDevice(),
            form_started: false,
          })
          .select("id")
          .maybeSingle();
        if (!error && data?.id) visitRowIdRef.current = data.id;
      } catch {
        /* silent */
      }
    })();
  }, [page?.id, page?.slug]);

  if (!page) {
    return (
      <div className="min-h-full px-6 py-16">
        <div className="mx-auto max-w-md text-center">
          <div className="text-xl font-semibold text-zinc-900">Page not found</div>
          <div className="mt-2 text-sm text-zinc-500">This payment page doesn’t exist.</div>
          <div className="mt-6 flex justify-center gap-2">
            <Link href="/pay/test">
              <Button variant="secondary">Go to test page</Button>
            </Link>
            <Link href="/admin/pages">
              <Button variant="primary">Admin UI</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!page.isActive) {
    return (
      <div className="min-h-full px-6 py-16">
        <div className="mx-auto max-w-md text-center">
          <div className="text-xl font-semibold text-zinc-900">Page disabled</div>
          <div className="mt-2 text-sm text-zinc-500">
            This payment page is currently unavailable.
          </div>
          <div className="mt-6">
            <Link href="/admin/pages">
              <Button variant="secondary">Back to admin UI</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const amountText =
    page.amountMode === "FIXED"
      ? fmtMoney(page.fixedAmountCents ?? 0)
      : page.amountMode === "RANGE"
        ? `${fmtMoney(page.minAmountCents ?? 0)}–${fmtMoney(page.maxAmountCents ?? 0)}`
        : "Enter amount";

  return (
    <div className="min-h-full bg-[#fbfbff] dark:bg-zinc-950 bg-[radial-gradient(1200px_600px_at_15%_20%,rgba(99,102,241,0.12),transparent_60%),radial-gradient(900px_500px_at_90%_10%,rgba(217,70,239,0.10),transparent_55%)] dark:bg-[radial-gradient(1200px_600px_at_15%_20%,rgba(99,102,241,0.18),transparent_60%),radial-gradient(900px_500px_at_90%_10%,rgba(217,70,239,0.16),transparent_55%)] px-6 py-12">
      <div className="mx-auto w-full max-w-md">
        <div className="flex flex-col items-center">
          <div className="h-14 w-14 shrink-0 rounded-full border border-zinc-200 bg-white shadow-sm grid place-items-center overflow-hidden p-1.5">
            {page.logoUrl && !logoBroken ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={page.logoUrl}
                alt=""
                className="h-full w-full object-contain"
                onError={() => setLogoBroken(true)}
              />
            ) : (
              <div
                className="h-7 w-7 rounded-lg"
                style={{ backgroundColor: page.brandColor }}
                aria-hidden="true"
              />
            )}
          </div>
          <div className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 text-center">
            {page.title}
          </div>
          {page.subtitle ? (
            <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-300 text-center">{page.subtitle}</div>
          ) : null}
        </div>

        <Card className="mt-6 overflow-hidden dark:border-zinc-800">
          <div className="bg-zinc-50 px-6 py-5 border-b border-zinc-200 dark:bg-zinc-900/40 dark:border-zinc-800">
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 text-center">Payment Amount</div>
            <div className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 text-center">
              {amountText}
            </div>
          </div>
          <CardContent className="p-6 space-y-4">
            {page.headerMessage ? (
              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950/30 dark:text-zinc-200">
                {page.headerMessage}
              </div>
            ) : null}

            <PayClient
              pageSlug={page.slug}
              pageTitle={page.title}
              amountMode={page.amountMode}
              fixedAmountCents={page.fixedAmountCents}
              minAmountCents={page.minAmountCents}
              maxAmountCents={page.maxAmountCents}
              fields={page.fields}
              onFormStarted={markVisitFormStarted}
            />

            <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
              <ShieldCheck className="h-4 w-4" />
              Secure, encrypted checkout
            </div>

            {page.footerMessage ? (
              <div className="pt-2 text-xs text-zinc-500 text-center">{page.footerMessage}</div>
            ) : null}
          </CardContent>
        </Card>

        <div className="mt-5 text-center text-xs text-zinc-500 dark:text-zinc-400">
          Powered by Quick Payment Pages ·{" "}
          <Link className="underline underline-offset-4 hover:text-zinc-700" href="/admin/pages">
            Admin UI
          </Link>
        </div>
      </div>
    </div>
  );
}
