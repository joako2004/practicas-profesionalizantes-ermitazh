import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import CabinGallery from "@/components/public/CabinGallery";
import PriceCalculator from "@/components/public/PriceCalculator";

const precioFmt = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

async function getPropiedad(id: string) {
  const propiedad = await prisma.propiedad.findUnique({
    where: { id },
    select: {
      id: true,
      nombre: true,
      descripcion: true,
      capacidad: true,
      precioBase: true,
      fotos: true,
      servicios: true,
    },
  });
  return propiedad;
}

export default async function CabanaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const propiedad = await getPropiedad(id);

  if (!propiedad) {
    notFound();
  }

  const precioBase = propiedad.precioBase.toNumber();

  return (
    <section className="mx-auto max-w-5xl px-6 py-12 md:py-16">
      <Link
        href="/#cabanas"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-[var(--color-ink)]/60 transition-colors hover:text-[var(--color-ink)]"
      >
        ← Volver a cabañas
      </Link>

      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-ink)] md:text-4xl">
          {propiedad.nombre}
        </h1>
        <span className="text-lg font-semibold text-[var(--color-accent)]">
          Desde {precioFmt.format(precioBase)}
          <span className="text-sm font-normal text-[var(--color-ink)]/50">
            {" "}/ noche
          </span>
        </span>
      </div>

      <CabinGallery fotos={propiedad.fotos} nombre={propiedad.nombre} />

      <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-8">
          <div>
            <h2 className="mb-2 text-lg font-semibold text-[var(--color-ink)]">
              Sobre esta cabaña
            </h2>
            <p className="text-base leading-relaxed text-[var(--color-ink)]/70">
              {propiedad.descripcion}
            </p>
          </div>

          <div>
            <h2 className="mb-2 text-lg font-semibold text-[var(--color-ink)]">
              Capacidad
            </h2>
            <p className="text-sm text-[var(--color-ink)]/70">
              Hasta {propiedad.capacidad}{" "}
              {propiedad.capacidad === 1 ? "huésped" : "huéspedes"}
            </p>
          </div>

          {propiedad.servicios.length > 0 && (
            <div>
              <h2 className="mb-2 text-lg font-semibold text-[var(--color-ink)]">
                Servicios
              </h2>
              <div className="flex flex-wrap gap-2">
                {propiedad.servicios.map((s) => (
                  <span
                    key={s}
                    className="rounded-[var(--radius-sm)] bg-[var(--color-bg)] px-3 py-1.5 text-sm text-[var(--color-ink)]/70"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <PriceCalculator
            propiedadId={propiedad.id}
            nombre={propiedad.nombre}
            capacidad={propiedad.capacidad}
          />
        </aside>
      </div>
    </section>
  );
}
