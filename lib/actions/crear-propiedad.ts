"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { esAdmin } from "@/lib/auth/perfil";
import { claveNombre, validarNuevaPropiedad } from "@/lib/propiedades/validar-nueva";

export type ResultadoCrearPropiedad =
  | { success: true; id: string; nombre: string }
  | { success: false; error: string; errores?: Record<string, string> };

type ResultadoTransaccion =
  | { estado: "nombre-duplicado" }
  | { estado: "creada"; id: string; nombre: string };

/**
 * Crea una cabaña nueva a partir de los datos del formulario de alta.
 *
 * El orden, cuando no se indica, va al final del listado (máximo + 1). El
 * nombre se compara sin distinguir mayúsculas, tildes ni espacios repetidos
 * para evitar dos cabañas con el mismo nombre visible.
 */
export async function crearPropiedadNueva(
  entrada: unknown
): Promise<ResultadoCrearPropiedad> {
  if (!(await esAdmin())) {
    return { success: false, error: "No autorizado." };
  }

  try {
    const validacion = validarNuevaPropiedad(entrada);

    if (!validacion.ok) {
      return {
        success: false,
        error: "Revisá los campos marcados.",
        errores: validacion.errores,
      };
    }

    const valor = validacion.valor;

    const claveNueva = claveNombre(valor.nombre);

    const resultado = await prisma.$transaction(
      async (tx): Promise<ResultadoTransaccion> => {
        const existentes = await tx.propiedad.findMany({
          select: { nombre: true },
        });

        const duplicada = existentes.some(
          (propiedad) => claveNombre(propiedad.nombre) === claveNueva
        );

        if (duplicada) {
          return { estado: "nombre-duplicado" };
        }

        let ordenFinal: number;
        if (valor.orden !== null) {
          ordenFinal = valor.orden;
        } else {
          const agregado = await tx.propiedad.aggregate({
            _max: { orden: true },
          });
          ordenFinal = (agregado._max.orden ?? 0) + 1;
        }

        const creada = await tx.propiedad.create({
          data: {
            nombre: valor.nombre,
            descripcion: valor.descripcion,
            capacidad: valor.capacidad,
            orden: ordenFinal,
            activa: valor.activa,
            servicios: valor.servicios,
            fotos: [],
            precioNocheAltaUsd: valor.precioNocheAltaUsd,
            precioNocheBajaUsd: valor.precioNocheBajaUsd,
            precio2a6AltaUsd: valor.precio2a6AltaUsd,
            precio2a6BajaUsd: valor.precio2a6BajaUsd,
            promoSemanalAlta: valor.promoSemanalAlta,
            promoSemanalBaja: valor.promoSemanalBaja,
          },
          select: { id: true, nombre: true },
        });

        return { estado: "creada", id: creada.id, nombre: creada.nombre };
      }
    );

    if (resultado.estado === "nombre-duplicado") {
      return {
        success: false,
        error: "Revisá los campos marcados.",
        errores: { nombre: "Ya existe una cabaña con ese nombre." },
      };
    }

    revalidatePath("/admin/propiedades");
    revalidatePath("/admin/fotos");
    revalidatePath("/admin/disponibilidad");
    revalidatePath("/");
    revalidatePath("/pre-reserva");
    revalidatePath("/cabanas/[id]", "page");

    return { success: true, id: resultado.id, nombre: resultado.nombre };
  } catch (error) {
    console.error("Error al crear la propiedad nueva:", error);
    return {
      success: false,
      error: "No se pudo crear la propiedad. Intentá de nuevo.",
    };
  }
}
