import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { serializarPropiedad, obtenerPreciosUsd } from "@/lib/serializers";
import { obtenerContextoPrecios, precioUnaNocheArs } from "@/lib/precios/contexto";
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
    promoSemanalAlta: true;
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
      promoSemanalAlta: true,
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

export default async function HomePage() {
  const [heroImages, galleryImages, ctaImage, testimonios, propiedades, contextoPrecios] =
    await Promise.all([
      getHeroImages(),
      getGalleryImages(),
      getCtaImage(),
      getTestimonios(),
      getPropiedades(),
      obtenerContextoPrecios(),
    ]);

  const propiedadesSerializadas = propiedades.map(serializarPropiedad);
  const preciosDesdeArs: Record<string, number | null> = {};
  for (const propiedad of propiedadesSerializadas) {
    preciosDesdeArs[propiedad.id] = precioUnaNocheArs(
      obtenerPreciosUsd(propiedad),
      contextoPrecios
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