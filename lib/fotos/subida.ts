/**
 * Estado de la tanda de subida de fotos del panel de administración.
 *
 * Es un módulo puro: no usa React, DOM, File/Blob ni red. Los archivos reales
 * los guarda el componente; acá solo se manejan datos simples y testeables.
 */

import { MAX_ARCHIVOS_POR_TANDA, validarArchivoFoto } from "./rutas";

export type EstadoSubida = "pendiente" | "subiendo" | "listo" | "error";

export interface CandidatoArchivo {
  nombre: string;
  tipo: string;
  tamano: number;
  ultimaModificacion: number;
}

export interface ItemSubida extends CandidatoArchivo {
  clave: string;
  estado: EstadoSubida;
  error?: string;
}

export interface ArchivoRechazado {
  nombre: string;
  motivo: string;
}

const MOTIVO_DUPLICADO = "Ya agregaste este archivo.";

/**
 * Clave estable para detectar duplicados: el mismo nombre con el mismo tamaño y
 * la misma fecha de modificación es el mismo archivo.
 */
export function claveArchivo(candidato: CandidatoArchivo): string {
  return JSON.stringify([
    candidato.nombre,
    candidato.tamano,
    candidato.ultimaModificacion,
  ]);
}

/**
 * Incorpora candidatos a la lista de la tanda aplicando, en orden, las reglas
 * de duplicado, validación de tipo/tamaño y tope de archivos.
 *
 * Devuelve una lista nueva (no muta `existentes`) y los rechazos con el motivo
 * ya redactado en español.
 */
export function incorporarArchivos(
  existentes: ItemSubida[],
  candidatos: CandidatoArchivo[],
  maxArchivos: number = MAX_ARCHIVOS_POR_TANDA
): { items: ItemSubida[]; rechazados: ArchivoRechazado[] } {
  const items = [...existentes];
  const claves = new Set(items.map((item) => item.clave));
  const rechazados: ArchivoRechazado[] = [];

  for (const candidato of candidatos) {
    const clave = claveArchivo(candidato);

    if (claves.has(clave)) {
      rechazados.push({ nombre: candidato.nombre, motivo: MOTIVO_DUPLICADO });
      continue;
    }

    const validacion = validarArchivoFoto({
      nombre: candidato.nombre,
      tipo: candidato.tipo,
      tamano: candidato.tamano,
    });

    if (!validacion.ok) {
      rechazados.push({ nombre: candidato.nombre, motivo: validacion.error });
      continue;
    }

    if (items.length >= maxArchivos) {
      rechazados.push({
        nombre: candidato.nombre,
        motivo: `Máximo ${maxArchivos} fotos por tanda.`,
      });
      continue;
    }

    items.push({ ...candidato, clave, estado: "pendiente" });
    claves.add(clave);
  }

  return { items, rechazados };
}

/**
 * Quita un ítem por su clave sin mutar el arreglo recibido.
 */
export function quitarItem(items: ItemSubida[], clave: string): ItemSubida[] {
  return items.filter((item) => item.clave !== clave);
}

/**
 * Actualiza el estado de un ítem. El mensaje de error solo se conserva cuando
 * el estado nuevo es "error".
 */
export function actualizarEstado(
  items: ItemSubida[],
  clave: string,
  estado: EstadoSubida,
  error?: string
): ItemSubida[] {
  return items.map((item) => {
    if (item.clave !== clave) return item;

    if (estado === "error") {
      return error === undefined
        ? { ...item, estado }
        : { ...item, estado, error };
    }

    // Sin error: se reconstruye el ítem para que la propiedad no quede vieja.
    return {
      nombre: item.nombre,
      tipo: item.tipo,
      tamano: item.tamano,
      ultimaModificacion: item.ultimaModificacion,
      clave: item.clave,
      estado,
    };
  });
}

/**
 * Ítems que se pueden subir ahora: los pendientes y los que fallaron y se
 * quieren reintentar.
 */
export function itemsSubibles(items: ItemSubida[]): ItemSubida[] {
  return items.filter(
    (item) => item.estado === "pendiente" || item.estado === "error"
  );
}

/**
 * Conteo por estado para armar el resumen de la tanda.
 */
export function resumenTanda(items: ItemSubida[]): {
  total: number;
  listos: number;
  conError: number;
  pendientes: number;
  subiendo: number;
} {
  const resumen = {
    total: items.length,
    listos: 0,
    conError: 0,
    pendientes: 0,
    subiendo: 0,
  };

  for (const item of items) {
    if (item.estado === "listo") {
      resumen.listos += 1;
    } else if (item.estado === "error") {
      resumen.conError += 1;
    } else if (item.estado === "pendiente") {
      resumen.pendientes += 1;
    } else {
      resumen.subiendo += 1;
    }
  }

  return resumen;
}
