import {
  cabanasLibresParaRango,
  type CabanaDisponibilidad,
} from "../disponibilidad/cabanas";
import { deClaveFecha } from "../disponibilidad/noches";
import type { CabanaCliente } from "../disponibilidad/respuesta-api";
import type { SeleccionEstadia } from "../disponibilidad/seleccion-estadia";

/**
 * Lógica pura del formulario de pre-reserva: qué cabañas se ofrecen para una
 * estadía y cuántos huéspedes admite la cabaña ya elegida.
 *
 * El formulario pide primero las fechas y después la cabaña. Este módulo cruza
 * las cabañas de GET /api/disponibilidad (con sus noches bloqueadas) con las
 * propiedades de la página (con nombre y orden visibles) y delega la decisión
 * de disponibilidad en `cabanasLibresParaRango`.
 *
 * Es puro: no conoce React, Prisma, la hora actual ni la zona horaria, y no
 * muta sus argumentos.
 */

/** Cabaña tal como la muestra el desplegable del formulario. */
export type CabanaOpcion = {
  id: string;
  nombre: string;
  capacidad: number;
};

/** Título del desplegable de cabañas del formulario. */
export const TITULO_CABANAS_DISPONIBLES = "Cabañas disponibles para tu estadía:";

/** Aviso cuando ninguna cabaña queda libre en todo el intervalo. */
export const MENSAJE_NINGUNA_LIBRE =
  "Ninguna cabaña está libre en esas fechas, probá con otro rango.";

/**
 * Aviso cuando hay cabañas libres pero ninguna alcanza la cantidad de
 * huéspedes. Concorda el singular con un solo huésped.
 */
export function mensajeNingunaConCapacidad(huespedes: number): string {
  if (huespedes === 1) {
    return "Hay cabañas libres, pero ninguna para 1 huésped.";
  }
  return `Hay cabañas libres, pero ninguna para ${huespedes} huéspedes.`;
}

/** Resultado de armar las opciones del desplegable para una estadía. */
export type ResultadoOpcionesEstadia =
  | { estado: "INCOMPLETO" }
  | { estado: "OK"; opciones: CabanaOpcion[] }
  | { estado: "NINGUNA_LIBRE"; mensaje: string }
  | { estado: "NINGUNA_CON_CAPACIDAD"; mensaje: string };

/** Cabaña en común entre la API y la página, lista para cabanasLibresParaRango. */
type CabanaConNombre = CabanaDisponibilidad & { nombre: string };

/**
 * Arma las opciones del desplegable "Cabañas disponibles para tu estadía:".
 *
 * Devuelve INCOMPLETO mientras falte un extremo de la estadía, alguna clave no
 * sea una fecha válida o la cantidad de huéspedes no sea un entero >= 1. Los
 * rechazos de rango (salida no posterior, más de NOCHES_MAX noches) también son
 * INCOMPLETO: el calendario ya impide elegirlos y no son un aviso para el
 * huésped.
 *
 * Solo se ofrecen cabañas presentes en ambas listas. El orden de las opciones
 * es el de `propiedades` (el de la página); el nombre sale de `propiedades` y
 * la capacidad y las noches bloqueadas, de `cabanas` (la API).
 */
export function opcionesParaEstadia(
  seleccion: SeleccionEstadia,
  huespedes: number,
  cabanas: readonly CabanaCliente[],
  propiedades: readonly CabanaOpcion[],
): ResultadoOpcionesEstadia {
  const { ingreso, salida } = seleccion;

  if (ingreso === null || salida === null) {
    return { estado: "INCOMPLETO" };
  }
  if (!Number.isInteger(huespedes) || huespedes < 1) {
    return { estado: "INCOMPLETO" };
  }

  const diaIngreso = deClaveFecha(ingreso);
  const diaSalida = deClaveFecha(salida);
  if (diaIngreso === null || diaSalida === null) {
    return { estado: "INCOMPLETO" };
  }

  const datosPorId = new Map<string, CabanaCliente>();
  for (const cabana of cabanas) {
    if (!datosPorId.has(cabana.id)) {
      datosPorId.set(cabana.id, cabana);
    }
  }

  const comunes: CabanaConNombre[] = [];
  for (const propiedad of propiedades) {
    const datos = datosPorId.get(propiedad.id);
    if (datos === undefined) {
      continue;
    }
    comunes.push({
      id: datos.id,
      capacidad: datos.capacidad,
      bloqueadas: datos.bloqueadas,
      nombre: propiedad.nombre,
    });
  }

  // Sin cabañas en común no hay nada que consultar: se resuelve acá en vez de
  // depender de lo que devuelve cabanasLibresParaRango con un arreglo vacío.
  if (comunes.length === 0) {
    return { estado: "NINGUNA_LIBRE", mensaje: MENSAJE_NINGUNA_LIBRE };
  }

  const resultado = cabanasLibresParaRango(
    diaIngreso,
    diaSalida,
    huespedes,
    comunes,
  );

  if (resultado.ok) {
    return {
      estado: "OK",
      opciones: resultado.cabanas.map((cabana) => ({
        id: cabana.id,
        nombre: cabana.nombre,
        capacidad: cabana.capacidad,
      })),
    };
  }

  const motivo = resultado.motivo;

  switch (motivo) {
    case "NINGUNA_LIBRE":
      return { estado: "NINGUNA_LIBRE", mensaje: MENSAJE_NINGUNA_LIBRE };
    case "NINGUNA_CON_CAPACIDAD":
      return {
        estado: "NINGUNA_CON_CAPACIDAD",
        mensaje: mensajeNingunaConCapacidad(huespedes),
      };
    case "RANGO_INVALIDO":
    case "EXCEDE_NOCHES_MAX":
    case "HUESPEDES_INVALIDOS":
      // El calendario ya impide estos casos: no hay aviso para el huésped.
      return { estado: "INCOMPLETO" };
    default: {
      // La asignación a never hace que tsc falle si se agrega un motivo nuevo.
      const motivoNoContemplado: never = motivo;
      throw new Error(
        `Motivo de disponibilidad no contemplado: ${motivoNoContemplado}`,
      );
    }
  }
}

/**
 * Toma el primer valor de un parámetro de URL que puede venir repetido.
 * Un arreglo vacío se trata como ausente.
 */
function primerValor(valor: string | string[] | undefined): string | undefined {
  if (valor === undefined) {
    return undefined;
  }
  if (typeof valor === "string") {
    return valor;
  }
  return valor.length === 0 ? undefined : valor[0];
}

/**
 * Normaliza el parámetro de URL "cabana" al id de una propiedad de la página.
 *
 * El valor llega crudo: puede ser un texto, un arreglo (parámetro repetido) o
 * undefined. Se usa solo el primer elemento, se recortan los espacios y se
 * devuelve el id únicamente si coincide exactamente con una propiedad de la
 * lista recibida (que ya viene filtrada a cabañas activas). Cualquier otro
 * caso devuelve null.
 */
export function cabanaDesdeParametro(
  valor: string | string[] | undefined,
  propiedades: readonly { id: string }[],
): string | null {
  const crudo = primerValor(valor);
  if (crudo === undefined) {
    return null;
  }

  const id = crudo.trim();
  if (id === "") {
    return null;
  }

  const encontrada = propiedades.find((propiedad) => propiedad.id === id);
  return encontrada === undefined ? null : encontrada.id;
}

/**
 * Aviso para el caso de cabaña ya elegida: null si la cantidad de huéspedes es
 * válida para su capacidad, o el texto que explica el problema.
 */
export function mensajeHuespedesCabana(
  huespedes: number,
  capacidad: number,
): string | null {
  if (!Number.isInteger(huespedes) || huespedes < 1) {
    return "Indicá una cantidad de huéspedes válida.";
  }
  if (huespedes > capacidad) {
    if (capacidad === 1) {
      return "Esta cabaña admite hasta 1 huésped.";
    }
    return `Esta cabaña admite hasta ${capacidad} huéspedes.`;
  }
  return null;
}
