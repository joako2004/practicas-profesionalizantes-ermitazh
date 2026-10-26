/**
 * Reglas puras para decidir si un archivo del bucket todavía está en uso.
 *
 * Este módulo no importa Node, Prisma, Supabase ni lee process.env: solo
 * compara paths. La decisión se toma fuera de la base para poder probarla
 * sin infraestructura.
 */

import { esPathProtegido, extraerPathDeUrl } from "./rutas";

/**
 * Por qué se conserva un archivo que ya no pertenece a la cabaña editada.
 *
 * - "otra-propiedad": la carpeta es compartida (por ejemplo 3_y_4) y otra
 *   cabaña sigue mostrando el mismo archivo.
 * - "imagenes": la tabla `imagenes` (galería de exteriores) lo referencia.
 * - "protegida": está fijado en lib/config.ts y se usa en el hero, el login,
 *   el registro o el fondo del panel de administración.
 */
export type MotivoConservacion = "otra-propiedad" | "imagenes" | "protegida";

export type DecisionArchivo =
  | { borrar: true }
  | { borrar: false; motivo: MotivoConservacion };

/**
 * Quita del array todas las entradas cuyo path coincida con `path`.
 *
 * Se compara por path y no por texto de URL porque la base guarda la misma
 * foto con la barra codificada (%2F) o literal. Las entradas que no son URLs
 * parseables se conservan tal cual: no se puede afirmar que apunten al path
 * pedido, y perder una foto por error es peor que dejarla en la lista.
 */
export function quitarFotoPorPath(
  fotos: readonly string[],
  path: string
): string[] {
  return fotos.filter((foto) => extraerPathDeUrl(foto) !== path);
}

/**
 * Quita del array todas las entradas cuyo texto sea exactamente `url`.
 *
 * Se compara por texto y sin normalizar: una URL que difiera en mayúsculas, en
 * la barra final o en los parámetros no es la misma foto. Es la regla para los
 * enlaces externos, que no tienen un path dentro del bucket con el que
 * comparar. Las apariciones repetidas del mismo texto se quitan todas.
 */
export function quitarFotoPorUrlExacta(
  fotos: readonly string[],
  url: string
): string[] {
  return fotos.filter((foto) => foto !== url);
}

/**
 * Indica si alguna entrada del array apunta al path pedido, sin importar el
 * formato de la barra ni la query string.
 */
export function contienePath(fotos: readonly string[], path: string): boolean {
  return fotos.some((foto) => extraerPathDeUrl(foto) === path);
}

/**
 * Decide si el archivo de `path` puede borrarse del Storage.
 *
 * El orden importa: primero lo protegido (lo rompería la web pública), después
 * las otras cabañas, después la galería de exteriores y, solo si nadie lo usa,
 * el borrado. Un archivo huérfano en Storage ocupa espacio, pero una foto rota
 * en la web es un error visible para el huésped: ante la duda, se conserva.
 *
 * `propiedades` debe reflejar el estado posterior a quitar la foto de la
 * cabaña actual; igualmente se ignora esa cabaña por id para no depender de
 * que quien llama haya hecho el update antes.
 */
export function decidirBorradoArchivo(params: {
  path: string;
  propiedadIdActual: string;
  propiedades: readonly { id: string; fotos: readonly string[] }[];
  urlsImagenes: readonly string[];
  protegidos: ReadonlySet<string>;
}): DecisionArchivo {
  const { path, propiedadIdActual, propiedades, urlsImagenes, protegidos } =
    params;

  if (esPathProtegido(path, protegidos)) {
    return { borrar: false, motivo: "protegida" };
  }

  for (const propiedad of propiedades) {
    if (propiedad.id === propiedadIdActual) continue;
    if (contienePath(propiedad.fotos, path)) {
      return { borrar: false, motivo: "otra-propiedad" };
    }
  }

  if (urlsImagenes.some((url) => extraerPathDeUrl(url) === path)) {
    return { borrar: false, motivo: "imagenes" };
  }

  return { borrar: true };
}
