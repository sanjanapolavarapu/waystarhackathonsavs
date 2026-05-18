/** PostgREST `.or()` for `transactions` (no `page_slug` column — scope by org + `page_id` only). */
export function buildTransactionOrgScope(organizationId: string, pageIds: string[]): string {
  const parts = [`organization_id.eq.${organizationId}`];
  if (pageIds.length) {
    parts.push(`page_id.in.(${pageIds.join(",")})`);
  }
  return parts.join(",");
}

/** PostgREST `.or()` for `transactions` across multiple orgs (scope by org + `page_id`). */
export function buildTransactionMultiOrgScope(organizationIds: string[], pageIds: string[]): string {
  const parts: string[] = [];
  if (organizationIds.length) {
    parts.push(`organization_id.in.(${organizationIds.join(",")})`);
  }
  if (pageIds.length) {
    parts.push(`page_id.in.(${pageIds.join(",")})`);
  }
  // If empty, this will return no rows once used with `.or()`.
  return parts.join(",");
}

/** PostgREST `.or()` for `page_visits` (may have `page_slug` + `page_id`). */
export function buildPageVisitsOrgScope(
  organizationId: string,
  pageIds: string[],
  slugs: string[],
): string {
  const parts = [`organization_id.eq.${organizationId}`];
  if (pageIds.length) {
    parts.push(`page_id.in.(${pageIds.join(",")})`);
  }
  if (slugs.length) {
    parts.push(`page_slug.in.(${slugs.join(",")})`);
  }
  return parts.join(",");
}

/** PostgREST `.or()` for `page_visits` across multiple orgs. */
export function buildPageVisitsMultiOrgScope(
  organizationIds: string[],
  pageIds: string[],
  slugs: string[],
): string {
  const parts: string[] = [];
  if (organizationIds.length) {
    parts.push(`organization_id.in.(${organizationIds.join(",")})`);
  }
  if (pageIds.length) {
    parts.push(`page_id.in.(${pageIds.join(",")})`);
  }
  if (slugs.length) {
    parts.push(`page_slug.in.(${slugs.join(",")})`);
  }
  return parts.join(",");
}
