"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import Footer from "@/components/public/Footer";
import Header from "@/components/public/Header";

interface Propiedad {
  id: string;
  nombre: string;
  descripcion: string;
  capacidad: number;
  precioBase: number;
  fotos: string[];
  servicios: string[];
}

function normalizarPropiedad(value: unknown): Propiedad | null {
  if (typeof value !== "object" || value === null) return null;

  const data = value as Record<string, unknown>;
  const precioBase = Number(data.precioBase);

  if (
    typeof data.id !== "string" ||
    typeof data.nombre !== "string" ||
    typeof data.descripcion !== "string" ||
    typeof data.capacidad !== "number" ||
    !Number.isFinite(precioBase) ||
    !Array.isArray(data.fotos) ||
    !data.fotos.every((foto) => typeof foto === "string") ||
    !Array.isArray(data.servicios) ||
    !data.servicios.every((servicio) => typeof servicio === "string")
  ) {
    return null;
  }

  return {
    id: data.id,
    nombre: data.nombre,
    descripcion: data.descripcion,
    capacidad: data.capacidad,
    precioBase,
    fotos: data.fotos,
    servicios: data.servicios,
  };
}

function getServicios(propiedades: Propiedad[]): string[] {
  return Array.from(
    new Set(propiedades.flatMap((propiedad) => propiedad.servicios))
  ).sort((a, b) => a.localeCompare(b, "es"));
}

function PropertyCard({ propiedad }: { propiedad: Propiedad }) {
  const fotoPrincipal = propiedad.fotos[0];

  return (
    <Link
      href={`/propiedades/${propiedad.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface)] shadow-sm ring-1 ring-[var(--color-border)] transition-all hover:-translate-y-1 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] active:scale-[0.99]"
    >
      <div className="card-photo relative overflow-hidden bg-[var(--color-warm)]">
        {fotoPrincipal ? (
          <img
            src={fotoPrincipal}
            alt={propiedad.nombre}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full min-h-48 items-center justify-center px-6 text-center text-sm text-[var(--color-ink)]/60">
            Foto próximamente
          </div>
        )}
        {fotoPrincipal && <div className="card-photo-overlay absolute inset-0" />}
        <span className="absolute top-3 left-3 rounded-[var(--radius-sm)] bg-[var(--color-surface)]/90 px-2.5 py-1 text-xs font-medium text-[var(--color-ink)]">
          Hasta {propiedad.capacidad} huéspedes
        </span>
      </div>

      <div className="flex flex-1 flex-col p-6">
        <h2 className="font-heading text-xl font-semibold text-[var(--color-ink)]">
          {propiedad.nombre}
        </h2>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--color-ink)]/65">
          {propiedad.descripcion}
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {propiedad.servicios.slice(0, 3).map((servicio) => (
            <span
              key={servicio}
              className="rounded-[var(--radius-sm)] bg-[var(--color-bg)] px-2 py-1 text-xs text-[var(--color-ink)]/70"
            >
              {servicio}
            </span>
          ))}
        </div>

        <div className="mt-5 flex items-end justify-between gap-3">
          <span className="text-lg font-semibold text-[var(--color-accent)]">
            ${propiedad.precioBase.toLocaleString("es-AR")}
            <span className="ml-1 text-sm font-normal text-[var(--color-ink)]/55">
              / noche
            </span>
          </span>
          <span className="text-sm font-medium text-[var(--color-accent)] transition-colors group-hover:text-[var(--color-ink)]">
            Ver detalle
          </span>
        </div>
      </div>
    </Link>
  );
}

function PropertyGridSkeleton() {
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface)] ring-1 ring-[var(--color-border)]"
        >
          <div className="card-photo animate-pulse bg-[var(--color-warm)]" />
          <div className="space-y-3 p-6">
            <div className="h-6 w-2/3 animate-pulse rounded bg-[var(--color-warm)]" />
            <div className="h-4 w-full animate-pulse rounded bg-[var(--color-warm)]" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-[var(--color-warm)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PropiedadesPage() {
  const [propiedades, setPropiedades] = useState<Propiedad[]>([]);
  const [servicios, setServicios] = useState<string[]>([]);
  const [capacidad, setCapacidad] = useState("");
  const [servicio, setServicio] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams();

    if (capacidad) params.set("capacidad", capacidad);
    if (servicio) params.set("servicio", servicio);

    async function loadPropiedades() {
      setIsLoading(true);
      setError(null);

      try {
        const query = params.toString();
        const response = await fetch(
          `/api/propiedades${query ? `?${query}` : ""}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("No se pudieron cargar las cabañas.");
        }

        const data: unknown = await response.json();
        if (!Array.isArray(data)) throw new Error("La respuesta no es válida.");

        const loaded = data
          .map(normalizarPropiedad)
          .filter((propiedad): propiedad is Propiedad => propiedad !== null);

        setPropiedades(loaded);
        if (!capacidad && !servicio) setServicios(getServicios(loaded));
      } catch (requestError) {
        if (
          requestError instanceof DOMException &&
          requestError.name === "AbortError"
        ) {
          return;
        }

        setError(
          "No pudimos cargar las cabañas. Probá nuevamente en unos instantes."
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadPropiedades();

    return () => controller.abort();
  }, [capacidad, servicio]);

  return (
    <>
      <Header />
      <main className="bg-[var(--color-bg)] px-6 pb-20 pt-32 md:pt-40">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-[var(--color-muted-dark)]">
              Nuestras cabañas
            </p>
            <h1 className="font-heading text-4xl font-semibold tracking-tight text-[var(--color-ink)] md:text-5xl">
              Elegí tu próximo refugio
            </h1>
            <p className="mt-4 text-base leading-relaxed text-[var(--color-ink)]/65">
              Espacios pensados para descansar, compartir y volver a conectar
              con la naturaleza.
            </p>
          </div>

          <section
            aria-label="Filtros de búsqueda"
            className="mt-10 rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-5 ring-1 ring-[var(--color-border)] md:p-6"
          >
            <div className="grid gap-5 md:grid-cols-[minmax(0,220px)_minmax(0,280px)]">
              <label className="flex flex-col gap-2 text-sm font-medium text-[var(--color-ink)]">
                Capacidad mínima
                <input
                  type="number"
                  min="1"
                  value={capacidad}
                  onChange={(event) => setCapacidad(event.target.value)}
                  placeholder="Ej. 4"
                  className="h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 font-normal text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
                />
              </label>

              <label className="flex flex-col gap-2 text-sm font-medium text-[var(--color-ink)]">
                Servicio
                <select
                  value={servicio}
                  onChange={(event) => setServicio(event.target.value)}
                  className="h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-bg)] px-3 font-normal text-[var(--color-ink)] outline-none transition focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20"
                >
                  <option value="">Todos los servicios</option>
                  {servicios.map((opcion) => (
                    <option key={opcion} value={opcion}>
                      {opcion}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <div className="mt-12">
            {isLoading ? (
              <PropertyGridSkeleton />
            ) : error ? (
              <p
                role="alert"
                className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-8 text-center text-[var(--color-ink)]"
              >
                {error}
              </p>
            ) : propiedades.length === 0 ? (
              <p className="rounded-[var(--radius-lg)] bg-[var(--color-surface)] p-8 text-center text-[var(--color-ink)]">
                No encontramos cabañas con esos filtros. Probá con otra
                combinación.
              </p>
            ) : (
              <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {propiedades.map((propiedad) => (
                  <PropertyCard key={propiedad.id} propiedad={propiedad} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}