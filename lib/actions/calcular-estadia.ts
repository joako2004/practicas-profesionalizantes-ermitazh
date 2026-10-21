"use server";

import { estimarEstadia } from "@/lib/precios/estimar-estadia";
import type { RespuestaCalculoEstadia } from "@/lib/precios/estadia";

export async function calcularEstadia(
  propiedadId: unknown,
  fechaIngreso: unknown,
  fechaSalida: unknown,
): Promise<RespuestaCalculoEstadia> {
  return estimarEstadia(propiedadId, fechaIngreso, fechaSalida);
}
