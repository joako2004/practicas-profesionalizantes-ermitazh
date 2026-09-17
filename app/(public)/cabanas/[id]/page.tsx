import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { buildReservaWhatsApp } from "@/lib/config";

const precioFormatter = new Intl.NumberFormat("es-AR", {
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
  const tieneFotos = propiedad.fotos.length > 0;

  return (
    <section className="mx-auto max-w-5xl px-6 py-12 md:py-16">
      <Link
        href="/#cabanas"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-[var(--color-ink)]/60 transition-colors hover:text-[var(--color-ink)]"
      >
        ← Volver a cabañas
      </Link>

      <div className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight text-[var(--color-ink)] md:text-4xl">
          {propiedad.nombre}
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-[var(--color-ink)]/60">
          <span>
            Hasta {propiedad.capacidad}{" "}
            {propiedad.capacidad === 1 ? "huésped" : "huéspedes"}
          </span>
          <span className="text-lg font-semibold text-[var(--color-accent)]">
            Desde {precioFormatter.format(precioBase)}
            <span className="text-sm font-normal text-[var(--color-ink)]/50">
              {" "}/ noche
            </span>
          </span>
        </div>
      </div>

      {tieneFotos ? (
        <div className="mb-10 grid gap-4 sm:grid-cols-2">
          {propiedad.fotos.map((url, i) => (
            <div
              key={i}
              className={`card-photo relative overflow-hidden rounded-[var(--radius-lg)] ${
                i === 0 ? "sm:col-span-2" : ""
              }`}
            >
              <img
                src={url}
                alt={`Foto ${i + 1} de ${propiedad.nombre}`}
                className="h-full w-full object-cover"
              />
              <div className="card-photo-overlay absolute inset-0" />
            </div>
          ))}
        </div>
      ) : (
        <div className="mb-10 aspect-video rounded-[var(--radius-lg)] bg-[var(--color-warm)]/30" />
      )}

      <div className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-[var(--color-ink)]">
          Sobre esta cabaña
        </h2>
        <p className="text-base leading-relaxed text-[var(--color-ink)]/70">
          {propiedad.descripcion}
        </p>
      </div>

      {propiedad.servicios.length > 0 && (
        <div className="mb-10">
          <h2 className="mb-3 text-lg font-semibold text-[var(--color-ink)]">
            Servicios
          </h2>
          <div className="flex flex-wrap gap-2">
            {propiedad.servicios.map((servicio) => (
              <span
                key={servicio}
                className="rounded-[var(--radius-sm)] bg-[var(--color-bg)] px-3 py-1.5 text-sm text-[var(--color-ink)]/70"
              >
                {servicio}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6">
        <h2 className="mb-2 text-lg font-semibold text-[var(--color-ink)]">
          Reservar
        </h2>
        <p className="mb-4 text-sm text-[var(--color-ink)]/60">
          Consultá disponibilidad y precios por WhatsApp.
        </p>
        <a
          href={buildReservaWhatsApp(propiedad.nombre)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] px-5 py-3 text-sm font-medium text-white transition-all hover:bg-[var(--color-accent)]/90 active:scale-[0.97]"
        >
          Reservar por WhatsApp
        </a>
      </div>
    </section>
  );
}
