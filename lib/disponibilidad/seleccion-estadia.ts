import {
  aClaveFecha,
  aTextoFecha,
  deClaveFecha,
  nochesDeRango,
  puedeElegirseComoLlegada,
  puedeElegirseComoSalida,
  salidaMaxima,
  sumarDias,
} from "./noches";

/**
 * Lógica pura de la selección de una estadía en el calendario público.
 *
 * Una estadía ocupa las noches del intervalo [ingreso, salida): la noche del
 * día de salida queda libre para otra llegada. Las claves son texto
 * "AAAA-MM-DD" y se comparan como texto (orden ISO). Toda la matemática de
 * fechas se hace en UTC, así que el resultado no depende de la zona horaria.
 *
 * La ventana de consulta es [desde, hasta], donde "hasta" es la ÚLTIMA NOCHE
 * incluida. Más allá de "hasta" no se sabe qué noches están bloqueadas, por eso
 * la salida puede llegar como máximo a hasta + 1 día.
 *
 * El módulo es puro: no conoce React, Prisma ni la hora actual, y no muta sus
 * argumentos.
 */

/** Estado de la selección de una estadía. */
export type SeleccionEstadia = {
  /** Clave de la noche de ingreso, o null si todavía no se eligió. */
  ingreso: string | null;
  /** Clave del día de salida, o null si todavía no se eligió. */
  salida: string | null;
};

/**
 * Selección sin ningún día elegido. Se congela para que nadie la modifique por
 * accidente; las propiedades de solo lectura son asignables a las mutables.
 */
export const ESTADIA_VACIA: SeleccionEstadia = Object.freeze({
  ingreso: null,
  salida: null,
});

/** Contexto del calendario público: ventana y noches bloqueadas por el admin. */
export type ContextoEstadia = {
  /** Claves de las noches bloqueadas. */
  bloqueadas: ReadonlySet<string>;
  /** Primera noche consultable de la ventana. */
  desde: string;
  /** Última noche incluida en la ventana. */
  hasta: string;
};

/** Posición que ocupa un día dentro de la estadía, para pintarlo. */
export type MarcaEstadia = "inicio" | "medio" | "fin" | "unico";

/** Cómo se ve y cómo se comporta un día concreto del calendario público. */
export type InfoDiaEstadia = {
  /** Noche bloqueada: se ve ocupada aunque el día siga siendo elegible. */
  ocupado: boolean;
  /** No se puede elegir ni como llegada ni como salida. */
  deshabilitado: boolean;
  /** Parte de la estadía actual, si corresponde. */
  seleccion?: MarcaEstadia;
};

/** Totales de una estadía completa, listos para mostrar. */
export type ResumenEstadia = {
  ingreso: string;
  salida: string;
  noches: number;
  textoIngreso: string;
  textoSalida: string;
};

/** Ayuda que se muestra cuando el límite de salida cae en una noche ocupada. */
export const AYUDA_SALIDA_OCUPADA =
  "Podés elegir como salida el día en que empieza una noche ocupada.";

/**
 * Indica si una clave puede elegirse como ingreso: debe ser una fecha válida,
 * estar dentro de [desde, hasta] y su noche no debe estar bloqueada.
 */
export function puedeLlegada(clave: string, ctx: ContextoEstadia): boolean {
  const dia = deClaveFecha(clave);
  const desde = deClaveFecha(ctx.desde);
  const hasta = deClaveFecha(ctx.hasta);

  if (dia === null || desde === null || hasta === null) {
    return false;
  }
  if (clave < ctx.desde || clave > ctx.hasta) {
    return false;
  }

  return puedeElegirseComoLlegada(dia, ctx.bloqueadas);
}

/**
 * Devuelve la última clave elegible como salida para un ingreso: el menor entre
 * el límite por bloqueos/máximo de noches y hasta + 1 día (la salida del último
 * día de la ventana). Devuelve null si el ingreso no es válido.
 */
export function limiteSalida(
  ingreso: string,
  ctx: ContextoEstadia,
): string | null {
  if (!puedeLlegada(ingreso, ctx)) {
    return null;
  }

  const diaIngreso = deClaveFecha(ingreso);
  const diaHasta = deClaveFecha(ctx.hasta);
  if (diaIngreso === null || diaHasta === null) {
    return null;
  }

  // La salida del último día de la ventana cae en hasta + 1.
  const topeVentana = aClaveFecha(sumarDias(diaHasta, 1));
  const topeBloqueos = salidaMaxima(diaIngreso, ctx.bloqueadas);

  if (topeBloqueos === null) {
    return topeVentana;
  }

  // Ambas claves son fechas válidas en formato ISO, así que el orden de texto
  // coincide con el orden cronológico.
  const claveBloqueos = aClaveFecha(topeBloqueos);
  return claveBloqueos < topeVentana ? claveBloqueos : topeVentana;
}

/**
 * Indica si una clave puede elegirse como salida para un ingreso: debe ser
 * posterior al ingreso, no superar el límite y producir un rango válido (sin
 * noches bloqueadas y con NOCHES_MAX como máximo).
 *
 * Un día con la noche bloqueada sí puede ser salida: se sale ese día y la noche
 * bloqueada no se usa.
 */
export function puedeSalida(
  ingreso: string,
  clave: string,
  ctx: ContextoEstadia,
): boolean {
  const limite = limiteSalida(ingreso, ctx);
  if (limite === null) {
    return false;
  }

  const diaIngreso = deClaveFecha(ingreso);
  const diaSalida = deClaveFecha(clave);
  if (diaIngreso === null || diaSalida === null) {
    return false;
  }

  if (clave <= ingreso || clave > limite) {
    return false;
  }

  return puedeElegirseComoSalida(diaIngreso, diaSalida, ctx.bloqueadas);
}

/**
 * Aplica el clic de un día sobre la selección actual y devuelve el estado
 * nuevo, sin mutar el anterior.
 *
 * - Sin ingreso o con estadía completa, el clic intenta fijar un nuevo ingreso.
 * - Con ingreso y sin salida, el clic cierra la estadía si es una salida válida;
 *   si no, intenta tomarlo como nuevo ingreso (cubre días anteriores, el mismo
 *   día y días posteriores que cruzan un bloqueo pero sirven de llegada).
 * - Si el clic no es válido de ninguna forma, la selección queda como estaba.
 */
export function elegirDiaEstadia(
  actual: SeleccionEstadia,
  clave: string,
  ctx: ContextoEstadia,
): SeleccionEstadia {
  if (actual.ingreso === null || actual.salida !== null) {
    if (puedeLlegada(clave, ctx)) {
      return { ingreso: clave, salida: null };
    }
    return actual;
  }

  if (puedeSalida(actual.ingreso, clave, ctx)) {
    return { ingreso: actual.ingreso, salida: clave };
  }

  if (puedeLlegada(clave, ctx)) {
    return { ingreso: clave, salida: null };
  }

  return actual;
}

/**
 * Devuelve el aspecto y el comportamiento de un día según la selección actual.
 *
 * `ocupado` es independiente de `deshabilitado`: un día ocupado puede seguir
 * siendo elegible, por ejemplo como salida. La propiedad `seleccion` se omite
 * cuando el día no forma parte de la estadía.
 */
export function infoDiaEstadia(
  seleccion: SeleccionEstadia,
  clave: string,
  ctx: ContextoEstadia,
): InfoDiaEstadia {
  const ocupado = ctx.bloqueadas.has(clave);

  let deshabilitado: boolean;
  if (seleccion.ingreso !== null && seleccion.salida === null) {
    deshabilitado = !(
      puedeSalida(seleccion.ingreso, clave, ctx) || puedeLlegada(clave, ctx)
    );
  } else {
    deshabilitado = !puedeLlegada(clave, ctx);
  }

  const info: InfoDiaEstadia = { ocupado, deshabilitado };

  if (seleccion.ingreso !== null && seleccion.salida === null) {
    if (clave === seleccion.ingreso) {
      info.seleccion = "unico";
    }
  } else if (seleccion.ingreso !== null && seleccion.salida !== null) {
    if (clave === seleccion.ingreso) {
      info.seleccion = "inicio";
    } else if (clave === seleccion.salida) {
      info.seleccion = "fin";
    } else if (clave > seleccion.ingreso && clave < seleccion.salida) {
      info.seleccion = "medio";
    }
  }

  return info;
}

/**
 * Indica si conviene mostrar AYUDA_SALIDA_OCUPADA: el ingreso es válido y su
 * límite de salida cae en una noche bloqueada.
 */
export function salidaOcupadaDisponible(
  ingreso: string | null,
  ctx: ContextoEstadia,
): boolean {
  if (ingreso === null) {
    return false;
  }

  const limite = limiteSalida(ingreso, ctx);
  return limite !== null && ctx.bloqueadas.has(limite);
}

/**
 * Revalida una selección cuando los bloqueos cambian mientras el huésped mira
 * el calendario. Devuelve la misma selección si todo sigue válido, o la ajusta
 * descartando la salida o la estadía completa según corresponda.
 */
export function normalizarSeleccion(
  seleccion: SeleccionEstadia,
  ctx: ContextoEstadia,
): SeleccionEstadia {
  if (seleccion.ingreso === null) {
    return ESTADIA_VACIA;
  }

  if (!puedeLlegada(seleccion.ingreso, ctx)) {
    return ESTADIA_VACIA;
  }

  if (seleccion.salida === null) {
    return seleccion;
  }

  if (!puedeSalida(seleccion.ingreso, seleccion.salida, ctx)) {
    return { ingreso: seleccion.ingreso, salida: null };
  }

  return seleccion;
}

/**
 * Resume una estadía completa con las noches y los textos visibles. Devuelve
 * null si falta algún extremo, si alguna clave es inválida o si la salida no es
 * posterior al ingreso. No valida bloqueos: eso es de validarRango.
 */
export function resumirEstadia(
  seleccion: SeleccionEstadia,
): ResumenEstadia | null {
  if (seleccion.ingreso === null || seleccion.salida === null) {
    return null;
  }

  const ingreso = deClaveFecha(seleccion.ingreso);
  const salida = deClaveFecha(seleccion.salida);
  if (ingreso === null || salida === null) {
    return null;
  }
  if (salida.getTime() <= ingreso.getTime()) {
    return null;
  }

  return {
    ingreso: seleccion.ingreso,
    salida: seleccion.salida,
    noches: nochesDeRango(ingreso, salida).length,
    textoIngreso: aTextoFecha(ingreso),
    textoSalida: aTextoFecha(salida),
  };
}
