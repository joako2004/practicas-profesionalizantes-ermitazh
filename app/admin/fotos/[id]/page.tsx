import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdmin } from "@/lib/auth/perfil";
import { IMAGENES_HERO_FALLBACK } from "@/lib/config";
import { clasificarFoto } from "@/lib/fotos/etiquetas";
import { obtenerPathsProtegidos } from "@/lib/fotos/rutas";
import { prisma } from "@/lib/prisma";
import GaleriaFotos from "../_components/GaleriaFotos";

const PATRON_ID = /^[A-Za-z0-9_-]+$/;

export default async function FotosCabanaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireAdmin();

  // Se valida antes de consultar para no llevar ids arbitrarios a Prisma.
  if (!PATRON_ID.test(id)) {
    notFound();
  }

  const [propiedades, imagenes] = await Promise.all([
    prisma.propiedad.findMany({
      orderBy: { orden: "asc" },
      select: {
        id: true,
        nombre: true,
        orden: true,
        fotos: true,
      },
    }),
    prisma.imagen.findMany({
      select: { url: true },
    }),
  ]);

  const propiedad = propiedades.find((item) => item.id === id);

  if (!propiedad) {
    notFound();
  }

  const protegidos = obtenerPathsProtegidos(
    IMAGENES_HERO_FALLBACK.map((imagen) => imagen.url)
  );
  const urlsImagenes = imagenes.map((imagen) => imagen.url);

  const fotos = propiedad.fotos.map((url) => ({
    url,
    etiquetas: clasificarFoto({
      url,
      propiedadIdActual: propiedad.id,
      propiedades,
      urlsImagenes,
      protegidos,
    }),
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/fotos"
          className="inline-flex items-center rounded-[var(--radius-sm)] text-sm font-medium text-white/85 drop-shadow-sm transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
        >
          ← Volver a Fotos
        </Link>
        <h2 className="mt-2 text-2xl font-semibold text-white drop-shadow-sm">
          {propiedad.nombre}
        </h2>
        <p className="mt-1 text-sm text-white/85 drop-shadow-sm">
          {propiedad.fotos.length}{" "}
          {propiedad.fotos.length === 1 ? "foto" : "fotos"} · La primera es la
          portada: es la que se ve en el inicio y en la galería.
        </p>
      </div>

      <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3">
        <p className="text-sm leading-relaxed text-[var(--color-ink)]/75">
          <span className="font-medium text-[var(--color-ink)]">
            Compartida:
          </span>{" "}
          otra cabaña usa el mismo archivo.{" "}
          <span className="font-medium text-[var(--color-ink)]">
            En galería:
          </span>{" "}
          el archivo también figura en la galería de exteriores.{" "}
          <span className="font-medium text-[var(--color-ink)]">
            Fija en el sitio:
          </span>{" "}
          el sitio usa este archivo en el inicio, el login o el panel.
        </p>
      </div>

      <GaleriaFotos nombreCabana={propiedad.nombre} fotos={fotos} />
    </div>
  );
}
