import { hayConflictoFecha } from "@/lib/disponibilidad";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const propiedadId = searchParams.get("propiedad_id");
  const fechaInicio = searchParams.get("fecha_inicio");
  const fechaFin = searchParams.get("fecha_fin");

  if (!propiedadId || !fechaInicio || !fechaFin) {
    return new Response(
      JSON.stringify({ error: "Faltan parámetros: propiedad_id, fecha_inicio, fecha_fin" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const fechaIn = new Date(fechaInicio);
  const fechaFinDate = new Date(fechaFin);

  if (isNaN(fechaIn.getTime()) || isNaN(fechaFinDate.getTime())) {
    return new Response(
      JSON.stringify({ error: "Formato de fecha inválido" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  if (fechaIn >= fechaFinDate) {
    return new Response(
      JSON.stringify({ error: "La fecha de inicio debe ser anterior a la fecha de fin" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    const conflicto = await hayConflictoFecha(propiedadId, fechaIn, fechaFinDate);

    return new Response(
      JSON.stringify({ disponible: !conflicto }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error al consultar disponibilidad:", error);

    return new Response(
      JSON.stringify({ error: "Error interno del servidor." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}