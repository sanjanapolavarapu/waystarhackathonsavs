import { getPublicPaymentPage } from "@/lib/get-public-payment-page";

import { PublicPayClient } from "./PublicPayClient";

/** Public pay UI (client) records `page_visits` with device + `form_started` for analytics. */

export default async function PublicPayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const initialPage = await getPublicPaymentPage(slug);
  return <PublicPayClient slug={slug} initialPage={initialPage} />;
}
