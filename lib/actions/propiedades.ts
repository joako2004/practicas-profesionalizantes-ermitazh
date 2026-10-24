"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { esAdmin } from "@/lib/auth/perfil";
import { esCampoUsd, validarPrecioUsd } from "@/lib/precios/validar";

interface UpdatePropiedadResult {
  success: boolean;
  error?: string;
  propiedad?: {
    id: string;
    nombre: string;
    descripcion: string;
    capacidad: number;
    promoSemanalAlta: number;
    promoSemanalBaja: number;
    servicios: string[];
    activa: boolean;
    precioNocheAltaUsd: number | null;
    precioNocheBajaUsd: number | null;
    precio2a6AltaUsd: number | null;
    precio2a6BajaUsd: number | null;
  };
}

// Convierte el Decimal de Prisma (o null/undefined) a number | null, nunca a 0.
function decimalANumero(valor: { toNumber: () => number } | null | undefined): number | null {
  return valor == null ? null : valor.toNumber();
}

export async function updatePropiedadAtributo(
  propiedadId: string,
  campo: string,
  valor: unknown
): Promise<UpdatePropiedadResult> {
  if (!(await esAdmin())) {
    return { success: false, error: "No autorizado." };
  }
  try {
    const propiedadExistente = await prisma.propiedad.findUnique({
      where: { id: propiedadId },
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        capacidad: true,
        promoSemanalAlta: true,
        promoSemanalBaja: true,
        servicios: true,
        activa: true,
      },
    });

    if (!propiedadExistente) {
      return { success: false, error: "Propiedad no encontrada" };
    }

    const dataToUpdate: Record<string, unknown> = {};

    switch (campo) {
      case "nombre": {
        if (typeof valor !== "string" || valor.trim() === "") {
          return { success: false, error: "El nombre no puede estar vacío" };
        }
        dataToUpdate.nombre = valor.trim();
        break;
      }
      case "descripcion": {
        if (typeof valor !== "string" || valor.trim() === "") {
          return { success: false, error: "La descripción no puede estar vacía" };
        }
        dataToUpdate.descripcion = valor.trim();
        break;
      }
      case "capacidad": {
        const num = typeof valor === "number" ? valor : parseInt(String(valor), 10);
        if (!Number.isInteger(num) || num <= 0) {
          return { success: false, error: "La capacidad debe ser un número entero mayor a 0" };
        }
        dataToUpdate.capacidad = num;
        break;
      }
      case "orden": {
        const num = typeof valor === "number" ? valor : parseInt(String(valor), 10);
        if (!Number.isInteger(num) || num < 0) {
          return { success: false, error: "El orden debe ser un número entero mayor o igual a 0" };
        }
        dataToUpdate.orden = num;
        break;
      }
      case "servicios": {
        if (!Array.isArray(valor)) {
          return { success: false, error: "Los servicios deben ser un array" };
        }
        dataToUpdate.servicios = valor
          .map((s) => String(s).trim())
          .filter((s) => s.length > 0);
        break;
      }
      case "activa": {
        if (typeof valor !== "boolean") {
          return { success: false, error: "El campo activa debe ser un booleano" };
        }
        dataToUpdate.activa = valor;
        break;
      }
      case "promoSemanalAlta": {
        const num = typeof valor === "number" ? valor : parseFloat(String(valor));
        if (!Number.isFinite(num) || num < 0 || num > 100) {
          return { success: false, error: "La promo semanal alta debe ser un número entre 0 y 100" };
        }
        dataToUpdate.promoSemanalAlta = Math.round(num * 100) / 100;
        break;
      }
      case "promoSemanalBaja": {
        const num = typeof valor === "number" ? valor : parseFloat(String(valor));
        if (!Number.isFinite(num) || num < 0 || num > 100) {
          return { success: false, error: "La promo semanal baja debe ser un número entre 0 y 100" };
        }
        dataToUpdate.promoSemanalBaja = Math.round(num * 100) / 100;
        break;
      }
      case "precioNocheAltaUsd":
      case "precioNocheBajaUsd":
      case "precio2a6AltaUsd":
      case "precio2a6BajaUsd": {
        // Vaciar el precio de 1 noche deja la cabaña en "Consultar" para esa temporada
        // aunque tenga cargado el 2-6; vaciar el 2-6 hace que se use el de 1 noche.
        // NO validar relación entre ambos (autonomía total del admin).
        const r = validarPrecioUsd(valor);
        if (!r.ok) {
          return { success: false, error: r.error };
        }
        if (esCampoUsd(campo)) {
          dataToUpdate[campo] = r.valor;
        }
        break;
      }
      default:
        return { success: false, error: `Campo no editable: ${campo}` };
    }

    const propiedadActualizada = await prisma.propiedad.update({
      where: { id: propiedadId },
      data: dataToUpdate,
    });

    revalidatePath("/admin/propiedades");
    revalidatePath("/");
    revalidatePath("/cabanas/[id]", "page");

    return {
      success: true,
      propiedad: {
        id: propiedadActualizada.id,
        nombre: propiedadActualizada.nombre,
        descripcion: propiedadActualizada.descripcion,
        capacidad: propiedadActualizada.capacidad,
        promoSemanalAlta: Number(propiedadActualizada.promoSemanalAlta) ?? 0,
        promoSemanalBaja: Number(propiedadActualizada.promoSemanalBaja) ?? 0,
        precioNocheAltaUsd: decimalANumero(propiedadActualizada.precioNocheAltaUsd),
        precioNocheBajaUsd: decimalANumero(propiedadActualizada.precioNocheBajaUsd),
        precio2a6AltaUsd: decimalANumero(propiedadActualizada.precio2a6AltaUsd),
        precio2a6BajaUsd: decimalANumero(propiedadActualizada.precio2a6BajaUsd),
        servicios: propiedadActualizada.servicios,
        activa: propiedadActualizada.activa,
      } as UpdatePropiedadResult["propiedad"],
    };
  } catch (error) {
    console.error("Error al actualizar propiedad:", error);
    return { success: false, error: "Error interno del servidor al actualizar la propiedad" };
  }
}

export async function crearPropiedad(data: {
  nombre: string;
  descripcion: string;
  capacidad: number;
  servicios?: string[];
}): Promise<UpdatePropiedadResult> {
  if (!(await esAdmin())) {
    return { success: false, error: "No autorizado." };
  }
  try {
    if (!data.nombre?.trim()) {
      return { success: false, error: "El nombre es obligatorio" };
    }
    if (!data.descripcion?.trim()) {
      return { success: false, error: "La descripción es obligatoria" };
    }
    if (!Number.isInteger(data.capacidad) || data.capacidad <= 0) {
      return { success: false, error: "La capacidad debe ser un número entero mayor a 0" };
    }

    const propiedad = await prisma.propiedad.create({
      data: {
        nombre: data.nombre.trim(),
        descripcion: data.descripcion.trim(),
        capacidad: data.capacidad,
        fotos: [],
        servicios: data.servicios?.map((s) => s.trim()).filter(Boolean) || [],
        activa: true,
      },
    });

    revalidatePath("/admin/propiedades");

    return {
      success: true,
      propiedad: {
        id: propiedad.id,
        nombre: propiedad.nombre,
        descripcion: propiedad.descripcion,
        capacidad: propiedad.capacidad,
        promoSemanalAlta: Number(propiedad.promoSemanalAlta) ?? 0,
        promoSemanalBaja: Number(propiedad.promoSemanalBaja) ?? 0,
        precioNocheAltaUsd: decimalANumero(propiedad.precioNocheAltaUsd),
        precioNocheBajaUsd: decimalANumero(propiedad.precioNocheBajaUsd),
        precio2a6AltaUsd: decimalANumero(propiedad.precio2a6AltaUsd),
        precio2a6BajaUsd: decimalANumero(propiedad.precio2a6BajaUsd),
        servicios: propiedad.servicios,
        activa: propiedad.activa,
      },
    };
  } catch (error) {
    console.error("Error al crear propiedad:", error);
    return { success: false, error: "Error interno del servidor al crear la propiedad" };
  }
}

export async function eliminarPropiedad(propiedadId: string): Promise<UpdatePropiedadResult> {
  if (!(await esAdmin())) {
    return { success: false, error: "No autorizado." };
  }
  try {
    const propiedad = await prisma.propiedad.findUnique({
      where: { id: propiedadId },
      include: {
        reservas: {
          where: {
            estado: { not: "CANCELADA" },
          },
        },
      },
    });

    if (!propiedad) {
      return { success: false, error: "Propiedad no encontrada" };
    }

    if (propiedad.reservas.length > 0) {
      return {
        success: false,
        error: `No se puede eliminar: tiene ${propiedad.reservas.length} reserva(s) activa(s)`,
      };
    }

    await prisma.propiedad.delete({ where: { id: propiedadId } });

    revalidatePath("/admin/propiedades");

    return { success: true };
  } catch (error) {
    console.error("Error al eliminar propiedad:", error);
    return { success: false, error: "Error interno del servidor al eliminar la propiedad" };
  }
}