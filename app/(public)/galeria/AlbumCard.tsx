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
      className="group flex flex-col rounded-[var(--radius-lg)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)]"
    >
      <div className="card-photo relative overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-warm)]/30 shadow-sm ring-1 ring-[var(--color-border)]">
        <Image
          src={album.portada}
          alt={`Foto de ${album.nombre}`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          loading="lazy"
          className="object-cover transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:scale-105"
        />
      </div>

      <div className="mt-3 px-1">
        <h2 className="text-lg font-semibold tracking-tight text-[var(--color-ink)]">
          {album.nombre}
        </h2>
        {album.capacidad !== null && (
          <p className="mt-0.5 text-sm text-[var(--color-ink)]/60">
            Hasta {album.capacidad} personas
          </p>
        )}
      </div>
    </Link>
  );
}
