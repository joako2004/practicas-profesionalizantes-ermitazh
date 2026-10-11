"use server";

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { obterPerfilActual } from "@/lib/auth/perfil";

interface CrearResenaResult {
  success: boolean;
  error?: string;
}

const TEXTO_MIN = 10;
const TEXTO_MAX = 1000;

export async function crearResena(
  propiedadId: unknown,
  puntuacion: unknown,
  texto: unknown
): Promise<CrearResenaResult> {
  try {
    const sesion = await obterPerfilActual();
    if (!sesion) {
      return { success: false, error: "Iniciá sesión para dejar una reseña." };
    }

    if (typeof propiedadId !== "string" || propiedadId.trim() === "") {
      return { success: false, error: "Cabaña inválida." };
    }
    if (
      typeof puntuacion !== "number" ||
      !Number.isInteger(puntuacion) ||
      puntuacion < 1 ||
      puntuacion > 5
    ) {
      return {
        success: false,
        error: "La puntuación debe ser un número entero de 1 a 5.",
      };
    }
    const textoLimpio = typeof texto === "string" ? texto.trim() : "";
    if (textoLimpio.length < TEXTO_MIN || textoLimpio.length > TEXTO_MAX) {
      return {
        success: false,
        error: `La reseña debe tener entre ${TEXTO_MIN} y ${TEXTO_MAX} caracteres.`,
      };
    }

    const propiedad = await prisma.propiedad.findFirst({
      where: { id: propiedadId, activa: true },
      select: { id: true },
    });
    if (!propiedad) {
      return { success: false, error: "Cabaña no encontrada." };
    }

    const existente = await prisma.resena.findFirst({
      where: { perfilId: sesion.user.id, propiedadId: propiedad.id },
      select: { id: true },
    });
    if (existente) {
      return {
        success: false,
        error: "Ya dejaste una reseña para esta cabaña.",
      };
    }

    if (!sesion.perfil) {
      if (!sesion.user.email) {
        return { success: false, error: "No pudimos completar tu perfil." };
      }
      await prisma.perfil.upsert({
        where: { id: sesion.user.id },
        create: {
          id: sesion.user.id,
          email: sesion.user.email.toLowerCase(),
          rol: "HUESPED",
        },
        update: {},
      });
    }

    const nombre = (sesion.perfil?.nombre ?? "").trim();
    const inicial = (sesion.perfil?.apellido ?? "")
      .trim()
      .charAt(0)
      .toUpperCase();
    let autor = "Huésped";
    if (nombre !== "") {
      autor = inicial === "" ? nombre : `${nombre} ${inicial}.`;
    }

    try {
      await prisma.resena.create({
        data: {
          perfilId: sesion.user.id,
          propiedadId: propiedad.id,
          autor,
          texto: textoLimpio,
          puntuacion,
          publicada: false,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        return {
          success: false,
          error: "Ya dejaste una reseña para esta cabaña.",
        };
      }
      throw error;
    }

    return { success: true };
  } catch {
    return {
      success: false,
      error: "No pudimos guardar tu reseña. Probá de nuevo más tarde.",
    };
  }
}