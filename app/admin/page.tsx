import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { logout } from "@/app/login/actions";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-dvh bg-champagne-pink">
      <header className="border-b border-desert-sand/20 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <h1 className="text-xl font-semibold tracking-tight text-dark-pine">
            Panel de Administración
          </h1>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-btn border border-desert-sand/40 px-4 py-2 text-sm font-medium text-dark-pine/70 transition-all hover:border-desert-sand hover:text-dark-pine active:scale-[0.97]"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <p className="text-sm text-dark-pine/50">
          Conectado como <span className="font-medium text-dark-pine">{user.email}</span>
        </p>
      </main>
    </div>
  );
}
