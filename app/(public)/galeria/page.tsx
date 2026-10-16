import { Metadata } from "next";
import { obtenerAlbumes, obtenerTodasLasFotos } from "@/lib/galeria";
import AlbumCard from "./AlbumCard";
import VerTodas from "./VerTodas";

export const metadata: Metadata = {
  title: "Galería | Cabañas Ermitazh",
  description:
    "Explora la galería completa de fotos de nuestras cabañas y áreas comunes en Cabañas Ermitazh, San Rafael, Mendoza.",
};

export default async function GaleriaPage() {
  const albumes = await obtenerAlbumes();
  const todasLasFotos = obtenerTodasLasFotos(albumes);

  return (
    <section className="min-h-screen bg-[var(--color-bg)]">
      <div className="pt-24 pb-16 md:pb-24">
        <div className="mx-auto max-w-7xl px-6">
          <header className="mb-10 flex flex-col gap-4 md:mb-14 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-[var(--color-muted)]">
                Galería de fotos
              </p>
              <h1 className="text-balance text-3xl font-semibold tracking-tight text-[var(--color-ink)] md:text-4xl lg:text-5xl">
                Descubrí cada rincón de Ermitazh
              </h1>
            </div>
            <p className="max-w-md text-base leading-relaxed text-[var(--color-ink)]/60">
              Recorré nuestras cabañas y espacios comunes a través de imágenes
              reales. Cada foto refleja la calidez y el entorno natural que te
              espera.
            </p>
          </header>

          {albumes.length === 0 ? (
            <p className="py-12 text-center text-[var(--color-ink)]/50">
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
