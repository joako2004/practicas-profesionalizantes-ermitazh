import { requireAdmin } from "@/lib/auth/perfil";
import AdminShell from "./AdminShell";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user } = await requireAdmin();

  return (
    <AdminShell user={user}>
      <div className="h-full px-16 py-12 md:px-20 md:py-16">
        {children}
      </div>
    </AdminShell>
  );
}