import { requireAdmin } from "@/lib/auth/perfil";

export default async function AdminPage() {
  await requireAdmin();
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
      <h2 className="font-heading text-2xl font-semibold text-white md:text-3xl">
        Bienvenido al Panel de Administración
      </h2>
      <p className="mt-2 text-white/80">
        Selecciona una opción del menú lateral para comenzar.
      </p>
    </div>
  );
}