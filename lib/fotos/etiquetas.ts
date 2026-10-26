/**
 * Etiquetas de solo lectura para las fotos del panel de administración.
 *
 * Este módulo es puro: no importa Node, Prisma, Supabase ni lee process.env,
 * así que puede probarse sin infraestructura y reutilizarse en cualquier capa.
 */

import { contienePath } from "./referencias";
import { esPathProtegido, extraerPathDeUrl } from "./rutas";

export type EtiquetasFoto = {
  path: string | null;
  compartidaCon: string[];
  enGaleriaExteriores: boolean;
  fijaEnElSitio: boolean;
  externa: boolean;
};

export function clasificarFoto(params: {
  url: string;
  propiedadIdActual: string;
  propiedades: readonly {
    id: string;
    nombre: string;
    fotos: readonly string[];
  }[];
  urlsImagenes: readonly string[];
  protegidos: ReadonlySet<string>;
}): EtiquetasFoto {
  const { url, propiedadIdActual, propiedades, urlsImagenes, protegidos } =
    params;

  const path = extraerPathDeUrl(url);

  // Una URL que no pertenece al bucket no se puede comparar por path: se marca
  // como externa en vez de intentar adivinar a qué archivo corresponde.
  if (path === null) {
    return {
      path: null,
      compartidaCon: [],
      enGaleriaExteriores: false,
      fijaEnElSitio: false,
      externa: true,
    };
  }

  // Se recorre una vez por cabaña y se usa contienePath (booleano): así una
  // foto repetida dentro del array de otra cabaña no duplica su nombre. Se
  // comparan paths y no URLs porque el mismo archivo puede estar guardado con
  // la barra codificada (%2F) o literal.
  const compartidaCon: string[] = [];
  const idsRevisados = new Set<string>();

  for (const propiedad of propiedades) {
    if (
      propiedad.id === propiedadIdActual ||
      idsRevisados.has(propiedad.id)
    ) {
      continue;
    }

    idsRevisados.add(propiedad.id);

    if (contienePath(propiedad.fotos, path)) {
      compartidaCon.push(propiedad.nombre);
    }
  }

  const enGaleriaExteriores = urlsImagenes.some(
    (urlImagen) => extraerPathDeUrl(urlImagen) === path
  );

  return {
    path,
    compartidaCon,
    enGaleriaExteriores,
    fijaEnElSitio: esPathProtegido(path, protegidos),
    externa: false,
  };
}
