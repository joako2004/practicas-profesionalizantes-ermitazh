import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { serializarPropiedad, obtenerPreciosUsd } from "@/lib/serializers";
import { obtenerContextoPrecios, precioUnaNocheArs } from "@/lib/precios/contexto";
import CabinGallery from "@/components/public/CabinGallery";
import BlurredBackground from "@/components/public/BlurredBackground";
import PriceCalculator from "@/components/public/PriceCalculator";
import ResenaForm from "@/components/public/ResenaForm";
import ResenasLista from "@/components/public/ResenasLista";
import { obterUsuarioActual } from "@/lib/auth/perfil";
import { obtenerImagenFondoHero } from "@/lib/galeria";

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
      precioNocheAltaUsd: true,
      precioNocheBajaUsd: true,
      precio2a6AltaUsd: true,
      precio2a6BajaUsd: true,
      promoSemanalAlta: true,
      promoSemanalBaja: true,
      fotos: true,
      servicios: true,
      activa: true,
    },
  });
  return propiedad;
}

async function getResenas(propiedadId: string) {
  const where = { propiedadId, publicada: true };
  const [resenas, resumen] = await Promise.all([
    prisma.resena.findMany({
      where,
      orderBy: { creadaEn: "desc" },
      take: 20,
      select: {
        id: true,
        autor: true,
        texto: true,
        puntuacion: true,
        creadaEn: true,
      },
    }),
    prisma.resena.aggregate({
      where,
      _avg: { puntuacion: true },
      _count: { _all: true },
    }),
  ]);
  return {
    resenas,
    promedio: resumen._avg.puntuacion,
    total: resumen._count._all,
  };
}

async function haySesion(): Promise<boolean> {
  try {
    const usuario = await obterUsuarioActual();
    return usuario !== null;
  } catch {
    return false;
  }
}

export default async function CabanaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [propiedad, contextoPrecios, imagenFondo] = await Promise.all([
    getPropiedad(id),
    obtenerContextoPrecios(),
    obtenerImagenFondoHero(),
  ]);

  if (!propiedad) {
    notFound();
  }

  const precioDesdeArs = precioUnaNocheArs(
    obtenerPreciosUsd(serializarPropiedad(propiedad)),
    contextoPrecios
  );
  const autenticado = await haySesion();
  const { resenas, promedio, total } = await getResenas(id);

  return (
    <>
      <BlurredBackground src={imagenFondo} />
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
          {precioDesdeArs === null ? (
            <span className="text-lg font-semibold text-[var(--color-accent)]">
              Consultar
            </span>
          ) : (
            <div className="text-right">
              <span className="block text-xs font-medium text-[var(--color-ink)]/50">
                Noches a partir de:
              </span>
              <span className="block text-lg font-semibold whitespace-nowrap text-[var(--color-accent)]">
                {precioFmt.format(precioDesdeArs)}
              </span>
            </div>
          )}
        </div>

        <CabinGallery fotos={propiedad.fotos} nombre={propiedad.nombre} />

        <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0 space-y-6 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white/85 p-6 shadow-sm backdrop-blur-sm">
            <div>
              <h2 className="mb-1.5 text-lg font-semibold text-[var(--color-ink)]">
                Sobre esta cabaña
              </h2>
              <p className="text-sm leading-relaxed text-[var(--color-ink)]/70">
                {propiedad.descripcion}
              </p>
            </div>

            <div>
              <h2 className="mb-1.5 text-lg font-semibold text-[var(--color-ink)]">
                Capacidad
              </h2>
              <p className="text-sm text-[var(--color-ink)]/70">
                Hasta {propiedad.capacidad}{" "}
                {propiedad.capacidad === 1 ? "huésped" : "huéspedes"}
              </p>
            </div>

            {propiedad.servicios.length > 0 && (
              <div>
                <h2 className="mb-1.5 text-lg font-semibold text-[var(--color-ink)]">
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

          <aside className="space-y-4 lg:self-start">
            {propiedad.activa && (
              <Link
                href={`/pre-reserva?cabana=${encodeURIComponent(propiedad.id)}`}
                className="flex w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-accent)] px-5 py-3 text-sm font-medium text-white transition-all hover:bg-[var(--color-accent)]/90 active:scale-[0.97]"
              >
                Pre-reservar esta cabaña
              </Link>
            )}
            <PriceCalculator
              propiedadId={propiedad.id}
              nombre={propiedad.nombre}
              capacidad={propiedad.capacidad}
            />
          </aside>
        </div>

        <div className="mt-12">
          <ResenasLista resenas={resenas} promedio={promedio} total={total} />
        </div>

        <div className="mt-12">
          <ResenaForm propiedadId={propiedad.id} autenticado={autenticado} />
        </div>
      </section>
    </>
  );
}
