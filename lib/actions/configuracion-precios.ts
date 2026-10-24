"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { esAdmin } from "@/lib/auth/perfil";
import { esTipoDolar, type TipoDolar } from "@/lib/cotizacion";
import { esTemporada } from "@/lib/configuracion-precios";
import type { Temporada } from "@/lib/precios/calcular";

interface ResultadoTipoDolar {
  success: boolean;
  error?: string;
  tipoDolar?: TipoDolar;
}

interface ResultadoTemporada {
  success: boolean;
  error?: string;
  temporadaActiva?: Temporada;
}

function revalidarVistasDePrecios(): void {
  revalidatePath("/");
  revalidatePath("/cabanas/[id]", "page");
  revalidatePath("/admin/propiedades");
}

export async function actualizarTipoDolar(tipo: unknown): Promise<ResultadoTipoDolar> {
  if (!(await esAdmin())) {
    return { success: false, error: "No autorizado." };
  }

  if (!esTipoDolar(tipo)) {
    return { success: false, error: "Tipo de dólar no válido." };
  }

  try {
    await prisma.configuracionPrecios.upsert({
      where: { id: 1 },
      create: { id: 1, tipoDolar: tipo },
      update: { tipoDolar: tipo },
    });
    revalidarVistasDePrecios();
    return { success: true, tipoDolar: tipo };
  } catch (error) {
    console.error("Error al actualizar el tipo de dólar:", error);
    return { success: false, error: "Error interno del servidor al actualizar el tipo de dólar." };
  }
}

export async function actualizarTemporadaActiva(temporada: unknown): Promise<ResultadoTemporada> {
  if (!(await esAdmin())) {
    return { success: false, error: "No autorizado." };
  }

  if (!esTemporada(temporada)) {
    return { success: false, error: "Temporada no válida." };
  }

  try {
    await prisma.configuracionPrecios.upsert({
      where: { id: 1 },
      create: { id: 1, temporadaActiva: temporada },
      update: { temporadaActiva: temporada },
    });
    revalidarVistasDePrecios();
    return { success: true, temporadaActiva: temporada };
  } catch (error) {
    console.error("Error al actualizar la temporada activa:", error);
    return { success: false, error: "Error interno del servidor al actualizar la temporada activa." };
  }
}
