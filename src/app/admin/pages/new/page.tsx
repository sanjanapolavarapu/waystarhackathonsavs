import Link from "next/link";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NewPageUi() {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <Card className="bg-white/80 backdrop-blur">
        <CardHeader>
          <div className="text-xl font-semibold tracking-tight text-zinc-900">
            Create a new payment page
          </div>
          <div className="mt-1 text-sm text-zinc-500">
            UI-only — your teammates can wire this to DB later.
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-600" htmlFor="title">
              Page title
            </label>
            <Input id="title" placeholder="e.g., Consulting Session" />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-600" htmlFor="slug">
              URL slug
            </label>
            <Input id="slug" placeholder="e.g., consulting-session" />
            <div className="text-xs text-zinc-500">
              Becomes <span className="font-mono">/pay/&lt;slug&gt;</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <Link href="/admin/pages" className="text-sm text-zinc-600 hover:text-zinc-900">
              Cancel
            </Link>
            <Button variant="primary" type="button">
              Create page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

