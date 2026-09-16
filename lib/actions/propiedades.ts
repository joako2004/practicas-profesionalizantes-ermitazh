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
      default:
        return { success: false, error: `Campo no editable: ${campo}` };
    }

    const propiedadActualizada = await prisma.propiedad.update({
      where: { id: propiedadId },
      data: dataToUpdate,
    });

    revalidatePath("/admin/propiedades");

    return {
      success: true,
      propiedad: {
        id: propiedadActualizada.id,
        nombre: propiedadActualizada.nombre,
        descripcion: propiedadActualizada.descripcion,
        capacidad: propiedadActualizada.capacidad,
        precioBase: Number(propiedadActualizada.precioBase),
        servicios: propiedadActualizada.servicios,
        activa: propiedadActualizada.activa,
      },
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
        servicios: propiedad.servicios,
        activa: propiedad.activa,
      },
    };
  } catch (error) {
    console.error("Error al crear propiedad:", error);
    return { success: false, error: "Error interno del servidor al crear la propiedad" };
  }
}

interface PrecioOpcion {
  tramoNoches: "UNA_NOCHE" | "DE_DOS_A_SEIS" | "SIETE_O_MAS";
  precioPorNoche: number;
  tipoDia: "TODOS" | "SEMANA" | "FIN_DE_SEMANA";
  estanciaTemporada: "baja" | "alta";
}

export async function actualizarMenuPrecios(
  propiedadId: string,
  precios: PrecioOpcion[]
): Promise<UpdatePropiedadResult> {
  try {
    for (const p of precios) {
      await fetch("/api/precios", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          propiedadId,
          nombre: p.estanciaTemporada,
          fechaInicio: new Date().toISOString().split("T")[0],
          fechaFin: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          precioPorNoche: p.precioPorNoche,
          tramoNoches: p.tramoNoches,
          cantidadPersonas: 1,
          tipoDia: p.tipoDia,
          activo: true,
        }),
      });
    }

    revalidatePath("/admin/propiedades");

    return { success: true };
  } catch (error) {
    console.error("Error al actualizar menú de precios:", error);
    return {
      success: false,
      error: "Error interno del servidor al actualizar el menú de precios",
    };
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