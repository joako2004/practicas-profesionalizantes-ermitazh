import { cookies } from "next/headers";
import { requireAdmin } from "@/lib/auth/perfil";
import Header, { type Sesion } from "@/components/public/Header";
import Footer from "@/components/public/Footer";
import AdminShell from "./AdminShell";

const ADMIN_SIDEBAR_COOKIE = "admin-sidebar-open";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user, perfil } = await requireAdmin();
  const cookieStore = await cookies();

  const initialDesktopSidebarOpen =
    cookieStore.get(ADMIN_SIDEBAR_COOKIE)?.value !== "closed";

  const sesion: Sesion = {
    email: user.email,
    esAdmin: perfil.rol === "ADMIN",
  };

  return (
    <AdminShell
      initialDesktopSidebarOpen={initialDesktopSidebarOpen}
      header={<Header sesion={sesion} contexto="admin" />}
      footer={<Footer />}
    >
      {children}
    </AdminShell>
  );
}
