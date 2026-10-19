import { prisma } from "@/lib/prisma";
import { esTipoDolar, TIPO_DOLAR_DEFECTO, type TipoDolar } from "@/lib/cotizacion";
import type { Temporada } from "@/lib/precios/calcular";

export const TEMPORADAS = ["ALTA", "BAJA"] as const satisfies readonly Temporada[];

export const TEMPORADA_DEFECTO: Temporada = "ALTA";

// Lista blanca sensible a mayúsculas: "alta" no es válida
export function esTemporada(valor: unknown): valor is Temporada {
  return valor === "ALTA" || valor === "BAJA";
}

export interface ConfiguracionPrecios {
  tipoDolar: TipoDolar;
  temporadaActiva: Temporada;
}

// Lee el singleton id = 1. Nunca lanza: ante error o fila ausente usa defaults.
export async function obtenerConfiguracionPrecios(): Promise<ConfiguracionPrecios> {
  try {
    const fila = await prisma.configuracionPrecios.findUnique({ where: { id: 1 } });

    if (!fila) {
      return { tipoDolar: TIPO_DOLAR_DEFECTO, temporadaActiva: TEMPORADA_DEFECTO };
    }

    return {
      tipoDolar: esTipoDolar(fila.tipoDolar) ? fila.tipoDolar : TIPO_DOLAR_DEFECTO,
      temporadaActiva: esTemporada(fila.temporadaActiva) ? fila.temporadaActiva : TEMPORADA_DEFECTO,
    };
  } catch {
    console.warn("Configuración de precios: error de base al leer la configuración");
    return { tipoDolar: TIPO_DOLAR_DEFECTO, temporadaActiva: TEMPORADA_DEFECTO };
  }
}

export async function obtenerTemporadaActiva(): Promise<Temporada> {
  const configuracion = await obtenerConfiguracionPrecios();
  return configuracion.temporadaActiva;
}
