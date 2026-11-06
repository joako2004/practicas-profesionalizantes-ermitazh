/**
 * Lugar único para el cálculo de "hoy" en Argentina.
 *
 * Módulo sin imports a propósito: es hoja, para que cualquier capa pueda
 * usarlo sin arrastrar dependencias.
 */

/** Zona horaria unificada del proyecto. */
export const ZONA_ARGENTINA = "America/Argentina/Buenos_Aires";

/** Formateador que devuelve los campos de la fecha calendario en Argentina. */
const FORMATO_DIA_ARGENTINA = new Intl.DateTimeFormat("en-US", {
  timeZone: ZONA_ARGENTINA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Devuelve el valor numérico de una parte del formateador, o NaN si falta. */
function parteNumerica(
  partes: Intl.DateTimeFormatPart[],
  tipo: "year" | "month" | "day",
): number {
  const parte = partes.find((una) => una.type === tipo);
  return parte === undefined ? Number.NaN : Number(parte.value);
}

/**
 * Devuelve la fecha calendario de "hoy" en Argentina, como medianoche UTC
 * de ese día.
 */
export function hoyEnArgentina(ahora: Date): Date {
  if (Number.isNaN(ahora.getTime())) {
    throw new RangeError("La fecha de referencia es inválida");
  }

  const partes = FORMATO_DIA_ARGENTINA.formatToParts(ahora);
  const anio = parteNumerica(partes, "year");
  const mes = parteNumerica(partes, "month");
  const dia = parteNumerica(partes, "day");

  if (
    !Number.isInteger(anio) ||
    !Number.isInteger(mes) ||
    !Number.isInteger(dia)
  ) {
    throw new RangeError("No se pudo obtener el día de Argentina");
  }

  return new Date(Date.UTC(anio, mes - 1, dia));
}
