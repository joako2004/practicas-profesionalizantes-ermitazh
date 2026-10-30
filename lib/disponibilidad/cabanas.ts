import { aClaveFecha, validarRango } from "./noches";

/**
 * Lógica pura de disponibilidad para VARIAS cabañas.
 *
 * Igual que `noches.ts`, este módulo no conoce React, Prisma ni la base de
 * datos: recibe filas y cabañas ya resueltas y devuelve conjuntos y listas.
 * Las cabañas se identifican por `propiedadId` y cada noche por su clave
 * interna "AAAA-MM-DD". La noche del día de salida no cuenta.
 *
 * Quien llama es responsable de pasar solo cabañas activas.
 */

/** Cabaña mínima para calcular disponibilidad: capacidad y noches bloqueadas. */
export type CabanaDisponibilidad = {
  id: string;
  capacidad: number;
  bloqueadas: ReadonlySet<string>;
};

/**
 * Agrupa las filas de `noches_bloqueadas` por cabaña.
 *
 * Cada fila aporta la clave de su fecha al conjunto de su `propiedadId`. Las
 * fechas inválidas se ignoran y las claves repetidas se colapsan. No se crean
 * entradas para cabañas sin filas: la ausencia se trata como conjunto vacío.
 */
export function agruparNochesPorCabana(
  filas: readonly { propiedadId: string; fecha: Date }[],
): Map<string, Set<string>> {
  const agrupadas = new Map<string, Set<string>>();

  for (const fila of filas) {
    const clave = aClaveFecha(fila.fecha);
    if (clave === "") {
      continue;
    }

    const noches = agrupadas.get(fila.propiedadId);
    if (noches === undefined) {
      agrupadas.set(fila.propiedadId, new Set([clave]));
    } else {
      noches.add(clave);
    }
  }

  return agrupadas;
}

/**
 * Devuelve las noches bloqueadas en TODAS las cabañas (intersección).
 *
 * Sin cabañas no se bloquea nada, así que devuelve un conjunto vacío. También
 * devuelve vacío si alguna cabaña no tiene noches bloqueadas. Para ser
 * eficiente recorre el conjunto más chico y comprueba pertenencia en los demás.
 * El resultado es un conjunto nuevo: no se mutan los de entrada.
 */
export function nochesOcupadasEnTodas(
  cabanas: readonly CabanaDisponibilidad[],
): Set<string> {
  const ocupadas = new Set<string>();

  if (cabanas.length === 0) {
    return ocupadas;
  }

  let masChico = cabanas[0].bloqueadas;
  for (const cabana of cabanas) {
    if (cabana.bloqueadas.size < masChico.size) {
      masChico = cabana.bloqueadas;
    }
  }

  if (masChico.size === 0) {
    return ocupadas;
  }

  for (const clave of masChico) {
    let estaEnTodas = true;
    for (const cabana of cabanas) {
      if (!cabana.bloqueadas.has(clave)) {
        estaEnTodas = false;
        break;
      }
    }
    if (estaEnTodas) {
      ocupadas.add(clave);
    }
  }

  return ocupadas;
}

/** Resultado de buscar cabañas libres para una estadía y cantidad de huéspedes. */
export type ResultadoCabanasLibres<T extends CabanaDisponibilidad> =
  | { ok: true; cabanas: T[] }
  | { ok: false; motivo: "RANGO_INVALIDO" }
  | { ok: false; motivo: "EXCEDE_NOCHES_MAX"; maximo: number }
  | { ok: false; motivo: "HUESPEDES_INVALIDOS" }
  | { ok: false; motivo: "NINGUNA_LIBRE" }
  | { ok: false; motivo: "NINGUNA_CON_CAPACIDAD"; huespedes: number };

/**
 * Devuelve las cabañas libres para el rango [ingreso, salida) y la cantidad de
 * huéspedes indicada, conservando el orden de entrada.
 *
 * El rango se valida una sola vez con `validarRango` y sus noches se reutilizan
 * para todas las cabañas. El orden de comprobación es: rango, huéspedes,
 * cabañas libres y capacidad. Si hay cabañas libres pero ninguna alcanza la
 * capacidad pedida, el motivo es NINGUNA_CON_CAPACIDAD. La función es genérica
 * para devolver los mismos objetos recibidos, con sus campos extra intactos.
 */
export function cabanasLibresParaRango<T extends CabanaDisponibilidad>(
  ingreso: Date,
  salida: Date,
  huespedes: number,
  cabanas: readonly T[],
): ResultadoCabanasLibres<T> {
  const validacion = validarRango(ingreso, salida, new Set<string>());

  if (!validacion.ok) {
    switch (validacion.motivo) {
      case "RANGO_INVALIDO":
        return { ok: false, motivo: "RANGO_INVALIDO" };
      case "EXCEDE_NOCHES_MAX":
        return {
          ok: false,
          motivo: "EXCEDE_NOCHES_MAX",
          maximo: validacion.maximo,
        };
      case "NOCHES_BLOQUEADAS":
        // Imposible: el conjunto pasado a validarRango siempre está vacío.
        return { ok: false, motivo: "RANGO_INVALIDO" };
    }
  }

  if (!Number.isInteger(huespedes) || huespedes < 1) {
    return { ok: false, motivo: "HUESPEDES_INVALIDOS" };
  }

  const noches = validacion.noches;
  const libres = cabanas.filter((cabana) =>
    noches.every((clave) => !cabana.bloqueadas.has(clave)),
  );

  if (libres.length === 0) {
    return { ok: false, motivo: "NINGUNA_LIBRE" };
  }

  const conCapacidad = libres.filter((cabana) => cabana.capacidad >= huespedes);

  if (conCapacidad.length === 0) {
    return { ok: false, motivo: "NINGUNA_CON_CAPACIDAD", huespedes };
  }

  return { ok: true, cabanas: conCapacidad };
}
