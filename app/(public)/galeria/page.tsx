import { Metadata } from "next";
import { IMAGENES_HERO_FALLBACK } from "@/lib/config";
import { obtenerAlbumes, obtenerTodasLasFotos } from "@/lib/galeria";
import { prisma } from "@/lib/prisma";
import AlbumCard from "./AlbumCard";
import VerTodas from "./VerTodas";

export const metadata: Metadata = {
  title: "Galería | Cabañas Ermitazh",
  description:
    "Explora la galería completa de fotos de nuestras cabañas y áreas comunes en Cabañas Ermitazh, San Rafael, Mendoza.",
};

export default async function GaleriaPage() {
  const [albumes, heroImagen] = await Promise.all([
    obtenerAlbumes(),
    prisma.imagen.findFirst({
      where: { categoria: "hero", activa: true },
      orderBy: { orden: "asc" },
      select: { url: true },
    }),
  ]);
  const todasLasFotos = obtenerTodasLasFotos(albumes);
  const imagenFondo = heroImagen?.url ?? IMAGENES_HERO_FALLBACK[0].url;

  return (
    <section className="relative min-h-screen overflow-hidden">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${imagenFondo})` }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-b from-[var(--color-bg)]/[0.8] via-[var(--color-bg)]/[0.58] to-[var(--color-bg)]/[0.3]"
      />

      <div className="relative pt-24 pb-16 md:pb-24">
        <div className="mx-auto max-w-7xl px-6">
          <header className="mb-10 flex flex-col gap-4 md:mb-14 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-[var(--color-ink)]/75">
                Galería de fotos
              </p>
              <h1 className="text-balance text-3xl font-semibold tracking-tight text-[var(--color-ink)] md:text-4xl lg:text-5xl">
                Descubrí cada rincón de Ermitazh
              </h1>
            </div>
            <p className="max-w-md text-base leading-relaxed text-[var(--color-ink)]/75">
              Recorré nuestras cabañas y espacios comunes a través de imágenes
              reales. Cada foto refleja la calidez y el entorno natural que te
              espera.
            </p>
          </header>

          {albumes.length === 0 ? (
            <p className="py-12 text-center text-[var(--color-ink)]/65">
              Todavía no hay fotos disponibles.
            </p>
          ) : (
            <>
              <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
                {albumes.map((album) => (
                  <AlbumCard key={album.id} album={album} />
                ))}
              </div>

              {todasLasFotos.length > 0 && <VerTodas fotos={todasLasFotos} />}
            </>
          )}
        </div>
      </div>
    </section>
  );
}
