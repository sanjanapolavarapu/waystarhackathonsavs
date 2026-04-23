import { Suspense } from "react";

import { PaySuccessClient } from "./PaySuccessClient";

export default function PaySuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fbfbff] px-6 py-16 flex items-center justify-center text-sm text-zinc-500">
          Loading…
        </div>
      }
    >
      <PaySuccessClient />
    </Suspense>
  );
}
