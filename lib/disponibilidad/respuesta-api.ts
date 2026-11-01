import { nochesOcupadasEnTodas } from "./cabanas";
import { aClaveFecha, deClaveFecha } from "./noches";
import type { ContextoEstadia } from "./seleccion-estadia";

/**
 * Lectura defensiva de la respuesta de GET /api/disponibilidad.
 *
 * El JSON llega sin tipos: cualquier dato dudoso invalida TODA la respuesta y
 * se devuelve null. Es preferible un error a mostrar libre una noche ocupada.
 * El módulo es puro: no conoce React, Prisma ni la hora actual, y no muta ni
 * lanza excepciones.
 */

/** Cabaña del calendario público, con las noches bloqueadas como conjunto. */
export type CabanaCliente = {
  id: string;
  capacidad: number;
  bloqueadas: ReadonlySet<string>;
};

/** Respuesta ya validada: claves "AAAA-MM-DD" y "hasta" como última noche. */
export type DisponibilidadCliente = {
  desde: string;
  hasta: string;
  cabanas: CabanaCliente[];
};

/** Ids aceptados, igual que la API: alfanuméricos, guion y guion bajo. */
const PATRON_ID = /^[A-Za-z0-9_-]{1,64}$/;

/** ISO a medianoche UTC exacta, con fracción de segundo opcional. */
const PATRON_ISO_MEDIANOCHE = /^(\d{4}-\d{2}-\d{2})T00:00:00(?:\.\d+)?Z$/;

const CAPACIDAD_MINIMA = 1;
const CAPACIDAD_MAXIMA = 100;

/** Indica si el valor es un objeto no nulo y no array. */
function esObjeto(valor: unknown): valor is Record<string, unknown> {
  return typeof valor === "object" && valor !== null && !Array.isArray(valor);
}

/** Valida una clave "AAAA-MM-DD" estricta y la devuelve normalizada. */
function claveDeDia(valor: unknown): string | null {
  if (typeof valor !== "string") {
    return null;
  }

  const fecha = deClaveFecha(valor);
  return fecha === null ? null : aClaveFecha(fecha);
}

/**
 * Normaliza un extremo de la ventana a su clave "AAAA-MM-DD".
 *
 * Acepta solo una clave exacta o un ISO a medianoche UTC exacta (con o sin
 * fracción de segundo). Cualquier otra hora, zona o formato devuelve null.
 */
export function claveDeVentana(valor: unknown): string | null {
  if (typeof valor !== "string") {
    return null;
  }

  const clave = claveDeDia(valor);
  if (clave !== null) {
    return clave;
  }

  const coincidencia = PATRON_ISO_MEDIANOCHE.exec(valor);
  if (coincidencia === null) {
    return null;
  }

  return claveDeDia(coincidencia[1]);
}

/**
 * Valida y normaliza la respuesta completa de /api/disponibilidad.
 *
 * Devuelve null ante cualquier problema: ventana ausente o inválida, desde
 * posterior a hasta, cabañas que no son un array, ids inválidos o repetidos,
 * capacidad fuera de rango y bloqueadas ausentes o con un elemento inválido.
 * No se descarta ningún elemento dudoso en silencio.
 */
export function leerRespuestaDisponibilidad(
  json: unknown,
): DisponibilidadCliente | null {
  if (!esObjeto(json)) {
    return null;
  }

  const ventana = json.ventana;
  if (!esObjeto(ventana)) {
    return null;
  }

  const desde = claveDeVentana(ventana.desde);
  const hasta = claveDeVentana(ventana.hasta);
  if (desde === null || hasta === null || desde > hasta) {
    return null;
  }

  if (!Array.isArray(json.cabanas)) {
    return null;
  }

  const crudas: readonly unknown[] = json.cabanas;
  const cabanas: CabanaCliente[] = [];
  const ids = new Set<string>();

  for (const cruda of crudas) {
    if (!esObjeto(cruda)) {
      return null;
    }

    const { id, capacidad, bloqueadas } = cruda;

    if (typeof id !== "string" || !PATRON_ID.test(id) || ids.has(id)) {
      return null;
    }
    if (
      typeof capacidad !== "number" ||
      !Number.isInteger(capacidad) ||
      capacidad < CAPACIDAD_MINIMA ||
      capacidad > CAPACIDAD_MAXIMA
    ) {
      return null;
    }
    if (!Array.isArray(bloqueadas)) {
      return null;
    }

    const nochesCrudas: readonly unknown[] = bloqueadas;
    const noches = new Set<string>();

    for (const noche of nochesCrudas) {
      const clave = claveDeDia(noche);
      if (clave === null) {
        return null;
      }
      noches.add(clave);
    }

    ids.add(id);
    cabanas.push({ id, capacidad, bloqueadas: noches });
  }

  return { desde, hasta, cabanas };
}

/**
 * Contexto de calendario para UNA cabaña. Devuelve null si no está en la
 * respuesta, para no mostrar como libre una cabaña desconocida.
 */
export function contextoCabanaUnica(
  datos: DisponibilidadCliente,
  propiedadId: string,
): ContextoEstadia | null {
  const cabana = datos.cabanas.find((una) => una.id === propiedadId);
  if (cabana === undefined) {
    return null;
  }

  return {
    bloqueadas: new Set(cabana.bloqueadas),
    desde: datos.desde,
    hasta: datos.hasta,
  };
}

/**
 * Contexto de calendario del modo GENERAL: solo las noches ocupadas en todas
 * las cabañas. Sin cabañas devuelve null: nunca se muestra todo libre.
 */
export function contextoGeneral(
  datos: DisponibilidadCliente,
): ContextoEstadia | null {
  if (datos.cabanas.length === 0) {
    return null;
  }

  return {
    bloqueadas: nochesOcupadasEnTodas(datos.cabanas),
    desde: datos.desde,
    hasta: datos.hasta,
  };
}
