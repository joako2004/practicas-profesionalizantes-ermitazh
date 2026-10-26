import Link from "next/link";

interface TarjetaCabanaProps {
  id: string;
  nombre: string;
  cantidadFotos: number;
  portadaUrl: string | null;
}

export default function TarjetaCabana({
  id,
  nombre,
  cantidadFotos,
  portadaUrl,
}: TarjetaCabanaProps) {
  const cantidadTexto =
    cantidadFotos === 0
      ? "Sin fotos"
      : `${cantidadFotos} ${cantidadFotos === 1 ? "foto" : "fotos"}`;

  return (
    <Link
      href={`/admin/fotos/${id}`}
      className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm transition-all hover:border-[var(--color-accent)]/60 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] motion-safe:hover:-translate-y-0.5"
    >
      <div className="aspect-[16/10] w-full overflow-hidden bg-[var(--color-warm)]/25">
        {portadaUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- La URL viene de la base y puede no estar permitida en next.config.ts.
          <img
            src={portadaUrl}
            alt={`Portada de ${nombre}`}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-[var(--color-ink)]/50">
            Sin fotos
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="truncate font-semibold text-[var(--color-ink)]">
          {nombre}
        </h3>
        <p className="text-sm text-[var(--color-ink)]/60">{cantidadTexto}</p>
        <span className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-medium text-[var(--color-accent)]">
          Ver fotos <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  );
}
