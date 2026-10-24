import type { Temporada, TramoNoches } from "./calcular";

export interface CotizacionUsadaInfo {
  tipo: string;
  etiqueta: string;
  venta: number;
  fechaTexto: string | null;
  desactualizada: boolean;
}

export interface EstadiaCalculada {
  noches: number;
  temporada: Temporada;
  tramo: TramoNoches;
  precioUnaNocheUsd: number;
  precioNocheBaseUsd: number;
  precioNocheAplicadoUsd: number;
  promoAplicadaPct: number;
  totalUsd: number;
  precioNocheBaseArs: number | null;
  precioNocheAplicadoArs: number | null;
  totalArs: number | null;
  cotizacion: CotizacionUsadaInfo | null;
}

export type MotivoErrorEstadia =
  | "DATOS_INVALIDOS"
  | "FECHAS_INVALIDAS"
  | "SALIDA_NO_POSTERIOR"
  | "ESTADIA_MUY_LARGA"
  | "CABANA_NO_ENCONTRADA"
  | "SIN_PRECIO"
  | "ERROR_INTERNO";

export type RespuestaCalculoEstadia =
  | { ok: true; estadia: EstadiaCalculada }
  | { ok: false; motivo: MotivoErrorEstadia; mensaje: string };

export const MENSAJES_ERROR_ESTADIA: Record<MotivoErrorEstadia, string> = {
  DATOS_INVALIDOS: "Los datos enviados no son válidos.",
  FECHAS_INVALIDAS: "Elegí fechas válidas de ingreso y salida.",
  SALIDA_NO_POSTERIOR: "La fecha de salida debe ser posterior a la de ingreso.",
  ESTADIA_MUY_LARGA: "Para estadías de más de 30 noches, consultá por WhatsApp.",
  CABANA_NO_ENCONTRADA: "No encontramos la cabaña.",
  SIN_PRECIO:
    "No hay un precio cargado para esta cabaña en la temporada actual. Consultá por WhatsApp.",
  ERROR_INTERNO: "No pudimos calcular el precio. Intentá de nuevo en unos minutos.",
};

export type ResultadoNoches =
  | { ok: true; noches: number }
  | { ok: false; motivo: "FECHAS_INVALIDAS" | "SALIDA_NO_POSTERIOR" };

const MS_POR_DIA = 86_400_000;

// Formato estricto: sin hora, sin espacios y con mes y día de dos dígitos.
const FORMATO_FECHA_ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

// Devuelve los milisegundos UTC de la medianoche del día indicado, o null.
function parsearFechaIso(valor: unknown): number | null {
  if (typeof valor !== "string") {
    return null;
  }

  const coincidencia = FORMATO_FECHA_ISO.exec(valor);
  if (!coincidencia) {
    return null;
  }

  const anio = Number(coincidencia[1]);
  const mes = Number(coincidencia[2]);
  const dia = Number(coincidencia[3]);

  // Date.UTC mapea los años 0-99 a 1900-1999: se restringe el rango aceptado.
  if (anio < 2000 || anio > 2100) {
    return null;
  }

  const ms = Date.UTC(anio, mes - 1, dia);
  const fecha = new Date(ms);

  // Descarta fechas de calendario inexistentes (por ejemplo 2026-02-30).
  if (
    fecha.getUTCFullYear() !== anio ||
    fecha.getUTCMonth() !== mes - 1 ||
    fecha.getUTCDate() !== dia
  ) {
    return null;
  }

  return ms;
}

export function nochesEntre(fechaIngreso: unknown, fechaSalida: unknown): ResultadoNoches {
  const ingresoMs = parsearFechaIso(fechaIngreso);
  const salidaMs = parsearFechaIso(fechaSalida);

  if (ingresoMs === null || salidaMs === null) {
    return { ok: false, motivo: "FECHAS_INVALIDAS" };
  }

  if (salidaMs <= ingresoMs) {
    return { ok: false, motivo: "SALIDA_NO_POSTERIOR" };
  }

  // En UTC la diferencia entre medianoches es exacta; el redondeo es defensivo.
  return { ok: true, noches: Math.round((salidaMs - ingresoMs) / MS_POR_DIA) };
}
