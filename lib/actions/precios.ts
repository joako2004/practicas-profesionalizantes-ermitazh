"use server";

import { prisma } from "@/lib/prisma";

export async function calcularPrecio(
  propiedadId: string,
  fechaIngreso: string,
  fechaSalida: string,
  personas: number
): Promise<{ precioPorNoche: number; totalEstadia: number; noches: number } | { error: string }> {
  try {
    const ingreso = new Date(fechaIngreso);
    const salida = new Date(fechaSalida);

    if (salida <= ingreso) {
      return { error: "La fecha de salida debe ser posterior a la de ingreso" };
    }

    const diffMs = salida.getTime() - ingreso.getTime();
    const noches = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    const precios = await prisma.precio.findMany({
      where: {
        propiedadId,
        activo: true,
        fechaInicio: { lte: salida },
        fechaFin: { gte: ingreso },
      },
      orderBy: { cantidadPersonas: "asc" },
    });

    if (precios.length === 0) {
      const propiedad = await prisma.propiedad.findUnique({
        where: { id: propiedadId },
        select: { precioBase: true },
      });
      const base = propiedad?.precioBase.toNumber() ?? 0;
      return { precioPorNoche: base, totalEstadia: base * noches, noches };
    }

    const precioMenor = precios.find((p) => personas <= p.cantidadPersonas) ?? precios[precios.length - 1];
    const precioPorNoche = precioMenor.precioPorNoche.toNumber();

    return { precioPorNoche, totalEstadia: precioPorNoche * noches, noches };
  } catch {
    return { error: "Error al calcular el precio" };
  }
}
