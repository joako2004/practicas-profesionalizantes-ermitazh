"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { esAdmin } from "@/lib/auth/perfil";

interface ResenaAdminResult {
  success: boolean;
  error?: string;
}

function idValido(id: unknown): id is string {
  return typeof id === "string" && id.trim() !== "" && id.length <= 100;
}

function revalidarResenas(): void {
  revalidatePath("/");
  revalidatePath("/cabanas/[id]", "page");
  revalidatePath("/admin/resenas");
}

async function cambiarPublicacion(
  id: unknown,
  publicada: boolean
): Promise<ResenaAdminResult> {
  if (!(await esAdmin())) {
    return { success: false, error: "No autorizado." };
  }
  if (!idValido(id)) {
    return { success: false, error: "Identificador de reseña inválido." };
  }
  try {
    const resultado = await prisma.resena.updateMany({
      where: { id },
      data: { publicada },
    });
    if (resultado.count === 0) {
      return { success: false, error: "Reseña no encontrada." };
    }
    revalidarResenas();
    return { success: true };
  } catch (error) {
    console.error("Error al actualizar la publicación de la reseña:", error);
    return {
      success: false,
      error: "Error interno del servidor al actualizar la reseña.",
    };
  }
}

export async function aprobarResena(id: unknown): Promise<ResenaAdminResult> {
  return cambiarPublicacion(id, true);
}

export async function despublicarResena(
  id: unknown
): Promise<ResenaAdminResult> {
  return cambiarPublicacion(id, false);
}

export async function rechazarResena(id: unknown): Promise<ResenaAdminResult> {
  if (!(await esAdmin())) {
    return { success: false, error: "No autorizado." };
  }
  if (!idValido(id)) {
    return { success: false, error: "Identificador de reseña inválido." };
  }
  try {
    const resultado = await prisma.resena.deleteMany({ where: { id } });
    if (resultado.count === 0) {
      return { success: false, error: "Reseña no encontrada." };
    }
    revalidarResenas();
    return { success: true };
  } catch (error) {
    console.error("Error al rechazar la reseña:", error);
    return {
      success: false,
      error: "Error interno del servidor al eliminar la reseña.",
    };
  }
}