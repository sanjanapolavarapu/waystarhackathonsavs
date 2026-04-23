import Link from "next/link";
import { notFound } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { getPageBySlug } from "@/lib/mock-qpp";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function fmtMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function PublicPayPage({ params }: { params: { slug: string } }) {
  const page = getPageBySlug(params.slug);
  if (!page) return notFound();
  if (!page.isActive) {
    return (
      <div className="min-h-screen px-6 py-16">
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
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_15%_20%,rgba(14,165,233,0.10),transparent_60%),radial-gradient(900px_500px_at_90%_10%,rgba(16,185,129,0.10),transparent_55%)] px-6 py-12">
      <div className="mx-auto w-full max-w-md">
        <div className="flex flex-col items-center">
          <div className="h-14 w-14 rounded-full border border-zinc-200 bg-white shadow-sm grid place-items-center">
            <div
              className="h-7 w-7 rounded-lg"
              style={{ backgroundColor: page.brandColor }}
              aria-hidden="true"
            />
          </div>
          <div className="mt-4 text-2xl font-semibold tracking-tight text-zinc-900 text-center">
            {page.title}
          </div>
          {page.subtitle ? (
            <div className="mt-1 text-sm text-zinc-500 text-center">{page.subtitle}</div>
          ) : null}
        </div>

        <Card className="mt-6 overflow-hidden bg-white/80 backdrop-blur">
          <div className="bg-zinc-50 px-6 py-5 border-b border-zinc-200">
            <div className="text-xs font-medium text-zinc-500 text-center">Payment Amount</div>
            <div className="mt-1 text-3xl font-semibold tracking-tight text-zinc-900 text-center">
              {amountText}
            </div>
          </div>
          <CardContent className="p-6 space-y-4">
            {page.headerMessage ? (
              <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700">
                {page.headerMessage}
              </div>
            ) : null}

            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              {page.fields
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((f) => (
                  <div key={f.id} className="space-y-2">
                    <label className="text-xs font-medium text-zinc-600" htmlFor={f.id}>
                      {f.label} {f.required ? <span className="text-red-600">*</span> : null}
                    </label>
                    <Input
                      id={f.id}
                      placeholder={f.placeholder || ""}
                      aria-required={f.required}
                    />
                    {f.helperText ? (
                      <div className="text-xs text-zinc-500">{f.helperText}</div>
                    ) : null}
                  </div>
                ))}

              <div className="space-y-2">
                <div className="text-xs font-medium text-zinc-600">Card Information</div>
                <Input placeholder="1234 5678 9012 3456" inputMode="numeric" />
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="MM / YY" inputMode="numeric" />
                  <Input placeholder="CVC" inputMode="numeric" />
                </div>
                <Input placeholder="Billing ZIP" inputMode="numeric" />
              </div>

              <Button variant="primary" className="w-full" type="submit">
                Complete Payment (UI)
              </Button>
              <div className="flex items-center justify-center gap-2 text-xs text-zinc-500">
                <ShieldCheck className="h-4 w-4" />
                Secure, encrypted checkout UI
              </div>
            </form>

            {page.footerMessage ? (
              <div className="pt-2 text-xs text-zinc-500 text-center">{page.footerMessage}</div>
            ) : null}
          </CardContent>
        </Card>

        <div className="mt-5 text-center text-xs text-zinc-500">
          Powered by ClearCare Pay ·{" "}
          <Link className="underline underline-offset-4 hover:text-zinc-700" href="/admin/pages">
            Admin UI
          </Link>
        </div>
      </div>
    </div>
  );
}
