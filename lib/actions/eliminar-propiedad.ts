"use server";

import { revalidatePath } from "next/cache";

import { esAdmin } from "@/lib/auth/perfil";
import { IMAGENES_HERO_FALLBACK } from "@/lib/config";
import { decidirBorradoArchivo } from "@/lib/fotos/referencias";
import {
  BUCKET_FOTOS,
  extraerPathDeUrl,
  obtenerPathsProtegidos,
} from "@/lib/fotos/rutas";
import { prisma } from "@/lib/prisma";
import { evaluarEliminacion } from "@/lib/propiedades/eliminacion";
import { crearClienteAdmin } from "@/lib/supabase/admin";

export type ResultadoEliminarPropiedad =
  | { success: true; nombre: string; archivosNoBorrados: number }
  | { success: false; error: string };

type PropiedadConFotos = {
  id: string;
  fotos: string[];
};

type ResultadoTransaccion =
  | { estado: "inexistente" }
  | { estado: "rechazada"; motivo: string }
  | {
      estado: "eliminada";
      nombre: string;
      fotos: string[];
      otrasPropiedades: PropiedadConFotos[];
      urlsImagenes: string[];
    };

const MENSAJE_NO_AUTORIZADO = "No autorizado.";
const MENSAJE_ID_INVALIDO = "Cabaña inválida.";
const MENSAJE_NO_EXISTE = "La cabaña no existe o ya fue eliminada.";
const MENSAJE_DEPENDENCIAS =
  "No se pudo eliminar porque la cabaña tiene datos asociados. Para no perder el historial, desactivala en lugar de eliminarla.";
const MENSAJE_ERROR_INESPERADO =
  "No se pudo eliminar la cabaña. Intentá de nuevo.";

function detalleError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function esErrorClaveForanea(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2003"
  );
}

/**
 * Borra del Storage los archivos propios de la cabaña eliminada que ninguna
 * otra referencia conserva. Devuelve cuántos no se pudieron borrar.
 *
 * Se ejecuta siempre después de confirmar el borrado en la base: un archivo
 * huérfano es recuperable, pero una cabaña a medio borrar no. Las URLs
 * externas se ignoran y los archivos compartidos, de la galería o fijados en
 * el sitio se conservan mediante las reglas de lib/fotos/referencias.ts.
 */
async function borrarArchivosDeLaCabana(
  propiedadId: string,
  fotos: readonly string[],
  otrasPropiedades: readonly PropiedadConFotos[],
  urlsImagenes: readonly string[]
): Promise<number> {
  const pathsPropios = new Set<string>();

  for (const foto of fotos) {
    const path = extraerPathDeUrl(foto);
    if (path !== null) pathsPropios.add(path);
  }

  if (pathsPropios.size === 0) return 0;

  const pathsABorrar = new Set<string>();

  try {
    const protegidos = obtenerPathsProtegidos(
      IMAGENES_HERO_FALLBACK.map((imagen) => imagen.url)
    );

    for (const path of pathsPropios) {
      const decision = decidirBorradoArchivo({
        path,
        propiedadIdActual: propiedadId,
        propiedades: otrasPropiedades,
        urlsImagenes,
        protegidos,
      });

      if (decision.borrar) pathsABorrar.add(path);
    }
  } catch (error) {
    console.error(
      `No se pudieron verificar las referencias de ${pathsPropios.size} archivo(s) de la cabaña ${propiedadId}: ${detalleError(
        error
      )}`
    );
    return pathsPropios.size;
  }

  if (pathsABorrar.size === 0) return 0;

  let cliente: ReturnType<typeof crearClienteAdmin>;

  try {
    cliente = crearClienteAdmin();
  } catch (error) {
    console.error(
      `No se pudieron borrar ${pathsABorrar.size} archivo(s) de la cabaña ${propiedadId}: ${detalleError(
        error
      )}`
    );
    return pathsABorrar.size;
  }

  let fallidos = 0;

  for (const path of pathsABorrar) {
    try {
      const { error } = await cliente.storage
        .from(BUCKET_FOTOS)
        .remove([path]);

      if (error) {
        fallidos += 1;
        console.error(
          `No se pudo borrar el archivo "${path}" de la cabaña ${propiedadId}: ${error.message}`
        );
      }
    } catch (error) {
      fallidos += 1;
      console.error(
        `No se pudo borrar el archivo "${path}" de la cabaña ${propiedadId}: ${detalleError(
          error
        )}`
      );
    }
  }

  return fallidos;
}

/**
 * Revalida todas las vistas que pueden mostrar la cabaña o sus fotos.
 *
 * Es el mismo conjunto que usa lib/actions/fotos.ts, más las pantallas de
 * disponibilidad y pre-reserva que dependen de las cabañas existentes.
 */
function revalidarVistas(propiedadId: string): void {
  revalidatePath("/admin/propiedades");
  revalidatePath("/admin/fotos");
  revalidatePath("/admin/disponibilidad");
  revalidatePath("/");
  revalidatePath("/pre-reserva");
  revalidatePath(`/cabanas/${propiedadId}`);
  revalidatePath("/cabanas/[id]", "page");
  revalidatePath("/galeria");
  revalidatePath("/galeria/[album]", "page");
}

/**
 * Elimina definitivamente una cabaña sin reservas ni reseñas.
 *
 * Primero borra la fila (las noches bloqueadas caen por cascada) y recién
 * después los archivos del Storage que solo usaba esa cabaña. Un fallo al
 * borrar archivos se informa en `archivosNoBorrados`, nunca revierte la baja.
 */
export async function eliminarPropiedadCompleta(
  propiedadId: unknown
): Promise<ResultadoEliminarPropiedad> {
  if (!(await esAdmin())) {
    return { success: false, error: MENSAJE_NO_AUTORIZADO };
  }

  if (typeof propiedadId !== "string" || propiedadId.trim() === "") {
    return { success: false, error: MENSAJE_ID_INVALIDO };
  }

  const id = propiedadId.trim();

  try {
    const resultado = await prisma.$transaction(
      async (tx): Promise<ResultadoTransaccion> => {
        const propiedad = await tx.propiedad.findUnique({
          where: { id },
          select: {
            id: true,
            nombre: true,
            fotos: true,
            _count: {
              select: {
                reservas: true,
                resenas: true,
              },
            },
          },
        });

        if (!propiedad) {
          return { estado: "inexistente" };
        }

        const evaluacion = evaluarEliminacion({
          reservas: propiedad._count.reservas,
          resenas: propiedad._count.resenas,
        });

        if (!evaluacion.permitida) {
          return { estado: "rechazada", motivo: evaluacion.motivo };
        }

        const otrasPropiedades = await tx.propiedad.findMany({
          where: { id: { not: id } },
          select: { id: true, fotos: true },
        });

        const imagenes = await tx.imagen.findMany({
          select: { url: true },
        });

        await tx.propiedad.delete({ where: { id } });

        return {
          estado: "eliminada",
          nombre: propiedad.nombre,
          fotos: propiedad.fotos,
          otrasPropiedades,
          urlsImagenes: imagenes.map((imagen) => imagen.url),
        };
      }
    );

    if (resultado.estado === "inexistente") {
      return { success: false, error: MENSAJE_NO_EXISTE };
    }

    if (resultado.estado === "rechazada") {
      return { success: false, error: resultado.motivo };
    }

    let archivosNoBorrados: number;

    try {
      archivosNoBorrados = await borrarArchivosDeLaCabana(
        id,
        resultado.fotos,
        resultado.otrasPropiedades,
        resultado.urlsImagenes
      );
    } catch (error) {
      // La fila ya se borró: un fallo inesperado al limpiar archivos no puede
      // convertir la operación en un error para el administrador.
      console.error(
        `Error inesperado al borrar los archivos de la cabaña ${id}: ${detalleError(
          error
        )}`
      );
      archivosNoBorrados = resultado.fotos.filter(
        (foto) => extraerPathDeUrl(foto) !== null
      ).length;
    }

    revalidarVistas(id);

    return {
      success: true,
      nombre: resultado.nombre,
      archivosNoBorrados,
    };
  } catch (error) {
    if (esErrorClaveForanea(error)) {
      console.error(
        `No se pudo eliminar la cabaña ${id} por una clave foránea:`,
        error
      );
      return { success: false, error: MENSAJE_DEPENDENCIAS };
    }

    console.error(`Error al eliminar la cabaña ${id}:`, error);
    return { success: false, error: MENSAJE_ERROR_INESPERADO };
  }
}
