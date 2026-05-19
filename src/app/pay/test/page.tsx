import Link from "next/link";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function PayTestPage() {
  return (
    <div className="min-h-full bg-[#fbfbff] bg-[radial-gradient(1200px_600px_at_15%_20%,rgba(99,102,241,0.10),transparent_60%),radial-gradient(900px_500px_at_90%_10%,rgba(217,70,239,0.08),transparent_55%)] px-6 py-14">
      <div className="mx-auto w-full max-w-xl space-y-5">
        <div>
          <div className="text-2xl font-semibold tracking-tight text-zinc-900">
            Test a payment
          </div>
          <div className="mt-2 text-sm text-zinc-600">
            Use this page to simulate what a payer sees. This does not depend on Supabase.
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="text-sm font-semibold text-zinc-900">Choose a test checkout</div>
            <div className="mt-1 text-sm text-zinc-500">
              These link to your live `/pay/[slug]` flow.
            </div>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Link href="/pay/consulting-session" className="w-full">
              <Button variant="primary" className="w-full">
                Fixed amount example
              </Button>
            </Link>
            <Link href="/pay/donation" className="w-full">
              <Button variant="secondary" className="w-full">
                User-entered amount example
              </Button>
            </Link>
          </CardContent>
        </Card>

        <div className="text-xs text-zinc-500">
          Tip: use Stripe test card <span className="font-mono">4242 4242 4242 4242</span>.
        </div>
      </div>
    </div>
  );
}

