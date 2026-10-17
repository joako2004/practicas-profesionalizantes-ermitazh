import type { Cotizacion } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const TIPOS_DOLAR = [
  "blue",
  "oficial",
  "bolsa",
  "contadoconliqui",
  "mayorista",
  "cripto",
  "tarjeta",
] as const;

export type TipoDolar = (typeof TIPOS_DOLAR)[number];

export const TIPO_DOLAR_DEFECTO: TipoDolar = "blue";

export const ETIQUETAS_TIPO_DOLAR: Record<TipoDolar, string> = {
  blue: "Dólar blue",
  oficial: "Dólar oficial",
  bolsa: "Dólar MEP (bolsa)",
  contadoconliqui: "Dólar contado con liquidación",
  mayorista: "Dólar mayorista",
  cripto: "Dólar cripto",
  tarjeta: "Dólar tarjeta",
};

export function esTipoDolar(valor: unknown): valor is TipoDolar {
  return typeof valor === "string" && (TIPOS_DOLAR as readonly string[]).includes(valor);
}

export type CotizacionDolar = {
  tipo: TipoDolar;
  venta: number;
  compra: number | null;
  fechaApi: Date | null;
  obtenidaEn: Date;
  desactualizada: boolean;
};

const URL_API_DOLARES = "https://dolarapi.com/v1/dolares";
// La tabla cotizaciones es la caché: pasado el TTL se consulta la API de nuevo
const TTL_COTIZACION_MS = 30 * 60 * 1000;
const TIMEOUT_API_MS = 4000;
// Si la API está caída y los datos guardados vencidos, sin backoff cada visita
// esperaría el timeout completo (4 s); con esto se reintenta recién a los 5 minutos
const BACKOFF_FALLO_MS = 5 * 60 * 1000;

// Momento (ms) a partir del cual se puede volver a llamar a la API tras un fallo.
// Es por proceso/instancia: mejor esfuerzo, no reemplaza la persistencia en base.
let reintentoPermitidoDesde = 0;

const FILTRO_TIPOS = { tipo: { in: [...TIPOS_DOLAR] } };

type CotizacionParseada = {
  tipo: TipoDolar;
  compra: number | null;
  venta: number;
  fechaApi: Date | null;
};

// Devuelve el valor solo si es un número finito mayor que 0; si no, null
function numeroPositivo(valor: unknown): number | null {
  return typeof valor === "number" && Number.isFinite(valor) && valor > 0 ? valor : null;
}

// Función pura: valida y normaliza la respuesta cruda de dolarapi.com.
// Ignora los items inválidos en lugar de lanzar; ante casas repetidas conserva la primera.
export function parsearRespuestaApi(json: unknown): CotizacionParseada[] {
  if (!Array.isArray(json)) return [];

  const resultado: CotizacionParseada[] = [];
  const casasVistas = new Set<TipoDolar>();

  for (const item of json) {
    if (typeof item !== "object" || item === null) continue;
    const campos = item as Record<string, unknown>;

    const casa = campos.casa;
    if (!esTipoDolar(casa) || casasVistas.has(casa)) continue;

    const venta = numeroPositivo(campos.venta);
    if (venta === null) continue;

    const compra = numeroPositivo(campos.compra);

    let fechaApi: Date | null = null;
    if (typeof campos.fechaActualizacion === "string") {
      const fecha = new Date(campos.fechaActualizacion);
      if (!Number.isNaN(fecha.getTime())) fechaApi = fecha;
    }

    casasVistas.add(casa);
    resultado.push({ tipo: casa, compra, venta, fechaApi });
  }

  return resultado;
}

// Una sola llamada a la API refresca las 7 casas (upsert de todas las válidas).
// Nunca lanza: ante cualquier error avisa por consola y devuelve false.
async function refrescarDesdeApi(): Promise<boolean> {
  // Durante el backoff no se llama a la API ni se avisa por consola
  if (Date.now() < reintentoPermitidoDesde) return false;

  try {
    const respuesta = await fetch(URL_API_DOLARES, {
      signal: AbortSignal.timeout(TIMEOUT_API_MS),
      cache: "no-store",
      headers: { Accept: "application/json" },
    });

    if (!respuesta.ok) {
      console.warn(`Cotización: la API respondió con estado ${respuesta.status}`);
      reintentoPermitidoDesde = Date.now() + BACKOFF_FALLO_MS;
      return false;
    }

    const cotizaciones = parsearRespuestaApi(await respuesta.json());
    if (cotizaciones.length === 0) {
      console.warn("Cotización: la API no devolvió casas válidas");
      reintentoPermitidoDesde = Date.now() + BACKOFF_FALLO_MS;
      return false;
    }

    const ahora = new Date();
    for (const cotizacion of cotizaciones) {
      await prisma.cotizacion.upsert({
        where: { tipo: cotizacion.tipo },
        create: {
          tipo: cotizacion.tipo,
          compra: cotizacion.compra,
          venta: cotizacion.venta,
          fechaApi: cotizacion.fechaApi,
          // Explicito para no depender del default de la base y compartir el mismo instante
          obtenidaEn: ahora,
        },
        update: {
          compra: cotizacion.compra,
          venta: cotizacion.venta,
          fechaApi: cotizacion.fechaApi,
          // Renueva la marca de tiempo para reiniciar el TTL
          obtenidaEn: ahora,
        },
      });
    }

    reintentoPermitidoDesde = 0;

    return true;
  } catch {
    // Timeout, API caída o error de base: se informa y se sigue usando lo guardado
    console.warn("Cotización: no se pudo refrescar desde la API");
    reintentoPermitidoDesde = Date.now() + BACKOFF_FALLO_MS;
    return false;
  }
}

// Solo para pruebas: reinicia el backoff
export function reiniciarBackoffCotizacion(): void {
  reintentoPermitidoDesde = 0;
}

function estaVencida(obtenidaEn: Date): boolean {
  return Date.now() - obtenidaEn.getTime() >= TTL_COTIZACION_MS;
}

// Los Decimal de Prisma se convierten con .toNumber() antes de salir del servicio
function aCotizacionDolar(fila: Cotizacion, tipo: TipoDolar): CotizacionDolar {
  return {
    tipo,
    venta: fila.venta.toNumber(),
    compra: fila.compra === null ? null : fila.compra.toNumber(),
    fechaApi: fila.fechaApi,
    obtenidaEn: fila.obtenidaEn,
    desactualizada: estaVencida(fila.obtenidaEn),
  };
}

export async function obtenerCotizacion(tipo: TipoDolar): Promise<CotizacionDolar | null> {
  try {
    let fila = await prisma.cotizacion.findUnique({ where: { tipo } });

    // Solo se consulta la API si falta la fila o si venció el TTL de 30 minutos
    if (!fila || estaVencida(fila.obtenidaEn)) {
      await refrescarDesdeApi();
      fila = await prisma.cotizacion.findUnique({ where: { tipo } });
    }

    return fila ? aCotizacionDolar(fila, tipo) : null;
  } catch {
    console.warn("Cotización: error de base al obtener la cotización");
    return null;
  }
}

export async function obtenerCotizaciones(): Promise<CotizacionDolar[]> {
  try {
    let filas = await prisma.cotizacion.findMany({ where: FILTRO_TIPOS });

    // Una sola llamada a la API alcanza para refrescar todas las casas
    if (filas.length === 0 || filas.some((fila) => estaVencida(fila.obtenidaEn))) {
      await refrescarDesdeApi();
      filas = await prisma.cotizacion.findMany({ where: FILTRO_TIPOS });
    }

    const porTipo = new Map<string, Cotizacion>();
    for (const fila of filas) {
      if (!porTipo.has(fila.tipo)) porTipo.set(fila.tipo, fila);
    }

    // Se ordenan según TIPOS_DOLAR y se omiten las casas ausentes
    return TIPOS_DOLAR.flatMap((tipo) => {
      const fila = porTipo.get(tipo);
      return fila ? [aCotizacionDolar(fila, tipo)] : [];
    });
  } catch {
    console.warn("Cotización: error de base al obtener las cotizaciones");
    return [];
  }
}

export async function obtenerTipoDolarActivo(): Promise<TipoDolar> {
  try {
    const configuracion = await prisma.configuracionPrecios.findUnique({ where: { id: 1 } });
    if (configuracion && esTipoDolar(configuracion.tipoDolar)) {
      return configuracion.tipoDolar;
    }
    return TIPO_DOLAR_DEFECTO;
  } catch {
    console.warn("Cotización: error de base al leer el tipo de dólar activo");
    return TIPO_DOLAR_DEFECTO;
  }
}

export async function obtenerCotizacionActiva(): Promise<CotizacionDolar | null> {
  const tipo = await obtenerTipoDolarActivo();
  return obtenerCotizacion(tipo);
}
