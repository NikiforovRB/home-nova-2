import { AdminShell } from "@/components/admin/admin-shell";
import { SiteFooter, SiteHeader } from "@/components/site";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <AdminShell>{children}</AdminShell>
      <SiteFooter />
    </>
  );
}
