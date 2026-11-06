import Link from "next/link";
import Image from "next/image";
import type { AlbumGaleria } from "@/lib/galeria";

interface AlbumCardProps {
  album: AlbumGaleria;
}

export default function AlbumCard({ album }: AlbumCardProps) {
  return (
    <Link
      href={`/galeria/${album.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-md ring-1 ring-[var(--color-border)] transition-transform duration-300 ease-[var(--ease-out-expo)] hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]"
    >
      <div className="card-photo relative overflow-hidden rounded-t-[var(--radius-lg)]">
        <Image
          src={album.portada}
          alt={`Foto de ${album.nombre}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          loading="lazy"
          className="object-cover transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-105"
        />
      </div>

      <div className="flex flex-1 flex-col justify-center p-5">
        <h2 className="text-lg font-semibold tracking-tight text-[var(--color-ink)]">
          {album.nombre}
        </h2>
        {album.capacidad !== null && (
          <p className="mt-1 text-sm text-[var(--color-ink)]/65">
            Hasta {album.capacidad} personas
          </p>
        )}
      </div>
    </Link>
  );
}
