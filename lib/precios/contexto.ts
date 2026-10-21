// Solo para servidor: importa prisma. No importar desde componentes "use client".
import {
  calcularPrecio,
  type PreciosPropiedadUsd,
  type Temporada,
} from "@/lib/precios/calcular";
import { obtenerConfiguracionPrecios } from "@/lib/configuracion-precios";
import { obtenerCotizacion } from "@/lib/cotizacion";

export interface ContextoPrecios {
  temporada: Temporada;
  cotizacionVenta: number | null;
}

// Una sola lectura de configuración y de la cotización del tipo activo por página.
// Nunca lanza: ambas funciones internas capturan sus propios errores.
export async function obtenerContextoPrecios(): Promise<ContextoPrecios> {
  const configuracion = await obtenerConfiguracionPrecios();
  const cotizacion = await obtenerCotizacion(configuracion.tipoDolar);
  return {
    temporada: configuracion.temporadaActiva,
    cotizacionVenta: cotizacion ? cotizacion.venta : null,
  };
}

// Precio "desde": una noche de la temporada activa, en pesos.
// Devuelve null si falta el precio o la cotización válida.
export function precioUnaNocheArs(
  precios: PreciosPropiedadUsd,
  contexto: ContextoPrecios
): number | null {
  const resultado = calcularPrecio({
    noches: 1,
    temporada: contexto.temporada,
    precios,
    cotizacionVenta: contexto.cotizacionVenta,
  });
  if (!resultado.ok) return null;
  const precioArs = resultado.precioNocheAplicadoArs;
  return typeof precioArs === "number" && Number.isFinite(precioArs) && precioArs > 0
    ? precioArs
    : null;
}
