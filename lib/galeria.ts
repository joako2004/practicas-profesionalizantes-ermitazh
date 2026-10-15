import { prisma } from "@/lib/prisma";

export interface FotoConMetadatos {
  url: string;
  alt: string;
  seccion: string;
  propiedadId: string;
}

export interface SeccionGaleria {
  id: string;
  titulo: string;
  fotos: FotoConMetadatos[];
  orden: number;
}

const UMBRAL_CARRUSEL = 6;
const PHOTOS_PER_PAGE = 12;

function extraerNumeroCabaña(nombre: string): number | null {
  const match = nombre.match(/Cabaña\s+(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

function sonGemelas(nombre1: string, nombre2: string): boolean {
  const num1 = extraerNumeroCabaña(nombre1);
  const num2 = extraerNumeroCabaña(nombre2);
  if (num1 === null || num2 === null) return false;
  return (num1 === 3 && num2 === 4) || (num1 === 4 && num2 === 3);
}

function generarAlt(nombrePropiedad: string, index: number, total: number): string {
  return `${nombrePropiedad} — foto ${index + 1} de ${total}`;
}

function deduplicarUrls(fotos: FotoConMetadatos[]): FotoConMetadatos[] {
  const vistas = new Set<string>();
  return fotos.filter((foto) => {
    if (vistas.has(foto.url)) return false;
    vistas.add(foto.url);
    return true;
  });
}

export async function obtenerSeccionesGaleria(): Promise<SeccionGaleria[]> {
  const [propiedades, complejo] = await Promise.all([
    prisma.propiedad.findMany({
      where: { activa: true },
      orderBy: { orden: "asc" },
      select: {
        id: true,
        nombre: true,
        fotos: true,
        orden: true,
      },
    }),
    prisma.complejo.findFirst({
      select: {
        id: true,
        nombre: true,
        fotos: true,
      },
    }),
  ]);

  const secciones: SeccionGaleria[] = [];
  let orden = 1;

  const propiedadesProcesadas = new Set<string>();

  for (const propiedad of propiedades) {
    if (propiedadesProcesadas.has(propiedad.id)) continue;

    const esGemela = propiedades.some(
      (p) => p.id !== propiedad.id && sonGemelas(propiedad.nombre, p.nombre)
    );

    if (esGemela) {
      const gemela = propiedades.find(
        (p) => p.id !== propiedad.id && sonGemelas(propiedad.nombre, p.nombre)
      );
      if (gemela) {
        propiedadesProcesadas.add(propiedad.id);
        propiedadesProcesadas.add(gemela.id);

        const todasFotos = [...propiedad.fotos, ...gemela.fotos];
        const fotosUnicas = deduplicarUrls(
          todasFotos.map((url, i) => ({
            url,
            alt: generarAlt(`${propiedad.nombre} y ${gemela.nombre}`, i, todasFotos.length),
            seccion: `${propiedad.nombre} y ${gemela.nombre}`,
            propiedadId: propiedad.id,
          }))
        );

        if (fotosUnicas.length > 0) {
          secciones.push({
            id: `cabanas-${extraerNumeroCabaña(propiedad.nombre)}-${extraerNumeroCabaña(gemela.nombre)}`,
            titulo: `${propiedad.nombre} y ${gemela.nombre}`,
            fotos: fotosUnicas,
            orden: orden++,
          });
        }
        continue;
      }
    }

    propiedadesProcesadas.add(propiedad.id);

    if (propiedad.fotos.length > 0) {
      const fotosConMeta: FotoConMetadatos[] = propiedad.fotos.map((url, i) => ({
        url,
        alt: generarAlt(propiedad.nombre, i, propiedad.fotos.length),
        seccion: propiedad.nombre,
        propiedadId: propiedad.id,
      }));

      secciones.push({
        id: `cabana-${extraerNumeroCabaña(propiedad.nombre) || propiedad.id}`,
        titulo: propiedad.nombre,
        fotos: fotosConMeta,
        orden: orden++,
      });
    }
  }

  secciones.sort((a, b) => a.orden - b.orden);

  if (complejo?.fotos.length) {
    const fotosComplejo: FotoConMetadatos[] = complejo.fotos.map((url, i) => ({
      url,
      alt: `${complejo.nombre} — foto ${i + 1} de ${complejo.fotos.length}`,
      seccion: "Área de juegos y otros espacios",
      propiedadId: complejo.id,
    }));

    secciones.push({
      id: "complejo",
      titulo: "Área de juegos y otros espacios",
      fotos: fotosComplejo,
      orden: orden++,
    });
  }

  return secciones;
}

export function obtenerTodasLasFotos(secciones: SeccionGaleria[]): FotoConMetadatos[] {
  const todas: FotoConMetadatos[] = [];
  for (const seccion of secciones) {
    todas.push(...seccion.fotos);
  }
  return deduplicarUrls(todas);
}

export function obtenerSeccionesConFotos(secciones: SeccionGaleria[]): SeccionGaleria[] {
  return secciones.filter((s) => s.fotos.length > 0);
}

export function obtenerFiltros(secciones: SeccionGaleria[]): { id: string; titulo: string; cantidad: number }[] {
  const filtros = [{ id: "todas", titulo: "Todas", cantidad: obtenerTodasLasFotos(secciones).length }];
  for (const seccion of secciones) {
    if (seccion.id !== "complejo") {
      filtros.push({ id: seccion.id, titulo: seccion.titulo, cantidad: seccion.fotos.length });
    }
  }
  const complejo = secciones.find((s) => s.id === "complejo");
  if (complejo?.fotos.length) {
    filtros.push({ id: "complejo", titulo: "Complejo", cantidad: complejo.fotos.length });
  }
  return filtros;
}

export function obtenerFotosPorFiltro(secciones: SeccionGaleria[], filtroId: string): FotoConMetadatos[] {
  if (filtroId === "todas") {
    return obtenerTodasLasFotos(secciones);
  }
  const seccion = secciones.find((s) => s.id === filtroId);
  return seccion?.fotos || [];
}

export function asignarTamanosBento(fotos: FotoConMetadatos[]): Array<FotoConMetadatos & { w2: boolean; h2: boolean }> {
  return fotos.map((foto, index) => {
    const position = index % 7;
    const w2 = position === 0 || position === 4;
    const h2 = position === 1 || position === 5;
    return { ...foto, w2, h2 };
  });
}

export { UMBRAL_CARRUSEL, PHOTOS_PER_PAGE };