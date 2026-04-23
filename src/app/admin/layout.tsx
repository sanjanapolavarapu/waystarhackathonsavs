import { AdminHeader } from "@/components/admin-header";
import { OrgRequiredModal } from "@/components/org-required-modal";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fbfbff] bg-[radial-gradient(1200px_600px_at_15%_20%,rgba(99,102,241,0.12),transparent_60%),radial-gradient(900px_500px_at_90%_10%,rgba(217,70,239,0.10),transparent_55%)]">
      <div className="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6">
        <AdminHeader />
        <OrgRequiredModal />

        <div className="mt-6">{children}</div>
      </div>
    </div>
  );
}
