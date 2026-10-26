import { requireAdmin } from "@/lib/auth/perfil";
import { prisma } from "@/lib/prisma";
import TarjetaCabana from "./_components/TarjetaCabana";

export default async function FotosAdminPage() {
  await requireAdmin();

  const propiedades = await prisma.propiedad.findMany({
    orderBy: { orden: "asc" },
    select: {
      id: true,
      nombre: true,
      fotos: true,
    },
  });

  const totalFotos = propiedades.reduce(
    (total, propiedad) => total + propiedad.fotos.length,
    0
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-white drop-shadow-sm">
          Fotos de cabañas
        </h2>
        <p className="mt-1 text-sm text-white/85 drop-shadow-sm">
          Elegí una cabaña para ver y administrar sus fotos.
        </p>
        <p className="mt-1 text-sm text-white/85 drop-shadow-sm">
          {totalFotos} {totalFotos === 1 ? "foto" : "fotos"} en{" "}
          {propiedades.length}{" "}
          {propiedades.length === 1 ? "cabaña" : "cabañas"}
        </p>
      </div>

      {propiedades.length === 0 ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center text-sm text-[var(--color-ink)]/60">
          Todavía no hay cabañas cargadas.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {propiedades.map((propiedad) => (
            <TarjetaCabana
              key={propiedad.id}
              id={propiedad.id}
              nombre={propiedad.nombre}
              cantidadFotos={propiedad.fotos.length}
              portadaUrl={propiedad.fotos[0] ?? null}
            />
          ))}
        </div>
      )}
    </div>
  );
}
