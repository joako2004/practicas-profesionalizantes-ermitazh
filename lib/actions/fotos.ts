"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import { esAdmin } from "@/lib/auth/perfil";
import { IMAGENES_HERO_FALLBACK } from "@/lib/config";
import {
  BUCKET_FOTOS,
  construirUrlPublica,
  extraerPathDeUrl,
  generarPathNuevo,
  obtenerPathsProtegidos,
  validarArchivoFoto,
  type ArchivoFoto,
} from "@/lib/fotos/rutas";
import {
  contienePath,
  decidirBorradoArchivo,
  quitarFotoPorPath,
  quitarFotoPorUrlExacta,
  type MotivoConservacion,
} from "@/lib/fotos/referencias";

export type ResultadoPrepararSubida =
  | { success: true; path: string; token: string }
  | { success: false; error: string };

export type ResultadoRegistrarFoto =
  | { success: true; url: string }
  | { success: false; error: string };

export type ResultadoEliminarFoto =
  | {
      success: true;
      archivoBorrado: boolean;
      motivoConservacion?: MotivoConservacion;
      advertencia?: string;
    }
  | { success: false; error: string };

const PATRON_PROPIEDAD_ID = /^[A-Za-z0-9_-]+$/;

const LONGITUD_MAXIMA_URL = 2048;

const MENSAJE_ERROR_SUBIDA = "No se pudo preparar la subida de la foto.";
const MENSAJE_ERROR_REGISTRO = "No se pudo registrar la foto.";
const MENSAJE_ERROR_ELIMINACION = "No se pudo quitar la foto de la cabaña.";
const MENSAJE_ADVERTENCIA_BORRADO =
  "La foto se quitó de la cabaña, pero no se pudo borrar el archivo del almacenamiento.";
const MENSAJE_ADVERTENCIA_REFERENCIAS =
  "La foto se quitó de la cabaña, pero no se pudo verificar si el archivo se usa en otro lado.";

function idPropiedadValido(propiedadId: unknown): propiedadId is string {
  return (
    typeof propiedadId === "string" &&
    propiedadId.length > 0 &&
    PATRON_PROPIEDAD_ID.test(propiedadId)
  );
}

function textoNoVacio(valor: unknown): valor is string {
  return typeof valor === "string" && valor.trim() !== "";
}

function archivoValido(archivo: unknown): archivo is ArchivoFoto {
  if (typeof archivo !== "object" || archivo === null) return false;

  const { nombre, tipo, tamano } = archivo as Record<string, unknown>;

  return (
    typeof nombre === "string" &&
    nombre.trim() !== "" &&
    typeof tipo === "string" &&
    tipo.trim() !== "" &&
    typeof tamano === "number" &&
    Number.isFinite(tamano)
  );
}

/**
 * Valida que el path pertenezca a la carpeta de la cabaña y que no pueda
 * escapar de ella. La validación final de segmentos la hace construirUrlPublica.
 */
function pathValidoParaPropiedad(
  propiedadId: string,
  path: string
): boolean {
  const prefijo = `cabanas/${propiedadId}/`;

  if (!path.startsWith(prefijo)) return false;
  if (path.startsWith("/")) return false;
  if (path.includes("..")) return false;
  if (path.includes("//")) return false;

  return true;
}

/**
 * Revalida las vistas que muestran fotos.
 *
 * "/cabanas/[id]" con type "page" cubre todas las fichas dinámicas, igual que
 * en lib/actions/propiedades.ts. La galería pública tiene una página índice y
 * una ruta dinámica por álbum. "/admin/fotos" todavía no existe: se deja
 * preparada para la pestaña de la próxima fase (revalidar una ruta inexistente
 * no tiene efecto).
 */
function revalidarFotos(propiedadId: string): void {
  revalidatePath("/admin/propiedades");
  revalidatePath("/admin/fotos");
  revalidatePath("/");
  revalidatePath(`/cabanas/${propiedadId}`);
  revalidatePath("/cabanas/[id]", "page");
  revalidatePath("/galeria");
  revalidatePath("/galeria/[album]", "page");
}

function registrarError(contexto: string, error: unknown): void {
  const detalle = error instanceof Error ? error.message : String(error);
  console.error(`${contexto}: ${detalle}`);
}

/**
 * Genera un path nuevo y una URL firmada de subida para que el navegador suba
 * el archivo directamente a Supabase Storage con la clave de servicio.
 */
export async function prepararSubidaFoto(
  propiedadId: string,
  archivo: { nombre: string; tipo: string; tamano: number }
): Promise<ResultadoPrepararSubida> {
  if (!(await esAdmin())) {
    return { success: false, error: "No autorizado." };
  }

  if (!idPropiedadValido(propiedadId)) {
    return { success: false, error: "Cabaña inválida." };
  }

  if (!archivoValido(archivo)) {
    return { success: false, error: "Datos del archivo inválidos." };
  }

  const validacion = validarArchivoFoto(archivo);
  if (!validacion.ok) {
    return { success: false, error: validacion.error };
  }

  try {
    const propiedad = await prisma.propiedad.findUnique({
      where: { id: propiedadId },
      select: { id: true },
    });

    if (!propiedad) {
      return { success: false, error: "La cabaña no existe." };
    }

    const path = generarPathNuevo({ propiedadId, tipo: archivo.tipo });
    const cliente = crearClienteAdmin();
    const { data, error } = await cliente.storage
      .from(BUCKET_FOTOS)
      .createSignedUploadUrl(path);

    if (error || !data) {
      registrarError("No se pudo generar la URL firmada de subida", error);
      return { success: false, error: MENSAJE_ERROR_SUBIDA };
    }

    return { success: true, path, token: data.token };
  } catch (error) {
    registrarError("Error al preparar la subida de la foto", error);
    return { success: false, error: MENSAJE_ERROR_SUBIDA };
  }
}

/**
 * Registra en la cabaña una foto que ya se subió al Storage.
 *
 * Es idempotente: si el path ya está en la lista, no se duplica.
 */
export async function registrarFoto(
  propiedadId: string,
  path: string
): Promise<ResultadoRegistrarFoto> {
  if (!(await esAdmin())) {
    return { success: false, error: "No autorizado." };
  }

  if (!idPropiedadValido(propiedadId)) {
    return { success: false, error: "Cabaña inválida." };
  }

  if (!textoNoVacio(path) || !pathValidoParaPropiedad(propiedadId, path)) {
    return { success: false, error: "Ruta de foto inválida." };
  }

  const urlBase = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!urlBase) {
    console.error(
      "Falta la variable de entorno NEXT_PUBLIC_SUPABASE_URL para registrar la foto."
    );
    return { success: false, error: MENSAJE_ERROR_REGISTRO };
  }

  let url: string;
  try {
    url = construirUrlPublica(urlBase, path);
  } catch {
    return { success: false, error: "Ruta de foto inválida." };
  }

  try {
    // Se comprueba el archivo real en el bucket: el navegador pudo no terminar
    // la subida y no queremos guardar en la base una URL que dé 404.
    const cliente = crearClienteAdmin();
    const { data: existe, error } = await cliente.storage
      .from(BUCKET_FOTOS)
      .exists(path);

    if (error) {
      registrarError("No se pudo verificar el archivo en Storage", error);
      return { success: false, error: "No se pudo verificar la subida de la foto." };
    }

    if (!existe) {
      return { success: false, error: "La foto no llegó a subirse." };
    }
  } catch (error) {
    registrarError("Error al verificar el archivo en Storage", error);
    return { success: false, error: "No se pudo verificar la subida de la foto." };
  }

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      const propiedad = await tx.propiedad.findUnique({
        where: { id: propiedadId },
        select: { fotos: true },
      });

      if (!propiedad) {
        return { estado: "inexistente" as const };
      }

      if (contienePath(propiedad.fotos, path)) {
        return { estado: "duplicada" as const };
      }

      // Al final del array: el orden define la galería y la portada es la 0.
      await tx.propiedad.update({
        where: { id: propiedadId },
        data: { fotos: { push: url } },
      });

      return { estado: "agregada" as const };
    });

    if (resultado.estado === "inexistente") {
      // El archivo ya subido no se borra: solo se informa.
      return { success: false, error: "La cabaña no existe." };
    }

    if (resultado.estado === "agregada") {
      revalidarFotos(propiedadId);
    }

    return { success: true, url };
  } catch (error) {
    registrarError("Error al registrar la foto en la cabaña", error);
    return { success: false, error: MENSAJE_ERROR_REGISTRO };
  }
}

/**
 * Quita una foto de la cabaña y, solo si ningún otro lugar la usa, borra el
 * archivo del Storage.
 *
 * El borrado va después de confirmar el cambio en la base: un archivo huérfano
 * es recuperable, pero revertir una foto ya borrada del bucket no lo es.
 */
export async function eliminarFoto(
  propiedadId: string,
  url: string
): Promise<ResultadoEliminarFoto> {
  if (!(await esAdmin())) {
    return { success: false, error: "No autorizado." };
  }

  if (!idPropiedadValido(propiedadId)) {
    return { success: false, error: "Cabaña inválida." };
  }

  if (!textoNoVacio(url) || url.length > LONGITUD_MAXIMA_URL) {
    return { success: false, error: "Foto inválida." };
  }

  const path = extraerPathDeUrl(url);
  if (path === null) {
    // Enlace externo: no hay ningún archivo propio en el Storage que borrar.
    // Solo se quita de la lista de esta cabaña, comparando el texto exacto.
    try {
      const resultado = await prisma.$transaction(async (tx) => {
        const propiedad = await tx.propiedad.findUnique({
          where: { id: propiedadId },
          select: { fotos: true },
        });

        if (!propiedad) {
          return { estado: "inexistente" as const };
        }

        if (!propiedad.fotos.includes(url)) {
          return { estado: "ausente" as const };
        }

        const nuevasFotos = quitarFotoPorUrlExacta(propiedad.fotos, url);

        await tx.propiedad.update({
          where: { id: propiedadId },
          data: { fotos: { set: nuevasFotos } },
        });

        return { estado: "eliminada" as const };
      });

      if (resultado.estado === "inexistente") {
        return { success: false, error: "La cabaña no existe." };
      }

      if (resultado.estado === "ausente") {
        return { success: false, error: "Esa foto ya no está en esta cabaña." };
      }
    } catch (error) {
      registrarError("Error al quitar el enlace externo de la cabaña", error);
      return { success: false, error: MENSAJE_ERROR_ELIMINACION };
    }

    // Mismas vistas que revalida la rama de archivos propios.
    revalidarFotos(propiedadId);

    return { success: true, archivoBorrado: false };
  }

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      const propiedad = await tx.propiedad.findUnique({
        where: { id: propiedadId },
        select: { fotos: true },
      });

      if (!propiedad) {
        return { estado: "inexistente" as const };
      }

      if (!contienePath(propiedad.fotos, path)) {
        return { estado: "ausente" as const };
      }

      const nuevasFotos = quitarFotoPorPath(propiedad.fotos, path);

      await tx.propiedad.update({
        where: { id: propiedadId },
        data: { fotos: { set: nuevasFotos } },
      });

      return { estado: "eliminada" as const };
    });

    if (resultado.estado === "inexistente") {
      return { success: false, error: "La cabaña no existe." };
    }

    if (resultado.estado === "ausente") {
      return { success: false, error: "Esa foto ya no está en la cabaña." };
    }
  } catch (error) {
    registrarError("Error al quitar la foto de la cabaña", error);
    return { success: false, error: MENSAJE_ERROR_ELIMINACION };
  }

  // La base ya cambió: desde acá cualquier fallo se informa como advertencia,
  // nunca deshaciendo el cambio.
  revalidarFotos(propiedadId);

  try {
    const [propiedades, imagenes] = await Promise.all([
      prisma.propiedad.findMany({ select: { id: true, fotos: true } }),
      prisma.imagen.findMany({ select: { url: true } }),
    ]);

    const decision = decidirBorradoArchivo({
      path,
      propiedadIdActual: propiedadId,
      propiedades,
      urlsImagenes: imagenes.map((imagen) => imagen.url),
      protegidos: obtenerPathsProtegidos(
        IMAGENES_HERO_FALLBACK.map((imagen) => imagen.url)
      ),
    });

    if (!decision.borrar) {
      return {
        success: true,
        archivoBorrado: false,
        motivoConservacion: decision.motivo,
      };
    }

    try {
      const cliente = crearClienteAdmin();
      const { error } = await cliente.storage
        .from(BUCKET_FOTOS)
        .remove([path]);

      if (error) {
        registrarError("No se pudo borrar el archivo del Storage", error);
        return {
          success: true,
          archivoBorrado: false,
          advertencia: MENSAJE_ADVERTENCIA_BORRADO,
        };
      }
    } catch (error) {
      registrarError("Error al borrar el archivo del Storage", error);
      return {
        success: true,
        archivoBorrado: false,
        advertencia: MENSAJE_ADVERTENCIA_BORRADO,
      };
    }

    return { success: true, archivoBorrado: true };
  } catch (error) {
    registrarError("Error al verificar las referencias de la foto", error);
    return {
      success: true,
      archivoBorrado: false,
      advertencia: MENSAJE_ADVERTENCIA_REFERENCIAS,
    };
  }
}
