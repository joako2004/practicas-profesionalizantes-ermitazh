/**
 * Subida de una foto de cabaña: preparar, subir al almacenamiento y registrar.
 *
 * Este módulo corre en el navegador (usa el cliente de Supabase del navegador y
 * las acciones de servidor de fotos), por eso no lleva "use server" ni importa
 * módulos exclusivos del servidor.
 *
 * No maneja estado ni interfaz: solo la secuencia y sus mensajes de error. Quien
 * lo usa decide qué hacer con el resultado (por ejemplo, el estado por foto).
 */

import { prepararSubidaFoto, registrarFoto } from "@/lib/actions/fotos";
import { BUCKET_FOTOS } from "@/lib/fotos/rutas";
import { createClient } from "@/lib/supabase/client";

export const MENSAJE_ERROR_SUBIDA = "No se pudo subir el archivo. Probá de nuevo.";
export const MENSAJE_ERROR_INESPERADO =
  "Ocurrió un error inesperado. Probá de nuevo.";

export type ResultadoSubirFoto =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * Sube una foto a la carpeta de la cabaña y la registra en la propiedad.
 *
 * Nunca lanza: cualquier fallo (incluidas las excepciones del SDK o de las
 * acciones) se devuelve como `{ ok: false, error }` con el mensaje que ya usa la
 * interfaz de subida.
 */
export async function subirFotoDeCabana(
  propiedadId: string,
  archivo: File
): Promise<ResultadoSubirFoto> {
  try {
    const preparada = await prepararSubidaFoto(propiedadId, {
      nombre: archivo.name,
      tipo: archivo.type,
      tamano: archivo.size,
    });

    if (!preparada.success) {
      return { ok: false, error: preparada.error };
    }

    const supabase = createClient();
    const { error } = await supabase.storage
      .from(BUCKET_FOTOS)
      .uploadToSignedUrl(preparada.path, preparada.token, archivo, {
        contentType: archivo.type,
      });

    if (error) {
      return { ok: false, error: MENSAJE_ERROR_SUBIDA };
    }

    const registrada = await registrarFoto(propiedadId, preparada.path);

    if (!registrada.success) {
      return { ok: false, error: registrada.error };
    }

    return { ok: true, url: registrada.url };
  } catch {
    // No se muestran detalles internos (tokens, paths ni mensajes del SDK).
    return { ok: false, error: MENSAJE_ERROR_INESPERADO };
  }
}
