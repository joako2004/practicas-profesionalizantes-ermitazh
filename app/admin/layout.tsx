import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminShell from "./AdminShell";

const ADMIN_SIDEBAR_COOKIE = "admin-sidebar-open";

async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [user, cookieStore] = await Promise.all([getUser(), cookies()]);

  if (!user) {
    redirect("/login");
  }

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