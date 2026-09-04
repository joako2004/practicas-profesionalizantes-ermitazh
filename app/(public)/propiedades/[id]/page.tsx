import Link from "next/link";
import { notFound } from "next/navigation";
import PropertyGallery from "@/components/public/PropertyGallery";
import { buildReservaWhatsApp } from "@/lib/config";
import { getIdBySlug } from "@/lib/cabanas-data";

interface Propiedad {
  id: string;
  nombre: string;
  descripcion: string;
  capacidad: number;
  precioBase: number;
  fotos: string[];
  servicios: string[];
}

async function getPropiedad(id: string): Promise<Propiedad | null> {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const response = await fetch(`${baseUrl}/api/propiedades/${id}`, {
      next: { revalidate: 3600 }, // Cache por 1 hora
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Error al obtener la propiedad: ${response.statusText}`);
    }

    const data: unknown = await response.json();

    // Validar estructura mínima de datos
    if (
      !data ||
      typeof data !== "object" ||
      !("id" in data) ||
      !("nombre" in data)
    ) {
      throw new Error("Formato de respuesta inválido");
    }

    const propiedad = data as Propiedad;

    // Normalizar precioBase como number
    if (typeof propiedad.precioBase === "string") {
      propiedad.precioBase = parseFloat(propiedad.precioBase);
    }

    return propiedad;
  } catch (error) {
    console.error(`Error al obtener propiedad ${id}:`, error);
    // En caso de error de red, relanzar para que se maneje en el error boundary
    throw new Error("No se pudo cargar la propiedad. Intenta más tarde.");
  }
}

function getCategoria(capacidad: number): string {
  if (capacidad <= 2) return "Personal";
  if (capacidad <= 4) return "Standard";
  return "Familiar";
}

function formatearPrecio(precio: number): string {
  return `$${precio.toLocaleString("es-AR")}`;
}

interface PropertyDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PropertyDetailPageProps) {
  const { id: slug } = await params;
  const id = getIdBySlug(slug);
  
  if (!id) {
    return {
      title: "Cabaña no encontrada",
      description: "La cabaña que buscas no existe.",
    };
  }

  try {
    const propiedad = await getPropiedad(id);
    if (!propiedad) {
      return {
        title: "Cabaña no encontrada",
        description: "La cabaña que buscas no existe.",
      };
    }
    return {
      title: `${propiedad.nombre} | Cabañas Ermitazh`,
      description: propiedad.descripcion.substring(0, 160),
      openGraph: {
        title: propiedad.nombre,
        description: propiedad.descripcion,
        images: propiedad.fotos.length > 0 ? [propiedad.fotos[0]] : [],
      },
    };
  } catch {
    return {
      title: "Cabaña | Cabañas Ermitazh",
    };
  }
}

export default async function PropertyDetailPage({
  params,
}: PropertyDetailPageProps) {
  const { id: slug } = await params;

  // Convertir slug a ID real
  const id = getIdBySlug(slug);
  if (!id) {
    notFound();
  }

  let propiedad: Propiedad | null = null;
  let error: string | null = null;

  try {
    propiedad = await getPropiedad(id);
  } catch (err) {
    error = err instanceof Error ? err.message : "Error desconocido";
  }

  if (!propiedad) {
    if (error) {
      return (
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <h1 className="text-3xl font-bold text-[var(--color-ink)]">
            Error al cargar la cabaña
          </h1>
          <p className="mt-4 text-[var(--color-ink)]/70">{error}</p>
          <Link
            href="/propiedades"
            className="mt-6 inline-block rounded-[var(--radius-md)] bg-[var(--color-accent)] px-6 py-3 font-medium text-white transition-all hover:bg-[var(--color-accent)]/90"
          >
            Volver al listado
          </Link>
        </div>
      );
    }

    notFound();
  }

  const categoria = getCategoria(propiedad.capacidad);
  const precioFormateado = formatearPrecio(propiedad.precioBase);

  return (
    <article className="min-h-screen bg-[var(--color-bg)]">
      {/* Hero / Galería de fotos */}
      <section className="mx-auto max-w-4xl px-6 py-8 md:py-12">
        <PropertyGallery fotos={propiedad.fotos} nombre={propiedad.nombre} />
      </section>

      {/* Contenido principal */}
      <section className="mx-auto max-w-4xl px-6 pb-16">
        {/* Header: nombre, capacidad, categoría */}
        <div className="mb-8 border-b border-[var(--color-border)] pb-6">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-[var(--color-ink)]">
                {propiedad.nombre}
              </h1>
              <p className="mt-2 text-[var(--color-ink)]/60">
                {categoria} • {propiedad.capacidad}{" "}
                {propiedad.capacidad === 1 ? "huésped" : "huéspedes"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-[var(--color-accent)]">
                {precioFormateado}
              </p>
              <p className="text-sm text-[var(--color-ink)]/60">/ noche</p>
            </div>
          </div>
        </div>

        {/* Grid: descripción + CTA */}
        <div className="grid gap-8 md:grid-cols-3 mb-12">
          <div className="md:col-span-2">
            {/* Descripción completa */}
            <div className="mb-8">
              <h2 className="mb-4 text-xl font-semibold text-[var(--color-ink)]">
                Descripción
              </h2>
              <p className="whitespace-pre-wrap leading-relaxed text-[var(--color-ink)]/80">
                {propiedad.descripcion}
              </p>
            </div>

            {/* Servicios (TODOS) */}
            <div>
              <h2 className="mb-4 text-xl font-semibold text-[var(--color-ink)]">
                Servicios
              </h2>
              <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {propiedad.servicios.map((servicio) => (
                  <li
                    key={servicio}
                    className="flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--color-surface)] px-4 py-3"
                  >
                    <span className="h-2 w-2 rounded-full bg-[var(--color-accent)]" />
                    <span className="text-sm text-[var(--color-ink)]">
                      {servicio}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sidebar: CTA */}
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 h-fit">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[var(--color-ink)]/60">
                  Disponibilidad
                </p>
                <p className="text-lg font-semibold text-[var(--color-ink)]">
                  Consultar fechas
                </p>
              </div>

              {/* TODO: Conectar con /api/pre-reserva cuando esté lista */}
              <a
                href={buildReservaWhatsApp(
                  propiedad.nombre,
                  undefined,
                  undefined,
                  propiedad.capacidad
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-3 text-center font-medium text-white transition-all hover:bg-[var(--color-accent)]/90 active:scale-[0.97]"
              >
                Reservar por WhatsApp
              </a>

              <button
                disabled
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-3 font-medium text-[var(--color-ink)]/50 opacity-50 cursor-not-allowed"
                title="Funcionalidad próximamente disponible"
              >
                Ver disponibilidad
              </button>

              <p className="text-xs text-[var(--color-ink)]/50 text-center">
                ¿Consultas? Contacta por WhatsApp
              </p>
            </div>
          </div>
        </div>

        {/* Link de retorno */}
        <div className="flex items-center justify-center border-t border-[var(--color-border)] pt-8">
          <Link
            href="/#cabanas"
            className="rounded-[var(--radius-md)] border border-[var(--color-border)] px-6 py-3 font-medium text-[var(--color-ink)] transition-all hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
          >
            ← Volver al listado
          </Link>
        </div>
      </section>
    </article>
  );
}
