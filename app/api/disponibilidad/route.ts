import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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

  if (fechaIn >= fechaFinDate) {
    return new Response(
      JSON.stringify({ error: "La fecha de inicio debe ser anterior a la fecha de fin" }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const conflictos = await prisma.reserva.count({
    where: {
      propiedadId,
      estado: "PENDIENTE",
      OR: [
        {
          fechaIngreso: {
            lt: fechaFinDate,
          },
          fechaSalida: {
            gt: fechaIn,
          },
        },
      ],
    },
  });

  return new Response(
    JSON.stringify({ disponible: conflictos === 0 }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
}