import { NextRequest, NextResponse } from "next/server";

import { obtenerDisponibilidadPublica } from "@/lib/disponibilidad/servidor";

/**
 * GET /api/disponibilidad
 *
 * Ruta pública (sin autenticación) que devuelve la ventana de disponibilidad y,
 * por cabaña activa, solo su id, capacidad y noches bloqueadas. No expone
 * nombres, precios ni datos de reservas o huéspedes. Sin caché: cada pedido
 * lee la base.
 *
 * El rate limiting se delega al firewall de Vercel antes de producción.
 */

// Next 16: los route handlers GET ya son dinámicos por defecto y cacheComponents
// no está activo, así que force-dynamic es compatible y deja la intención explícita.
export const dynamic = "force-dynamic";

/** Ids de cabaña permitidos en el query param: alfanuméricos, guion y guion bajo. */
const PATRON_ID = /^[A-Za-z0-9_-]{1,64}$/;

/** Respuesta JSON con el header que impide cualquier caché. */
function respuestaJson(datos: unknown, status: number): NextResponse {
  return NextResponse.json(datos, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const propiedadId = searchParams.get("propiedadId");

    if (propiedadId !== null && !PATRON_ID.test(propiedadId)) {
      return respuestaJson({ error: "Parámetro inválido." }, 400);
    }

    const disponibilidad = await obtenerDisponibilidadPublica(
      propiedadId === null ? undefined : { propiedadId },
    );

    if (disponibilidad === null) {
      return respuestaJson({ error: "La cabaña no existe." }, 404);
    }

    return respuestaJson(disponibilidad, 200);
  } catch (error) {
    // El detalle queda en el servidor: al cliente solo va un mensaje genérico.
    console.error("Error al obtener la disponibilidad:", error);
    return respuestaJson(
      { error: "No se pudo obtener la disponibilidad." },
      500,
    );
  }
}
