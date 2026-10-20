import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { serializarPropiedad, obtenerPreciosUsd, type PropiedadSerializer } from "@/lib/serializers";
import { calcularPrecio, type Temporada } from "@/lib/precios/calcular";
import { obtenerConfiguracionPrecios } from "@/lib/configuracion-precios";
import { obtenerCotizacion } from "@/lib/cotizacion";
import HeroCarousel from "@/components/public/HeroCarousel";
import SearchCard from "@/components/public/SearchCard";
import WelcomeSection from "@/components/public/WelcomeSection";
import CabinsSection from "@/components/public/CabinsSection";
import ServicesSection from "@/components/public/ServicesSection";
import GallerySection from "@/components/public/GallerySection";
import TestimonialsSection from "@/components/public/TestimonialsSection";
import CtaSection from "@/components/public/CtaSection";
import { SERVICIOS_GENERALES } from "@/lib/config";

export type PropiedadParaHome = Prisma.PropiedadGetPayload<{
  select: {
    id: true;
    nombre: true;
    descripcion: true;
    capacidad: true;
    precioBase: true;
    precioNocheAlta: true;
    promoSemanalAlta: true;
    precioNocheBaja: true;
    promoSemanalBaja: true;
    precioNocheAltaUsd: true;
    precioNocheBajaUsd: true;
    precio2a6AltaUsd: true;
    precio2a6BajaUsd: true;
    fotos: true;
  };
}>;

async function getHeroImages() {
  const imagenes = await prisma.imagen.findMany({
    where: { categoria: "hero", activa: true },
    orderBy: { orden: "asc" },
    select: { url: true, alt: true },
  });
  return imagenes;
}

async function getGalleryImages() {
  const imagenes = await prisma.imagen.findMany({
    where: { categoria: "galeria", activa: true },
    orderBy: { orden: "asc" },
    select: { url: true, alt: true },
  });
  return imagenes;
}

async function getCtaImage() {
  const imagen = await prisma.imagen.findFirst({
    where: { categoria: "cta", activa: true },
    orderBy: { orden: "asc" },
    select: { url: true },
  });
  return imagen?.url;
}

async function getTestimonios() {
  const resenas = await prisma.resena.findMany({
    where: { publicada: true },
    orderBy: { creadaEn: "desc" },
    select: {
      autor: true,
      texto: true,
      puntuacion: true,
    },
  });
  return resenas;
}

async function getPropiedades() {
  const propiedades = await prisma.propiedad.findMany({
    where: { activa: true },
    orderBy: { orden: "asc" },
    select: {
      id: true,
      nombre: true,
      descripcion: true,
      capacidad: true,
      precioBase: true,
      precioNocheAlta: true,
      promoSemanalAlta: true,
      precioNocheBaja: true,
      promoSemanalBaja: true,
      precioNocheAltaUsd: true,
      precioNocheBajaUsd: true,
      precio2a6AltaUsd: true,
      precio2a6BajaUsd: true,
      fotos: true,
    },
  });
  return propiedades;
}

// Una sola lectura por carga del home; si falta la cotización las tarjetas muestran Consultar
async function getContextoPrecios(): Promise<{
  temporada: Temporada;
  cotizacionVenta: number | null;
}> {
  const configuracion = await obtenerConfiguracionPrecios();
  const cotizacion = await obtenerCotizacion(configuracion.tipoDolar);
  return {
    temporada: configuracion.temporadaActiva,
    cotizacionVenta: cotizacion ? cotizacion.venta : null,
  };
}

function calcularPrecioDesdeArs(
  propiedad: PropiedadSerializer,
  temporada: Temporada,
  cotizacionVenta: number | null
): number | null {
  const resultado = calcularPrecio({
    noches: 1,
    temporada,
    precios: obtenerPreciosUsd(propiedad),
    cotizacionVenta,
  });
  if (!resultado.ok) return null;
  const precioArs = resultado.precioNocheAplicadoArs;
  return typeof precioArs === "number" && Number.isFinite(precioArs) && precioArs > 0
    ? precioArs
    : null;
}

export default async function HomePage() {
  const [heroImages, galleryImages, ctaImage, testimonios, propiedades, contextoPrecios] =
    await Promise.all([
      getHeroImages(),
      getGalleryImages(),
      getCtaImage(),
      getTestimonios(),
      getPropiedades(),
      getContextoPrecios(),
    ]);

  const propiedadesSerializadas = propiedades.map(serializarPropiedad);
  const preciosDesdeArs: Record<string, number | null> = {};
  for (const propiedad of propiedadesSerializadas) {
    preciosDesdeArs[propiedad.id] = calcularPrecioDesdeArs(
      propiedad,
      contextoPrecios.temporada,
      contextoPrecios.cotizacionVenta
    );
  }

  return (
    <>
      <HeroCarousel imagenes={heroImages} />
      <SearchCard />
      <WelcomeSection />
      <CabinsSection
        propiedades={propiedadesSerializadas}
        preciosDesdeArs={preciosDesdeArs}
      />
      <ServicesSection servicios={SERVICIOS_GENERALES} />
      <GallerySection imagenes={galleryImages} />
      <TestimonialsSection testimonios={testimonios} />
      <CtaSection imagenFondo={ctaImage} />
    </>
  );
}