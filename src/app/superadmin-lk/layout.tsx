import { AdminShell } from "@/components/admin/admin-shell";

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
