import Link from "next/link";
import { notFound } from "next/navigation";

import { getPageBySlug } from "@/lib/mock-qpp";
import { PaymentForm } from "@/components/pay/payment-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

  return (
    <div className="min-h-screen bg-[#fbfbff] bg-[radial-gradient(1200px_600px_at_15%_20%,rgba(99,102,241,0.12),transparent_60%),radial-gradient(900px_500px_at_90%_10%,rgba(217,70,239,0.10),transparent_55%)] px-6 py-12">
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
          <CardContent className="p-0">
            <PaymentForm page={page} />
          </CardContent>
        </Card>

        <div className="mt-5 text-center text-xs text-zinc-500">
          Powered by Quick Payment Pages ·{" "}
          <Link className="underline underline-offset-4 hover:text-zinc-700" href="/admin/pages">
            Admin UI
          </Link>
        </div>
      </div>
    </div>
  );
}
