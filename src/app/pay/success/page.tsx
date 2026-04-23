import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function PaySuccessPage() {
  return (
    <div className="min-h-screen bg-[#fbfbff] px-6 py-16">
      <div className="mx-auto w-full max-w-md">
        <Card className="bg-white/80 backdrop-blur">
          <CardHeader>
            <div className="text-xl font-semibold tracking-tight text-zinc-900">
              Payment successful
            </div>
            <div className="mt-1 text-sm text-zinc-500">
              Thanks — you can safely close this tab.
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link href="/">
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

