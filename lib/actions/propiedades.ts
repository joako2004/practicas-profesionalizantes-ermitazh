"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

interface UpdatePropiedadResult {
  success: boolean;
  error?: string;
  propiedad?: {
    id: string;
    nombre: string;
    descripcion: string;
    capacidad: number;
    precioBase: number;
    promoSemanal: number | null;
    precioNocheAlta: number;
    promoSemanalAlta: number;
    precioNocheBaja: number;
    promoSemanalBaja: number;
    servicios: string[];
    activa: boolean;
  };
}

export async function updatePropiedadAtributo(
  propiedadId: string,
  campo: string,
  valor: unknown
): Promise<UpdatePropiedadResult> {
  try {
    const propiedadExistente = await prisma.propiedad.findUnique({
      where: { id: propiedadId },
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
      case "precioBase": {
        const num = typeof valor === "number" ? valor : parseFloat(String(valor));
        if (isNaN(num) || num < 0) {
          return { success: false, error: "El precio base debe ser un número válido mayor o igual a 0" };
        }
        dataToUpdate.precioBase = Math.round(num * 100) / 100;
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
      case "precioNocheAlta": {
        const num = typeof valor === "number" ? valor : parseFloat(String(valor));
        if (isNaN(num) || num < 0) {
          return { success: false, error: "El precio nocturna alta debe ser un número mayor o igual a 0" };
        }
        dataToUpdate.precioNocheAlta = Math.round(num * 100) / 100;
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
      case "promoSemanal": {
        const num = typeof valor === "number" ? valor : parseFloat(String(valor));
        if (!Number.isFinite(num) || num < 0) {
          return { success: false, error: "La promo semanal debe ser un número mayor o igual a 0" };
        }
        dataToUpdate.promoSemanal = Math.round(num * 100) / 100;
        break;
      }
      case "precioNocheBaja": {
        const num = typeof valor === "number" ? valor : parseFloat(String(valor));
        if (isNaN(num) || num < 0) {
          return { success: false, error: "El precio nocturna baja debe ser un número mayor o igual a 0" };
        }
        dataToUpdate.precioNocheBaja = Math.round(num * 100) / 100;
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
      default:
        return { success: false, error: `Campo no editable: ${campo}` };
    }

    const propiedadActualizada = await prisma.propiedad.update({
      where: { id: propiedadId },
      data: dataToUpdate,
    });

    revalidatePath("/admin/propiedades");
    revalidatePath("/");

    return {
      success: true,
      propiedad: {
        id: propiedadActualizada.id,
        nombre: propiedadActualizada.nombre,
        descripcion: propiedadActualizada.descripcion,
        capacidad: propiedadActualizada.capacidad,
        precioBase: Number(propiedadActualizada.precioBase),
        promoSemanal: Number(propiedadActualizada.promoSemanal),
        precioNocheAlta: Number(propiedadActualizada.precioNocheAlta) ?? 0,
        promoSemanalAlta: Number(propiedadActualizada.promoSemanalAlta) ?? 0,
        precioNocheBaja: Number(propiedadActualizada.precioNocheBaja) ?? 0,
        promoSemanalBaja: Number(propiedadActualizada.promoSemanalBaja) ?? 0,
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
  precioBase: number;
  servicios?: string[];
}): Promise<UpdatePropiedadResult> {
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
    if (typeof data.precioBase !== "number" || data.precioBase < 0) {
      return { success: false, error: "El precio base debe ser un número válido" };
    }

    const propiedad = await prisma.propiedad.create({
      data: {
        nombre: data.nombre.trim(),
        descripcion: data.descripcion.trim(),
        capacidad: data.capacidad,
        precioBase: data.precioBase,
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
        precioBase: Number(propiedad.precioBase),
        promoSemanal: Number(propiedad.promoSemanal),
        precioNocheAlta: Number(propiedad.precioNocheAlta) ?? 0,
        promoSemanalAlta: Number(propiedad.promoSemanalAlta) ?? 0,
        precioNocheBaja: Number(propiedad.precioNocheBaja) ?? 0,
        promoSemanalBaja: Number(propiedad.promoSemanalBaja) ?? 0,
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