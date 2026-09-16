import { prisma } from "@/lib/prisma";
import PropiedadCard from "./_components/PropiedadCard";

export default async function PropiedadesPage() {
  const propiedades = await prisma.propiedad.findMany({
    orderBy: { creadaEn: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-dark-pine">Gestión de Propiedades</h2>
          <p className="mt-1 text-sm text-dark-pine/50">
            {propiedades.length} propiedad{propiedades.length !== 1 ? "es" : ""} registrada{propiedades.length !== 1 ? "s" : ""}
          </p>
        </div>
        <a
          href="/admin/propiedades/new"
          className="inline-flex items-center gap-2 rounded-btn bg-toasted-brown px-4 py-2 text-sm font-medium text-white transition-all hover:bg-toasted-brown/90 active:scale-[0.97]"
        >
          <span>+</span> Nueva propiedad
        </a>
      </div>

      {propiedades.length === 0 ? (
        <div className="rounded-lg border border-desert-sand/20 bg-white p-12 text-center">
          <div className="mb-4 text-4xl">🏠</div>
          <h3 className="text-lg font-medium text-dark-pine">No hay propiedades registradas</h3>
          <p className="mt-1 text-sm text-dark-pine/50">
            Crea tu primera propiedad para empezar a gestionar el catálogo.
          </p>
          <a
            href="/admin/propiedades/new"
            className="mt-4 inline-flex items-center gap-2 rounded-btn bg-toasted-brown px-4 py-2 text-sm font-medium text-white transition-all hover:bg-toasted-brown/90"
          >
            Crear propiedad
          </a>
        </div>
      ) : (
        <div className="space-y-4">
          {propiedades.map((propiedad) => (
            <PropiedadCard
              key={propiedad.id}
              propiedad={{
                ...propiedad,
                precioBase: Number(propiedad.precioBase) as any,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}