export function getPublicBaseUrl() {
  const envBase = process.env.NEXT_PUBLIC_BASE_URL?.trim();
  if (envBase) return envBase.replace(/\/+$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

export function buildPublicPayUrl(slug: string) {
  const base = getPublicBaseUrl();
  const path = `/pay/${encodeURIComponent(slug)}`;
  return base ? `${base}${path}` : path;
}

