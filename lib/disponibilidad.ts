import { prisma } from "@/lib/prisma";

export async function hayConflictoFecha(
  propiedadId: string,
  fechaInicio: Date,
  fechaFin: Date
): Promise<boolean> {
  const conflictos = await prisma.reserva.count({
    where: {
      propiedadId,
      estado: "PENDIENTE",
      OR: [
        {
          fechaIngreso: {
            lt: fechaFin,
          },
          fechaSalida: {
            gt: fechaInicio,
          },
        },
      ],
    },
  });

  return conflictos > 0;
}