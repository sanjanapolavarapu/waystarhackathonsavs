import Link from "next/link";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function PaySuccessPage() {
  return (
    <React.Suspense
      fallback={<div className="min-h-screen bg-background text-foreground px-6 py-16" />}
    >
      <PaySuccessClient />
    </React.Suspense>
  );
}

function PaySuccessClient() {
  return (
    <div className="min-h-screen bg-background text-foreground px-6 py-16">
      <div className="mx-auto w-full max-w-md">
        <Card className="bg-white/80 backdrop-blur dark:bg-zinc-950/30">
          <CardHeader>
            <div className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Payment successful
            </div>
            <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-300">
              Thanks — you can safely close this tab.
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link href="/admin/pages">
              <Button variant="primary" className="w-full">
                Back to dashboard
              </Button>
            </Link>
            <Link href="/admin/reports">
              <Button variant="secondary" className="w-full">
                View reports
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

