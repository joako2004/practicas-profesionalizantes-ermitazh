import Link from "next/link";
import { buildReservaWhatsApp } from "@/lib/config";

interface CabinCardProps {
  id: string;
  nombre: string;
  descripcion: string;
  capacidad: number;
  precioDesdeArs: number | null;
  fotos: string[];
  // Opcionales para el link de WhatsApp
  fechaIngreso?: string;
  fechaSalida?: string;
  personas?: number;
}

const precioFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export default function CabinCard({
  id,
  nombre,
  descripcion,
  capacidad,
  precioDesdeArs,
  fotos,
  fechaIngreso,
  fechaSalida,
  personas,
}: CabinCardProps) {
  const tieneFotos = fotos.length > 0;

  return (
    <article className="group flex flex-col overflow-hidden rounded-[var(--radius-lg)] bg-white shadow-sm ring-1 ring-[var(--color-border)] transition-all hover:shadow-md">
      <div className="card-photo relative overflow-hidden">
        {tieneFotos ? (
          <img
            src={fotos[0]}
            alt={`Foto de ${nombre}`}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="h-full w-full bg-[var(--color-warm)]/30" />
        )}
        <div className="card-photo-overlay inset-0" />
        <div className="absolute top-3 left-3">
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

        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          {precioDesdeArs === null ? (
            <span className="text-lg font-semibold text-[var(--color-accent)] whitespace-nowrap">
              Consultar
            </span>
          ) : (
            <div>
              <span className="block text-xs font-medium text-[var(--color-ink)]/50">
                Noches a partir de:
              </span>
              <span className="block text-lg font-semibold text-[var(--color-accent)] whitespace-nowrap">
                {precioFormatter.format(precioDesdeArs)}
              </span>
              <Link
                href={`/cabanas/${id}`}
                className="mt-1 inline-block text-xs font-medium text-[var(--color-ink)]/60 underline underline-offset-2 transition-colors hover:text-[var(--color-ink)]"
              >
                Conocé nuestras promociones
              </Link>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Link
              href={`/cabanas/${id}`}
              className="whitespace-nowrap rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-xs font-medium text-[var(--color-ink)]/70 transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-ink)] active:scale-[0.97]"
            >
              Ver más
            </Link>
            <a
              href={buildReservaWhatsApp(nombre, fechaIngreso, fechaSalida, personas)}
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
