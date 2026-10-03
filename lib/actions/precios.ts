"use server";

import { prisma } from "@/lib/prisma";

// Función pura: calcula el precio total dado el precio por noche, noches y promo
// No tiene efectos secundarios ni acceso a la base de datos
function calcularPrecioPure(
  precioNoche: number,
  noches: number,
  promoSemanal: number = 0
): number {
  let total = precioNoche * noches;
  if (noches >= 7) {
    total = total * (1 - promoSemanal / 100);
  }
  return Math.round(total * 100) / 100;
}

export async function calcularPrecio(
  propiedadId: string,
  fechaIngreso: string,
  fechaSalida: string,
  personas: number,
  temporada: "alta" | "baja" = "alta"
): Promise<{
  precioPorNoche: number;
  totalEstadia: number;
  noches: number;
} | { error: string}> {
  try {
    const [ingresoAno, ingresoMes, ingresoDia] = fechaIngreso.split("-").map(Number);
    const [salidaAno, salidaMes, salidaDia] = fechaSalida.split("-").map(Number);
    const ingreso = new Date(ingresoAno, ingresoMes - 1, ingresoDia);
    const salida = new Date(salidaAno, salidaMes - 1, salidaDia);

    if (salida <= ingreso) {
      return { error: "La fecha de salida debe ser posterior a la de ingreso" };
    }

    const noches = Math.round((salida.getTime() - ingreso.getTime()) / (1000 * 60 * 60 * 24));

    const propiedad = await prisma.propiedad.findUnique({
      where: { id: propiedadId },
      select: {
        precioNocheAlta: true,
        promoSemanalAlta: true,
        precioNocheBaja: true,
        promoSemanalBaja: true,
      },
    });

    if (!propiedad) {
      return { error: "Propiedad no encontrada" };
    }

// Seleccionar precio y promo según la temporada
    // Los campos de Prisma son Decimal, convertimos a number usando .toNumber()
    const precioNoche = temporada === "alta"
      ? Number(propiedad.precioNocheAlta.toNumber()) ?? 0
      : Number(propiedad.precioNocheBaja.toNumber()) ?? 0;
    const promoSemanal = temporada === "alta"
      ? Number(propiedad.promoSemanalAlta.toNumber()) ?? 0
      : Number(propiedad.promoSemanalBaja.toNumber()) ?? 0;

    const totalEstadia = calcularPrecioPure(precioNoche, noches, promoSemanal);

    return { precioPorNoche: precioNoche, totalEstadia, noches };
  } catch {
    return { error: "Error al calcular el precio" };
  }
}