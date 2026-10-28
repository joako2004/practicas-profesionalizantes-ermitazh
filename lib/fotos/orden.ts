/**
 * Reglas puras para reordenar las fotos de una cabaña.
 *
 * La portada es siempre la posición 0 del array `propiedades.fotos`. Este
 * módulo no importa React, Prisma, Supabase ni lee process.env: recibe el
 * array y devuelve uno nuevo para poder probarlo sin infraestructura.
 */

export type MotivoFalloPortada =
  | "ya-es-portada"
  | "desactualizada"
  | "posicion-invalida";

export type ResultadoHacerPortada =
  | { ok: true; fotos: string[] }
  | { ok: false; motivo: MotivoFalloPortada };

export const MENSAJE_PORTADA_OK =
  "Listo: esa foto ahora es la portada de la cabaña.";

const MENSAJES_FALLO: Record<MotivoFalloPortada, string> = {
  "ya-es-portada": "Esa foto ya es la portada.",
  desactualizada:
    "La lista de fotos cambió. Actualizá la página e intentá de nuevo.",
  "posicion-invalida": "Foto inválida.",
};

/**
 * Mueve a la posición 0 la foto indicada y conserva el orden relativo del
 * resto.
 *
 * `urlEsperada` protege contra una pantalla desactualizada: si la posición ya
 * no contiene exactamente esa URL, no se mueve nada. La comparación es por
 * texto y sin normalizar. Las apariciones repetidas de la misma URL no se
 * tocan: solo se mueve el elemento de la posición indicada.
 */
export function hacerPortada(
  fotos: readonly string[],
  posicion: number,
  urlEsperada: string
): ResultadoHacerPortada {
  if (!Number.isInteger(posicion) || posicion < 0 || posicion >= fotos.length) {
    return { ok: false, motivo: "posicion-invalida" };
  }

  if (fotos[posicion] !== urlEsperada) {
    return { ok: false, motivo: "desactualizada" };
  }

  if (posicion === 0) {
    return { ok: false, motivo: "ya-es-portada" };
  }

  return {
    ok: true,
    fotos: [
      fotos[posicion],
      ...fotos.slice(0, posicion),
      ...fotos.slice(posicion + 1),
    ],
  };
}

export function mensajeFalloPortada(motivo: MotivoFalloPortada): string {
  return MENSAJES_FALLO[motivo];
}
