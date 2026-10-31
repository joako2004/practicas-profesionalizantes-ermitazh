"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { esAdmin } from "@/lib/auth/perfil";
import {
  nochesDeRangoAdmin,
  type ResultadoNochesAdmin,
} from "@/lib/disponibilidad/rangos-admin";

// Resultado común de las acciones del calendario de disponibilidad.
type ResultadoNoches = { success: true; cantidad: number } | { success: false; error: string };

// Motivos de rechazo que puede devolver la validación pura del rango.
type RangoRechazado = Extract<ResultadoNochesAdmin, { ok: false }>;

// Traduce el motivo técnico a un mensaje visible para el administrador.
function mensajeDeRechazo(rechazo: RangoRechazado): string {
  switch (rechazo.motivo) {
    case "FECHA_INVALIDA":
      return "Las fechas no son válidas.";
    case "RANGO_INVALIDO":
      return "La fecha de fin no puede ser anterior a la de inicio.";
    case "EXCEDE_MAXIMO":
      return `Podés marcar hasta ${rechazo.maximo} noches por vez.`;
  }
}

/**
 * Bloquea las noches del rango inclusivo [desde, hasta] de una cabaña.
 * Las noches que ya estaban bloqueadas no se duplican.
 */
export async function bloquearNoches(
  propiedadId: string,
  desde: string,
  hasta: string,
): Promise<ResultadoNoches> {
  if (!(await esAdmin())) {
    return { success: false, error: "No autorizado." };
  }

  // Los parámetros llegan del cliente: se validan en tiempo de ejecución.
  if (
    typeof propiedadId !== "string" ||
    propiedadId.trim() === "" ||
    typeof desde !== "string" ||
    typeof hasta !== "string"
  ) {
    return { success: false, error: "Datos inválidos." };
  }

  const rango = nochesDeRangoAdmin(desde, hasta);
  if (!rango.ok) {
    return { success: false, error: mensajeDeRechazo(rango) };
  }

  try {
    const propiedad = await prisma.propiedad.findUnique({
      where: { id: propiedadId },
      select: { id: true },
    });

    if (!propiedad) {
      return { success: false, error: "La cabaña no existe." };
    }

    const creadas = await prisma.nocheBloqueada.createMany({
      data: rango.fechas.map((fecha) => ({ propiedadId, fecha })),
      skipDuplicates: true,
    });

    revalidatePath("/admin/disponibilidad");

    return { success: true, cantidad: creadas.count };
  } catch (error) {
    console.error("Error al bloquear noches:", error);
    return {
      success: false,
      error: "No se pudo guardar el cambio. Probá de nuevo.",
    };
  }
}

/**
 * Libera las noches del rango inclusivo [desde, hasta] de una cabaña.
 * Solo cuenta las noches que estaban bloqueadas y se borraron.
 */
export async function liberarNoches(
  propiedadId: string,
  desde: string,
  hasta: string,
): Promise<ResultadoNoches> {
  if (!(await esAdmin())) {
    return { success: false, error: "No autorizado." };
  }

  // Los parámetros llegan del cliente: se validan en tiempo de ejecución.
  if (
    typeof propiedadId !== "string" ||
    propiedadId.trim() === "" ||
    typeof desde !== "string" ||
    typeof hasta !== "string"
  ) {
    return { success: false, error: "Datos inválidos." };
  }

  const rango = nochesDeRangoAdmin(desde, hasta);
  if (!rango.ok) {
    return { success: false, error: mensajeDeRechazo(rango) };
  }

  try {
    const propiedad = await prisma.propiedad.findUnique({
      where: { id: propiedadId },
      select: { id: true },
    });

    if (!propiedad) {
      return { success: false, error: "La cabaña no existe." };
    }

    // El rango es contiguo, así que alcanza con la primera y la última noche.
    const primeraFecha = rango.fechas[0];
    const ultimaFecha = rango.fechas[rango.fechas.length - 1];

    const liberadas = await prisma.nocheBloqueada.deleteMany({
      where: {
        propiedadId,
        fecha: { gte: primeraFecha, lte: ultimaFecha },
      },
    });

    revalidatePath("/admin/disponibilidad");

    return { success: true, cantidad: liberadas.count };
  } catch (error) {
    console.error("Error al liberar noches:", error);
    return {
      success: false,
      error: "No se pudo guardar el cambio. Probá de nuevo.",
    };
  }
}
