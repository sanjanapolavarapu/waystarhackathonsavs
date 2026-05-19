import { Suspense } from "react";

import { PaySuccessClient } from "./PaySuccessClient";

export default function PaySuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-full bg-background px-6 py-16 text-foreground">
          <div className="mx-auto w-full max-w-md text-sm text-zinc-500">Loading…</div>
        </div>
      }
    >
      <PaySuccessClient />
    </Suspense>
  );
}
