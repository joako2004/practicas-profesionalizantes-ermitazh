import { deClaveFecha, sumarDias } from "./noches";

/**
 * Lógica pura de los rangos que el administrador marca o libera en el
 * calendario de disponibilidad.
 *
 * A diferencia de una estadía, que ocupa las noches del intervalo
 * [ingreso, salida), el administrador elige un rango de días inclusivo: si
 * marca del 10/10/2026 al 13/10/2026 se bloquean las noches 10, 11, 12 y 13.
 * Un solo día se representa con desde = hasta y equivale a 1 noche.
 *
 * Las claves viajan como texto "AAAA-MM-DD" y todos los cálculos se hacen en
 * UTC para que la columna @db.Date de Prisma no se corra de día.
 */

/**
 * Cantidad máxima de noches que el administrador puede marcar o liberar en una
 * sola acción. No es el máximo de noches de una estadía: son conceptos
 * distintos que hoy coinciden en 30.
 */
export const NOCHES_MAX_POR_ACCION = 30;

/** Milisegundos que tiene un día cuando se cuenta en UTC. */
const MS_POR_DIA = 86_400_000;

/** Año mínimo admitido para una noche del calendario. */
const ANIO_MINIMO = 2000;

/** Año máximo admitido para una noche del calendario. */
const ANIO_MAXIMO = 2100;

/**
 * Resultado de armar la lista de noches de un rango del administrador.
 * Es una unión discriminada por "ok": si es true trae las fechas y si es false
 * trae el motivo del rechazo.
 */
export type ResultadoNochesAdmin =
  | { ok: true; fechas: Date[] }
  | { ok: false; motivo: "FECHA_INVALIDA" }
  | { ok: false; motivo: "RANGO_INVALIDO" }
  | { ok: false; motivo: "EXCEDE_MAXIMO"; maximo: number };

/**
 * Convierte una clave no confiable a la medianoche UTC de ese día.
 * Devuelve null si el valor no es un string, si el formato no es "AAAA-MM-DD",
 * si la fecha no existe o si el año queda fuera de 2000-2100.
 */
function aFechaAdmin(valor: unknown): Date | null {
  if (typeof valor !== "string") {
    return null;
  }

  const fecha = deClaveFecha(valor);
  if (fecha === null) {
    return null;
  }

  const anio = fecha.getUTCFullYear();
  if (anio < ANIO_MINIMO || anio > ANIO_MAXIMO) {
    return null;
  }

  return fecha;
}

/**
 * Devuelve las noches del rango inclusivo [desde, hasta] del administrador, en
 * orden ascendente y a medianoche UTC.
 *
 * Valida primero ambas fechas (FECHA_INVALIDA tiene prioridad), después el
 * orden del rango y por último la cantidad. El total se calcula antes de
 * generar la lista para no construir miles de fechas cuando el rango excede el
 * máximo permitido. Un rango de exactamente 30 noches es válido; 31 no.
 */
export function nochesDeRangoAdmin(
  desde: string,
  hasta: string,
): ResultadoNochesAdmin {
  const fechaDesde = aFechaAdmin(desde);
  const fechaHasta = aFechaAdmin(hasta);

  if (fechaDesde === null || fechaHasta === null) {
    return { ok: false, motivo: "FECHA_INVALIDA" };
  }

  if (fechaDesde.getTime() > fechaHasta.getTime()) {
    return { ok: false, motivo: "RANGO_INVALIDO" };
  }

  // Rango inclusivo: desde = hasta cuenta 1 noche. La diferencia en UTC se
  // redondea porque cada día mide exactamente MS_POR_DIA milisegundos.
  const noches =
    Math.round((fechaHasta.getTime() - fechaDesde.getTime()) / MS_POR_DIA) + 1;

  if (noches > NOCHES_MAX_POR_ACCION) {
    return {
      ok: false,
      motivo: "EXCEDE_MAXIMO",
      maximo: NOCHES_MAX_POR_ACCION,
    };
  }

  const fechas: Date[] = [];
  for (let i = 0; i < noches; i += 1) {
    // sumarDias devuelve una fecha nueva en cada vuelta, así que las fechas de
    // la lista son independientes entre sí.
    fechas.push(sumarDias(fechaDesde, i));
  }

  return { ok: true, fechas };
}
