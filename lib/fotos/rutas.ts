/**
 * Utilidades puras para trabajar con las rutas de las fotos en Supabase Storage.
 *
 * Este módulo no importa Node, Prisma, Supabase ni lee process.env: puede
 * importarse tanto desde el servidor como desde el navegador.
 */

export const BUCKET_FOTOS = "propiedades-fotos";

export type TipoMimePermitido = "image/jpeg" | "image/png" | "image/webp";

export const TIPOS_MIME_PERMITIDOS: readonly TipoMimePermitido[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export const TAMANO_MAXIMO_BYTES = 5 * 1024 * 1024;

export const MAX_ARCHIVOS_POR_TANDA = 10;

const PREFIJO_PUBLICO = `/storage/v1/object/public/${BUCKET_FOTOS}/`;

const TIPOS_PERMITIDOS_SET: ReadonlySet<string> = new Set(
  TIPOS_MIME_PERMITIDOS
);

const EXTENSION_POR_TIPO: Readonly<
  Record<TipoMimePermitido, "jpeg" | "png" | "webp">
> = {
  "image/jpeg": "jpeg",
  "image/png": "png",
  "image/webp": "webp",
};

const MENSAJE_HEIC =
  "Las fotos HEIC no están soportadas: exportala como JPEG, PNG o WebP";

const PATRON_PROPIEDAD_ID = /^[A-Za-z0-9_-]+$/;

const PATRON_SUFIJO = /^[A-Za-z0-9_-]+$/;

/**
 * Valida un path ya decodificado: sin segmentos vacíos, sin "." ni ".." y sin
 * barras al principio o al final. Es la misma regla para extraer y construir.
 */
function esPathValido(path: string): boolean {
  if (path.length === 0) return false;
  if (path.startsWith("/") || path.endsWith("/")) return false;

  return path
    .split("/")
    .every(
      (segmento) =>
        segmento.length > 0 && segmento !== "." && segmento !== ".."
    );
}

function esTipoPermitido(tipo: string): tipo is TipoMimePermitido {
  return TIPOS_PERMITIDOS_SET.has(tipo);
}

function esHeic(archivo: ArchivoFoto): boolean {
  const tipo = archivo.tipo.toLowerCase();
  if (tipo === "image/heic" || tipo === "image/heif") return true;

  const nombre = archivo.nombre.toLowerCase();
  return nombre.endsWith(".heic") || nombre.endsWith(".heif");
}

/**
 * Extrae la ruta dentro del bucket a partir de una URL pública.
 *
 * Se compara siempre por path y no por URL completa porque la misma foto puede
 * estar guardada con la barra codificada ("1%2F2.jpeg") o literal
 * ("1/2.jpeg"), y la URL puede traer query string o cambiar de dominio.
 */
export function extraerPathDeUrl(url: string): string | null {
  if (typeof url !== "string") return null;

  let pathname: string;
  try {
    pathname = new URL(url).pathname;
  } catch {
    return null;
  }

  const indice = pathname.indexOf(PREFIJO_PUBLICO);
  if (indice === -1) return null;

  const restoCodificado = pathname.slice(indice + PREFIJO_PUBLICO.length);

  let path: string;
  try {
    path = decodeURIComponent(restoCodificado);
  } catch {
    return null;
  }

  return esPathValido(path) ? path : null;
}

/**
 * Construye la URL pública de una foto a partir de la URL base del proyecto y
 * del path dentro del bucket. Cada segmento se codifica por separado y la
 * barra entre segmentos queda literal.
 */
export function construirUrlPublica(urlBase: string, path: string): string {
  if (!esPathValido(path)) {
    throw new Error(`Ruta de foto inválida: "${path}".`);
  }

  const base = urlBase.replace(/\/+$/, "");
  const segmentos = path.split("/").map((segmento) => encodeURIComponent(segmento));

  return `${base}${PREFIJO_PUBLICO}${segmentos.join("/")}`;
}

/**
 * Indica si dos URLs apuntan al mismo archivo dentro del bucket, sin importar
 * si la barra viene codificada o literal ni qué query string traigan.
 */
export function mismaFoto(urlA: string, urlB: string): boolean {
  const pathA = extraerPathDeUrl(urlA);
  const pathB = extraerPathDeUrl(urlB);

  return pathA !== null && pathB !== null && pathA === pathB;
}

export interface ArchivoFoto {
  nombre: string;
  tipo: string;
  tamano: number;
}

export type ResultadoValidacionArchivo =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Valida tipo y tamaño de un archivo antes de subirlo.
 *
 * HEIC se detecta primero por tipo o por extensión para poder devolver un
 * mensaje específico, porque suele llegar con un tipo genérico que no está en
 * la lista de permitidos.
 */
export function validarArchivoFoto(
  archivo: ArchivoFoto
): ResultadoValidacionArchivo {
  if (esHeic(archivo)) {
    return { ok: false, error: MENSAJE_HEIC };
  }

  if (!esTipoPermitido(archivo.tipo)) {
    return {
      ok: false,
      error: `El tipo de archivo "${archivo.tipo}" no está permitido. Se aceptan: ${TIPOS_MIME_PERMITIDOS.join(
        ", "
      )}.`,
    };
  }

  if (archivo.tamano <= 0) {
    return { ok: false, error: "El archivo está vacío" };
  }

  if (archivo.tamano > TAMANO_MAXIMO_BYTES) {
    const maximoMb = TAMANO_MAXIMO_BYTES / (1024 * 1024);
    const recibidoMb = archivo.tamano / (1024 * 1024);

    return {
      ok: false,
      error: `El archivo supera el máximo de ${maximoMb} MB (recibido: ${recibidoMb.toFixed(
        2
      )} MB, ${archivo.tamano} bytes).`,
    };
  }

  return { ok: true };
}

/**
 * Devuelve la extensión a usar en Storage para un tipo MIME permitido.
 */
export function extensionParaTipo(
  tipo: string
): "jpeg" | "png" | "webp" | null {
  if (!esTipoPermitido(tipo)) return null;

  return EXTENSION_POR_TIPO[tipo];
}

export interface OpcionesPathNuevo {
  propiedadId: string;
  tipo: string;
  ahora?: number;
  sufijo?: string;
}

/**
 * Genera el path de una foto nueva: cabanas/<propiedadId>/<ahora>-<sufijo>.<ext>.
 *
 * `ahora` y `sufijo` son opcionales para poder generar valores deterministas
 * en las pruebas. El sufijo se valida para que nunca pueda introducir barras
 * ni ".." en la ruta.
 */
export function generarPathNuevo(opciones: OpcionesPathNuevo): string {
  const { propiedadId, tipo } = opciones;

  if (!PATRON_PROPIEDAD_ID.test(propiedadId)) {
    throw new Error(`propiedadId inválido: "${propiedadId}".`);
  }

  const extension = extensionParaTipo(tipo);
  if (extension === null) {
    throw new Error(`Tipo de archivo no permitido: "${tipo}".`);
  }

  const ahora = opciones.ahora ?? Date.now();
  const sufijo =
    opciones.sufijo ??
    globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 8);

  if (!PATRON_SUFIJO.test(sufijo)) {
    throw new Error(`Sufijo inválido: "${sufijo}".`);
  }

  return `cabanas/${propiedadId}/${ahora}-${sufijo}.${extension}`;
}

/**
 * Convierte una lista de URLs en el conjunto de paths protegidos.
 *
 * Se guardan paths y no URLs para que la comparación no dependa del formato
 * de la barra ni de la query string.
 */
export function obtenerPathsProtegidos(
  urls: readonly string[]
): Set<string> {
  const paths = new Set<string>();

  for (const url of urls) {
    const path = extraerPathDeUrl(url);
    if (path !== null) paths.add(path);
  }

  return paths;
}

/**
 * Indica si un path pertenece al conjunto de fotos protegidas.
 */
export function esPathProtegido(
  path: string,
  protegidos: ReadonlySet<string>
): boolean {
  return protegidos.has(path);
}
