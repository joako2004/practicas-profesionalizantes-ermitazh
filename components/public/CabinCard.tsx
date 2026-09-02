import Link from "next/link";
import { buildReservaWhatsApp } from "@/lib/config";

interface CabinCardProps {
  id: string;
  nombre: string;
  descripcion: string;
  capacidad: number;
  precioBase: number;
  fotos: string[];
  servicios: string[];
}

function getCategoria(capacidad: number): string {
  if (capacidad <= 2) return "Personal";
  if (capacidad <= 4) return "Standard";
  return "Familiar";
}

export default function CabinCard({
  id,
  nombre,
  descripcion,
  capacidad,
  precioBase,
  fotos,
  servicios,
}: CabinCardProps) {
  const fotoPrincipal =
    fotos.length > 0
      ? fotos[0]
      : "https://picsum.photos/seed/cabana-default/800/600";

  const categoria = getCategoria(capacidad);
  const precioFormateado = `$${precioBase.toLocaleString("es-AR")}`;

  return (
    <article className="group flex flex-col overflow-hidden rounded-[var(--radius-lg)] bg-white shadow-sm ring-1 ring-[var(--color-border)] transition-all hover:shadow-md">
      <div className="card-photo relative overflow-hidden">
        <img
          src={fotoPrincipal}
          alt={nombre}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="card-photo-overlay absolute inset-0" />
        <div className="absolute top-3 left-3 flex gap-2">
          <span className="rounded-[var(--radius-sm)] bg-white/90 px-2.5 py-1 text-xs font-medium text-[var(--color-ink)]">
            {categoria}
          </span>
          <span className="rounded-[var(--radius-sm)] bg-white/90 px-2.5 py-1 text-xs font-medium text-[var(--color-ink)]">
            {capacidad} {capacidad === 1 ? "huésped" : "huéspedes"}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h3 className="text-xl font-semibold text-[var(--color-ink)]">
          {nombre}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--color-ink)]/60 line-clamp-2">
          {descripcion}
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {servicios.slice(0, 3).map((s) => (
            <span
              key={s}
              className="rounded-[var(--radius-sm)] bg-[var(--color-bg)] px-2 py-0.5 text-xs text-[var(--color-ink)]/60"
            >
              {s}
            </span>
          ))}
          {servicios.length > 3 && (
            <span className="rounded-[var(--radius-sm)] bg-[var(--color-bg)] px-2 py-0.5 text-xs text-[var(--color-ink)]/60">
              +{servicios.length - 3}
            </span>
          )}
        </div>
          
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <span className="text-lg font-semibold text-[var(--color-accent)] whitespace-nowrap">
            {precioFormateado}
            <span className="text-sm font-normal text-[var(--color-ink)]/50">
              {" "}/ noche
            </span>
          </span>
          <div className="flex items-center gap-2">
            <Link
              href={`/cabanas/${id}`}
              className="whitespace-nowrap rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-xs font-medium text-[var(--color-ink)]/70 transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-ink)] active:scale-[0.97]"
            >
              Ver más
            </Link>
            <a
              href={buildReservaWhatsApp(nombre)}
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap rounded-[var(--radius-md)] bg-[var(--color-accent)] px-3 py-2 text-xs font-medium text-white transition-all hover:bg-[var(--color-accent)]/90 active:scale-[0.97]"
            >
              Reservar
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
