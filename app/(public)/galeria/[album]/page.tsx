import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { obtenerAlbumPorId, obtenerAlbumes } from "@/lib/galeria";
import PhotoGrid from "../PhotoGrid";

interface AlbumPageProps {
  params: Promise<{ album: string }>;
}

export async function generateMetadata({
  params,
}: AlbumPageProps): Promise<Metadata> {
  const { album: id } = await params;
  const albumes = await obtenerAlbumes();
  const album = obtenerAlbumPorId(albumes, id);

  if (!album) {
    return { title: "Álbum no encontrado | Cabañas Ermitazh" };
  }

  return {
    title: `${album.nombre} | Galería | Cabañas Ermitazh`,
    description: `Fotos de ${album.nombre} en Cabañas Ermitazh, San Rafael, Mendoza.`,
  };
}

export default async function AlbumPage({ params }: AlbumPageProps) {
  const { album: id } = await params;
  const albumes = await obtenerAlbumes();
  const album = obtenerAlbumPorId(albumes, id);

  if (!album) {
    notFound();
  }

  return (
    <section className="min-h-screen bg-[var(--color-bg)]">
      <div className="pt-24 pb-16 md:pb-24">
        <div className="mx-auto max-w-7xl px-6">
          <Link
            href="/galeria"
            className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-[var(--color-ink)]/70 transition-colors hover:text-[var(--color-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            Volver a la galería
          </Link>

          <header className="mt-4 mb-8 md:mb-10">
            <h1 className="text-balance text-3xl font-semibold tracking-tight text-[var(--color-ink)] md:text-4xl lg:text-5xl">
              {album.nombre}
            </h1>
            {album.capacidad !== null && (
              <p className="mt-2 text-base text-[var(--color-ink)]/60">
                Hasta {album.capacidad} personas
              </p>
            )}
          </header>

          <PhotoGrid fotos={album.fotos} variante="album" />
        </div>
      </div>
    </section>
  );
}
