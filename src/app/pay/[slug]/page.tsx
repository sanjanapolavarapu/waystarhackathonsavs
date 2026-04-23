import { PublicPayClient } from "./PublicPayClient";

export default async function PublicPayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PublicPayClient slug={slug} />;
}
