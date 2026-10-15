import { Metadata } from "next";
import { obtenerSeccionesGaleria, obtenerFiltros, obtenerFotosPorFiltro } from "@/lib/galeria";
import GalleryClient from "./GalleryClient";

export const metadata: Metadata = {
  title: "Galería | Cabañas Ermitazh",
  description: "Explora la galería completa de fotos de nuestras cabañas y áreas comunes en Cabañas Ermitazh, San Rafael, Mendoza.",
};

interface GaleriaPageProps {
  searchParams: Promise<{ cabana?: string }>;
}

export default async function GaleriaPage({ searchParams }: GaleriaPageProps) {
  const { cabana } = await searchParams;
  const secciones = await obtenerSeccionesGaleria();
  const seccionesConFotos = secciones.filter((s) => s.fotos.length > 0);
  const filtros = obtenerFiltros(seccionesConFotos);
  const filtroInicial = cabana && filtros.find((f) => f.id === cabana) ? cabana : "todas";
  const fotosIniciales = obtenerFotosPorFiltro(seccionesConFotos, filtroInicial);

  return (
    <section className="min-h-screen bg-[var(--color-bg)]">
      <div className="pt-24 pb-12 md:pb-16">
        <div className="mx-auto max-w-7xl px-6">
          <header className="mb-10 md:mb-14 flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-[0.22em] text-[var(--color-muted)]">
                Galería de fotos
              </p>
              <h1 className="text-balance text-3xl font-semibold tracking-tight text-[var(--color-ink)] md:text-4xl lg:text-5xl">
                Descubrí cada rincón de Ermitazh
              </h1>
            </div>
            <p className="max-w-md text-base leading-relaxed text-[var(--color-ink)]/60">
              Recorré nuestras cabañas y espacios comunes a través de imágenes reales.
              Cada foto refleja la calidez y el entorno natural que te espera.
            </p>
          </header>

          <GalleryClient
            secciones={seccionesConFotos}
            filtros={filtros}
            filtroInicial={filtroInicial}
            fotosIniciales={fotosIniciales}
          />
        </div>
      </div>
    </section>
  );
}