export const UMBRAL_DESLIZAMIENTO = 50;

/**
 * Indica si el índice corresponde a una foto existente.
 *
 * Se exige que tanto el índice como el total sean enteros: un total
 * fraccionario no representa una cantidad de fotos válida.
 */
export function indiceValido(indice: number, total: number): boolean {
  return (
    Number.isInteger(indice) &&
    Number.isInteger(total) &&
    indice >= 0 &&
    indice < total
  );
}

/** Índice de la foto siguiente, o null si no existe o los datos no son válidos. */
export function indiceSiguiente(
  actual: number,
  total: number
): number | null {
  if (!indiceValido(actual, total)) return null;

  const siguiente = actual + 1;

  return indiceValido(siguiente, total) ? siguiente : null;
}

/** Índice de la foto anterior, o null si no existe o los datos no son válidos. */
export function indiceAnterior(
  actual: number,
  total: number
): number | null {
  if (!indiceValido(actual, total)) return null;

  const anterior = actual - 1;

  return indiceValido(anterior, total) ? anterior : null;
}

/** Texto de posición legible, por ejemplo "3 / 14". */
export function textoPosicion(indice: number, total: number): string {
  return `${indice + 1} / ${total}`;
}

/**
 * Decide si un gesto táctil corresponde a un cambio de foto.
 *
 * Solo cuenta como deslizamiento cuando el movimiento es claramente
 * horizontal (más que vertical) y supera el umbral. Hacia la izquierda
 * (deltaX negativo) avanza a la siguiente foto; hacia la derecha vuelve a
 * la anterior.
 */
export function decidirDeslizamiento(
  deltaX: number,
  deltaY: number,
  umbral: number = UMBRAL_DESLIZAMIENTO
): "anterior" | "siguiente" | null {
  if (
    !Number.isFinite(deltaX) ||
    !Number.isFinite(deltaY) ||
    !Number.isFinite(umbral) ||
    umbral < 0
  ) {
    return null;
  }

  const distanciaX = Math.abs(deltaX);
  const distanciaY = Math.abs(deltaY);

  if (distanciaX <= distanciaY) return null;
  if (distanciaX < umbral) return null;

  return deltaX < 0 ? "siguiente" : "anterior";
}
