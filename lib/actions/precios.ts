"use server";

import { prisma } from "@/lib/prisma";
import { TramoNoches } from "@prisma/client";

function tramoFromNoches(noches: number): TramoNoches {
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
): Promise<{ precioPorNoche: number; totalEstadia: number; noches: number } | { error: string }> {
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

    const precios = await prisma.precio.findMany({
      where: {
        propiedadId,
        activo: true,
        tramoNoches: tramo,
        fechaInicio: { lte: salida },
        fechaFin: { gte: ingreso },
      },
      orderBy: { cantidadPersonas: "asc" },
    });

    if (precios.length === 0) {
      const propiedad = await prisma.propiedad.findUnique({
        where: { id: propiedadId },
        select: { precioBase: true, promoSemanal: true },
      });
      const base = propiedad?.precioBase.toNumber() ?? 0;
      const promo = propiedad?.promoSemanal?.toNumber() ?? 0;
      const precioPorNoche = base;
      const totalSinDescuento = base * noches;
      // Aplicar promo solo para 7+ noches y si promo > 0
      const totalEstadia = (tramo === "SIETE_O_MAS" && promo > 0)
        ? totalSinDescuento * (1 - promo / 100)
        : totalSinDescuento;
      return { precioPorNoche, totalEstadia, noches };
    }

    const precioMatch = precios.find((p) => personas <= p.cantidadPersonas) ?? precios[precios.length - 1];
    const precioPorNoche = precioMatch.precioPorNoche.toNumber();

    // Aplicar promo solo para 7+ noches y si promo > 0
    const totalSinDescuento = precioPorNoche * noches;
    const totalEstadia = (tramo === "SIETE_O_MAS" && promoSemanal > 0)
      ? totalSinDescuento * (1 - promoSemanal / 100)
      : totalSinDescuento;

    return { precioPorNoche, totalEstadia, noches };
  } catch {
    return { error: "Error al calcular el precio" };
  }
}
