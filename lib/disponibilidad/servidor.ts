import { prisma } from "@/lib/prisma";

import { agruparNochesPorCabana, type CabanaDisponibilidad } from "./cabanas";
import {
  armarDisponibilidad,
  calcularVentana,
  hoyEnArgentina,
  type DisponibilidadDto,
} from "./dto";

/**
 * Lectura de disponibilidad contra la base de datos.
 *
 * Solo lecturas. Sin caché: cada llamada lee la base. Los bloqueos de cabañas
 * inactivas nunca salen: todas las consultas parten de las propiedades activas
 * y los bloqueos se piden únicamente para esos ids.
 */

/** Datos mínimos de una cabaña activa que necesita este módulo. */
type PropiedadActiva = {
  id: string;
  capacidad: number;
};

/**
 * Lee las cabañas activas, todas o solo la indicada, con el select mínimo.
 *
 * Una cabaña inexistente o inactiva simplemente no aparece en el resultado.
 */
async function leerPropiedadesActivas(
  propiedadId?: string,
): Promise<PropiedadActiva[]> {
  return prisma.propiedad.findMany({
    where:
      propiedadId === undefined
        ? { activa: true }
        : { activa: true, id: propiedadId },
    select: { id: true, capacidad: true },
    orderBy: { id: "asc" },
  });
}

/**
 * Arma el DTO público de disponibilidad de la ventana que empieza hoy.
 *
 * La ventana va de hoy en Argentina hasta VENTANA_DIAS noches después. Sin
 * `propiedadId` devuelve todas las cabañas activas (aunque sean cero); con
 * `propiedadId`, devuelve null si la cabaña no existe o está inactiva.
 *
 * `ahora` existe para poder fijar el instante en las pruebas; en producción se
 * usa el reloj del servidor.
 */
export async function obtenerDisponibilidadPublica(opciones?: {
  propiedadId?: string;
  ahora?: Date;
}): Promise<DisponibilidadDto | null> {
  const ahora = opciones?.ahora ?? new Date();
  const hoy = hoyEnArgentina(ahora);
  const ventana = calcularVentana(hoy);
  const propiedadId = opciones?.propiedadId;

  const propiedades = await leerPropiedadesActivas(propiedadId);

  if (propiedades.length === 0) {
    if (propiedadId !== undefined) {
      return null;
    }
    return armarDisponibilidad([], [], ventana);
  }

  const ids = propiedades.map((propiedad) => propiedad.id);

  const filas = await prisma.nocheBloqueada.findMany({
    where: {
      propiedadId: { in: ids },
      fecha: { gte: ventana.desde, lte: ventana.hasta },
    },
    select: { propiedadId: true, fecha: true },
  });

  return armarDisponibilidad(propiedades, filas, ventana);
}

/**
 * Lee las cabañas activas con sus noches bloqueadas en el rango
 * [ingreso, salida), sin ventana.
 *
 * Es el helper previsto para la revalidación de la pre-reserva (D8), que lo
 * combinará con `cabanasLibresParaRango`. Devuelve solo cabañas activas y, si
 * viene `propiedadId`, solo esa (vacío si no existe o está inactiva). El orden
 * es por id ascendente y las cabañas sin bloqueos llevan un conjunto vacío.
 *
 * Quien llama debe validar el rango ANTES con `validarRango` o `nochesDeRango`,
 * que devuelven motivos legibles. El RangeError de acá es una defensa extra.
 */
export async function leerCabanasParaRango(
  ingreso: Date,
  salida: Date,
  propiedadId?: string,
): Promise<CabanaDisponibilidad[]> {
  if (
    Number.isNaN(ingreso.getTime()) ||
    Number.isNaN(salida.getTime()) ||
    ingreso.getTime() >= salida.getTime()
  ) {
    throw new RangeError("El rango de la estadía es inválido");
  }

  const propiedades = await leerPropiedadesActivas(propiedadId);

  if (propiedades.length === 0) {
    return [];
  }

  const ids = propiedades.map((propiedad) => propiedad.id);

  const filas = await prisma.nocheBloqueada.findMany({
    where: {
      propiedadId: { in: ids },
      // La noche de salida no cuenta: el rango es [ingreso, salida).
      fecha: { gte: ingreso, lt: salida },
    },
    select: { propiedadId: true, fecha: true },
  });

  const agrupadas = agruparNochesPorCabana(filas);

  return propiedades.map((propiedad) => ({
    id: propiedad.id,
    capacidad: propiedad.capacidad,
    bloqueadas: agrupadas.get(propiedad.id) ?? new Set<string>(),
  }));
}
