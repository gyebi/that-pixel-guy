

import { AdminShell } from "@/components/admin-shell";
import { AdminSessionMonitor } from "@/components/admin-session-monitor";
import { requireAdmin } from "@/lib/auth/require-admin";

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <>
      <AdminSessionMonitor
        absoluteExpiresAt={admin.absoluteExpiresAt.toISOString()}
        idleExpiresAt={admin.idleExpiresAt.toISOString()}
      />
      <AdminShell>{children}</AdminShell>
    </>
  );
}
