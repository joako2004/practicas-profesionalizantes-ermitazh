import { prisma } from "@/lib/prisma";

export const CATEGORIA_EXTERIORES = "exteriores";
export const ALBUM_EXTERIORES_ID = "parque-pileta-juegos";
export const ALBUM_EXTERIORES_NOMBRE = "Parque, Pileta y Juegos";

export interface FotoGaleria {
  url: string;
  alt: string;
  album: string;
  albumId: string;
}

export interface AlbumGaleria {
  id: string;
  nombre: string;
  capacidad: number | null;
  portada: string;
  fotos: FotoGaleria[];
}

function extraerNumeroCabana(nombre: string): number | null {
  const match = nombre.match(/Cabaña\s+(\d+)/i);
  return match ? parseInt(match[1], 10) : null;
}

export async function obtenerAlbumes(): Promise<AlbumGaleria[]> {
  const [propiedades, imagenesExteriores] = await Promise.all([
    prisma.propiedad.findMany({
      where: { activa: true },
      orderBy: { orden: "asc" },
      select: {
        id: true,
        nombre: true,
        capacidad: true,
        fotos: true,
      },
    }),
    prisma.imagen.findMany({
      where: { categoria: CATEGORIA_EXTERIORES, activa: true },
      orderBy: { orden: "asc" },
      select: {
        url: true,
        alt: true,
      },
    }),
  ]);

  const albumes: AlbumGaleria[] = [];

  if (imagenesExteriores.length > 0) {
    const fotos: FotoGaleria[] = imagenesExteriores.map((imagen, i) => ({
      url: imagen.url,
      alt:
        imagen.alt ||
        `${ALBUM_EXTERIORES_NOMBRE} — foto ${i + 1} de ${imagenesExteriores.length}`,
      album: ALBUM_EXTERIORES_NOMBRE,
      albumId: ALBUM_EXTERIORES_ID,
    }));

    albumes.push({
      id: ALBUM_EXTERIORES_ID,
      nombre: ALBUM_EXTERIORES_NOMBRE,
      capacidad: null,
      portada: fotos[0].url,
      fotos,
    });
  }

  for (const propiedad of propiedades) {
    if (propiedad.fotos.length === 0) continue;

    const numero = extraerNumeroCabana(propiedad.nombre);
    const nombre = numero !== null ? `Cabaña ${numero}` : propiedad.nombre;
    const id = numero !== null ? `cabana-${numero}` : propiedad.id;

    const fotos: FotoGaleria[] = propiedad.fotos.map((url, i) => ({
      url,
      alt: `${nombre} — foto ${i + 1} de ${propiedad.fotos.length}`,
      album: nombre,
      albumId: id,
    }));

    albumes.push({
      id,
      nombre,
      capacidad: propiedad.capacidad,
      portada: propiedad.fotos[0],
      fotos,
    });
  }

  return albumes;
}

export function obtenerAlbumPorId(
  albumes: AlbumGaleria[],
  id: string
): AlbumGaleria | undefined {
  return albumes.find((album) => album.id === id);
}

export function obtenerTodasLasFotos(albumes: AlbumGaleria[]): FotoGaleria[] {
  const vistas = new Set<string>();
  const fotos: FotoGaleria[] = [];

  for (const album of albumes) {
    for (const foto of album.fotos) {
      if (vistas.has(foto.url)) continue;
      vistas.add(foto.url);
      fotos.push(foto);
    }
  }

  return fotos;
}
