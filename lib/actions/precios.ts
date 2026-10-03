"use server";

import { prisma } from "@/lib/prisma";

function tramoFromNoches(noches: number): "UNA_NOCHE" | "DE_DOS_A_SEIS" | "SIETE_O_MAS" {
  if (noches === 1) return "UNA_NOCHE";
  if (noches <= 6) return "DE_DOS_A_SEIS";
  return "SIETE_O_MAS";
}

export async function calcularPrecio(
  propiedadId: string,
  fechaIngreso: string,
  fechaSalida: string,
  personas: number,
  promoSemanal: number = 0
): Promise<{ precioPorNoche: number; totalEstadia: number; noches: number } | { error: string}> {
  try {
    const [ingresoAno, ingresoMes, ingresoDia] = fechaIngreso.split("-").map(Number);
    const [salidaAno, salidaMes, salidaDia] = fechaSalida.split("-").map(Number);
    const ingreso = new Date(ingresoAno, ingresoMes - 1, ingresoDia);
    const salida = new Date(salidaAno, salidaMes - 1, salidaDia);

    if (salida <= ingreso) {
      return { error: "La fecha de salida debe ser posterior a la de ingreso" };
    }

    const noches = Math.round((salida.getTime() - ingreso.getTime()) / (1000 * 60 * 60 * 24));
    const tramo = tramoFromNoches(noches);

    const propiedad = await prisma.propiedad.findUnique({
      where: { id: propiedadId },
      select: { precioBase: true, promoSemanal: true },
    });

    if (!propiedad) {
      return { error: "Propiedad no encontrada" };
    }

    const base = propiedad.precioBase.toNumber() ?? 0;
    const promo = propiedad.promoSemanal.toNumber() ?? 0;
    const precioPorNoche = base;
    const totalSinDescuento = base * noches;
    // Aplicar promo solo para 7+ noches y si promo > 0
    const totalEstadia = (tramo === "SIETE_O_MAS" && promo > 0)
      ? totalSinDescuento * (1 - promo / 100)
      : totalSinDescuento;
    return { precioPorNoche, totalEstadia, noches };
  } catch {
    return { error: "Error al calcular el precio" };
  }
}