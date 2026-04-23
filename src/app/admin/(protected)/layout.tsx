import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { adminCookieName, isValidAdminSession } from "@/lib/admin-session";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jar = await cookies();
  const token = jar.get(adminCookieName())?.value;
  const ok = token ? await isValidAdminSession(token) : false;
  if (!ok) redirect("/admin/login");
  return children;
}

