import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminShell from "./AdminShell";

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
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  return <AdminShell user={user}>{children}</AdminShell>;
}