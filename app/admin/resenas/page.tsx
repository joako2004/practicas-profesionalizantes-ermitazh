import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/perfil";
import ResenaFila from "./_components/ResenaFila";

const fechaFmt = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "America/Argentina/Buenos_Aires",
});

export default async function ResenasAdminPage() {
  await requireAdmin();
  const resenas = await prisma.resena.findMany({
    orderBy: [{ publicada: "asc" }, { creadaEn: "desc" }],
    select: {
      id: true,
      autor: true,
      texto: true,
      puntuacion: true,
      publicada: true,
      creadaEn: true,
      propiedad: { select: { nombre: true } },
    },
  });

  const items = resenas.map((r) => ({
    id: r.id,
    autor: r.autor,
    texto: r.texto,
    puntuacion: r.puntuacion,
    publicada: r.publicada,
    cabana: r.propiedad.nombre,
    fecha: fechaFmt.format(r.creadaEn),
  }));
  const pendientes = items.filter((r) => !r.publicada);
  const publicadas = items.filter((r) => r.publicada);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-white drop-shadow-sm">
          Moderación de reseñas
        </h2>
        <p className="mt-1 text-sm text-white/85 drop-shadow-sm">
          {pendientes.length} pendiente{pendientes.length !== 1 ? "s" : ""} ·{" "}
          {publicadas.length} publicada{publicadas.length !== 1 ? "s" : ""}
        </p>
      </div>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-white drop-shadow-sm">
          Pendientes
        </h3>
        {pendientes.length === 0 ? (
          <div className="rounded-lg border border-desert-sand/20 bg-white p-8 text-center text-sm text-dark-pine/60">
            No hay reseñas pendientes de moderación.
          </div>
        ) : (
          pendientes.map((r) => <ResenaFila key={r.id} {...r} />)
        )}
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-white drop-shadow-sm">
          Publicadas
        </h3>
        {publicadas.length === 0 ? (
          <div className="rounded-lg border border-desert-sand/20 bg-white p-8 text-center text-sm text-dark-pine/60">
            No hay reseñas publicadas.
          </div>
        ) : (
          publicadas.map((r) => <ResenaFila key={r.id} {...r} />)
        )}
      </section>
    </div>
  );
}
