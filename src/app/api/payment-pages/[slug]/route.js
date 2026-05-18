import { NextResponse } from "next/server";

import { getPublicPaymentPage } from "@/lib/get-public-payment-page";

// Public read-only endpoint for pay pages.
export async function GET(_req, { params }) {
  const { slug } = await params;
  const page = await getPublicPaymentPage(slug);

  if (!page) {
    return NextResponse.json({ page: null }, { status: 404 });
  }

  return NextResponse.json({ page });
}
