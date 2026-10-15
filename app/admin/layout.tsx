import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/auth/perfil";
import AdminShell from "./AdminShell";

const ADMIN_SIDEBAR_COOKIE = "admin-sidebar-open";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user } = await requireAdmin();
  const cookieStore = await cookies();

  const initialDesktopSidebarOpen =
    cookieStore.get(ADMIN_SIDEBAR_COOKIE)?.value !== "closed";

  return (
    <AdminShell
      user={user}
      initialDesktopSidebarOpen={initialDesktopSidebarOpen}
    >
      <div className="h-full px-16 py-12 md:px-20 md:py-16">
        {children}
      </div>
    </AdminShell>
  );
}