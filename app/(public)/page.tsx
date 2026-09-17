import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
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
    orderBy: { capacidad: "asc" },
    select: {
      id: true,
      nombre: true,
      descripcion: true,
      capacidad: true,
      precioBase: true,
      fotos: true,
    },
  });
  return propiedades;
}

export default async function HomePage() {
  const [heroImages, galleryImages, ctaImage, testimonios, propiedades] =
    await Promise.all([
      getHeroImages(),
      getGalleryImages(),
      getCtaImage(),
      getTestimonios(),
      getPropiedades(),
    ]);

  const propiedadesSerializadas = propiedades.map((p) => ({
    ...p,
    precioBase: p.precioBase.toNumber(),
  }));

  return (
    <>
      <HeroCarousel imagenes={heroImages} />
      <SearchCard />
      <WelcomeSection />
      <CabinsSection propiedades={propiedadesSerializadas} />
      <ServicesSection servicios={SERVICIOS_GENERALES} />
      <GallerySection imagenes={galleryImages} />
      <TestimonialsSection testimonios={testimonios} />
      <CtaSection imagenFondo={ctaImage} />
    </>
  );
}
