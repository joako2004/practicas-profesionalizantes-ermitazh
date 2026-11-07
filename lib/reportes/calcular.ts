import { hoyEnArgentina } from "../fechas";
import {
  diasSemanaDelPeriodo,
  esMesFuturo,
  indiceDiaSemana,
  mesesDelPeriodo,
  nochesDeReservaEnPeriodo,
  nochesDelPeriodo,
  nochesEntre,
  reservaSolapaPeriodo,
  sumarDias,
} from "./fechas";
import type {
  DiaSemanaReporte,
  EstadoReservaReporte,
  FiltrosReporte,
  ModoEstadoReporte,
  PropiedadReporte,
  ReporteOcupacion,
  ReservaReporte,
  SobrecapacidadReporte,
  TramoEstadiaReporte,
  UsoCabanaReporte,
} from "./tipos";

const ETIQUETAS_DIAS = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
] as const;

const ESTADOS_POR_MODO: Record<
  ModoEstadoReporte,
  readonly EstadoReservaReporte[]
> = {
  CONFIRMADA: ["CONFIRMADA"],
  CONFIRMADA_PENDIENTE: ["CONFIRMADA", "PENDIENTE"],
};

function agregarA(
  mapa: Map<string, Set<string>>,
  clave: string,
  valor: string,
): void {
  const conjunto = mapa.get(clave);

  if (conjunto) {
    conjunto.add(valor);
  }
}

function sumarA(mapa: Map<string, number>, clave: string, valor: number): void {
  mapa.set(clave, (mapa.get(clave) ?? 0) + valor);
}

export function normalizarOcupacion(valor: number): number {
  if (!Number.isFinite(valor) || valor <= 0) {
    return 0;
  }

  return Math.min(100, valor);
}

export function periodoDeHistorial(
  reservas: ReadonlyArray<
    Pick<ReservaReporte, "fechaIngreso" | "fechaSalida">
  >,
  respaldo: { desde: Date; hasta: Date },
): { desde: Date; hasta: Date } {
  if (reservas.length === 0) {
    return respaldo;
  }

  let desde = reservas[0].fechaIngreso;
  let salidaMaxima = reservas[0].fechaSalida;

  for (const reserva of reservas) {
    if (reserva.fechaIngreso.getTime() < desde.getTime()) {
      desde = reserva.fechaIngreso;
    }

    if (reserva.fechaSalida.getTime() > salidaMaxima.getTime()) {
      salidaMaxima = reserva.fechaSalida;
    }
  }

  const hasta = sumarDias(salidaMaxima, -1);

  if (hasta.getTime() < desde.getTime()) {
    return respaldo;
  }

  return { desde, hasta };
}

export function calcularReporte(
  reservas: ReadonlyArray<ReservaReporte>,
  propiedades: ReadonlyArray<PropiedadReporte>,
  filtros: FiltrosReporte,
  hoy: Date,
): ReporteOcupacion {
  const nochesPeriodo = nochesDelPeriodo(filtros.desde, filtros.hasta);

  if (nochesPeriodo === 0) {
    throw new RangeError("El período del reporte es inválido");
  }

  const propiedadesFiltradas = propiedades.filter(
    (propiedad) =>
      propiedad.activa &&
      (filtros.propiedadId === null || propiedad.id === filtros.propiedadId),
  );
  const idsPropiedades = new Set(
    propiedadesFiltradas.map((propiedad) => propiedad.id),
  );
  const propiedadesPorId = new Map(
    propiedadesFiltradas.map((propiedad) => [propiedad.id, propiedad]),
  );
  const estados = new Set(ESTADOS_POR_MODO[filtros.modoEstado]);
  const reservasEnPeriodo = reservas.filter(
    (reserva) =>
      idsPropiedades.has(reserva.propiedadId) &&
      reservaSolapaPeriodo(
        reserva.fechaIngreso,
        reserva.fechaSalida,
        filtros.desde,
        filtros.hasta,
      ),
  );
  const reservasOcupacion = reservasEnPeriodo.filter((reserva) =>
    estados.has(reserva.estado),
  );
  const nochesDisponibles = nochesPeriodo * propiedadesFiltradas.length;
  const nochesOcupadas = new Set<string>();
  const nochesPorCabana = new Map<string, Set<string>>();
  const reservasPorCabana = new Map<string, Set<string>>();
  const nochesPorMes = new Map<string, Set<string>>();
  const reservasPorMes = new Map<string, Set<string>>();
  const nochesPorDia = Array.from(
    { length: ETIQUETAS_DIAS.length },
    () => new Set<string>(),
  );
  const sumaEstadiasPorCabana = new Map<string, number>();
  const sumaPersonasPorCabana = new Map<string, number>();
  const sumaUtilizacionPorCabana = new Map<string, number>();
  const conteoUtilizacionPorCabana = new Map<string, number>();
  const nochesPorPropiedadFecha = new Map<string, number>();
  const sobrecapacidad: SobrecapacidadReporte[] = [];
  const conteoTramos = {
    UNA_NOCHE: 0,
    DOS_A_SEIS: 0,
    SIETE_O_MAS: 0,
  };
  const meses = mesesDelPeriodo(filtros.desde, filtros.hasta);

  for (const propiedad of propiedadesFiltradas) {
    nochesPorCabana.set(propiedad.id, new Set());
    reservasPorCabana.set(propiedad.id, new Set());
  }

  for (const mes of meses) {
    nochesPorMes.set(mes.clave, new Set());
    reservasPorMes.set(mes.clave, new Set());
  }

  let sumaEstadias = 0;
  let sumaPersonas = 0;
  let sumaUtilizacion = 0;
  let conteoUtilizacion = 0;
  let creadasDespuesDelCheckIn = 0;
  let conTemporada = 0;

  for (const reserva of reservasOcupacion) {
    const propiedad = propiedadesPorId.get(reserva.propiedadId);

    if (!propiedad) {
      continue;
    }

    const cantidadNoches = nochesEntre(
      reserva.fechaIngreso,
      reserva.fechaSalida,
    );
    sumaEstadias += cantidadNoches;
    sumaPersonas += reserva.personas;
    sumarA(sumaEstadiasPorCabana, propiedad.id, cantidadNoches);
    sumarA(sumaPersonasPorCabana, propiedad.id, reserva.personas);
    agregarA(reservasPorCabana, propiedad.id, reserva.id);

    if (propiedad.capacidad > 0) {
      const utilizacion = (reserva.personas / propiedad.capacidad) * 100;
      sumaUtilizacion += utilizacion;
      conteoUtilizacion += 1;
      sumarA(sumaUtilizacionPorCabana, propiedad.id, utilizacion);
      conteoUtilizacionPorCabana.set(
        propiedad.id,
        (conteoUtilizacionPorCabana.get(propiedad.id) ?? 0) + 1,
      );
    }

    if (reserva.personas > propiedad.capacidad) {
      sobrecapacidad.push({
        reservaId: reserva.id,
        cabana: propiedad.nombre,
        fechaIngreso: reserva.fechaIngreso,
        fechaSalida: reserva.fechaSalida,
        personas: reserva.personas,
        capacidad: propiedad.capacidad,
      });
    }

    if (
      hoyEnArgentina(reserva.creadaEn).getTime() >
      reserva.fechaIngreso.getTime()
    ) {
      creadasDespuesDelCheckIn += 1;
    }

    if (reserva.temporadaAplicada !== null) {
      conTemporada += 1;
    }

    if (cantidadNoches === 1) {
      conteoTramos.UNA_NOCHE += 1;
    } else if (cantidadNoches >= 2 && cantidadNoches <= 6) {
      conteoTramos.DOS_A_SEIS += 1;
    } else if (cantidadNoches >= 7) {
      conteoTramos.SIETE_O_MAS += 1;
    }

    const clavesNoche = nochesDeReservaEnPeriodo(
      reserva.fechaIngreso,
      reserva.fechaSalida,
      filtros.desde,
      filtros.hasta,
    );

    for (const clave of clavesNoche) {
      const clavePropiedadFecha = `${reserva.propiedadId}|${clave}`;
      const claveMesNoche = clave.slice(0, 7);
      const indiceDia = indiceDiaSemana(
        new Date(`${clave}T00:00:00.000Z`),
      );

      nochesOcupadas.add(clavePropiedadFecha);
      agregarA(nochesPorCabana, propiedad.id, clavePropiedadFecha);
      agregarA(nochesPorMes, claveMesNoche, clavePropiedadFecha);
      agregarA(reservasPorMes, claveMesNoche, reserva.id);
      nochesPorDia[indiceDia].add(clavePropiedadFecha);
      nochesPorPropiedadFecha.set(
        clavePropiedadFecha,
        (nochesPorPropiedadFecha.get(clavePropiedadFecha) ?? 0) + 1,
      );
    }
  }

  const totalReservasPeriodo = reservasEnPeriodo.length;
  const canceladas = reservasEnPeriodo.filter(
    (reserva) => reserva.estado === "CANCELADA",
  ).length;
  const rechazadas = reservasEnPeriodo.filter(
    (reserva) => reserva.estado === "RECHAZADA",
  ).length;
  const ocupacionCruda =
    nochesDisponibles > 0
      ? (nochesOcupadas.size / nochesDisponibles) * 100
      : 0;
  const totalTramos =
    conteoTramos.UNA_NOCHE +
    conteoTramos.DOS_A_SEIS +
    conteoTramos.SIETE_O_MAS;
  const duracion: TramoEstadiaReporte[] = [
    {
      clave: "UNA_NOCHE",
      etiqueta: "1 noche",
      cantidad: conteoTramos.UNA_NOCHE,
      porcentaje:
        totalTramos > 0 ? (conteoTramos.UNA_NOCHE / totalTramos) * 100 : 0,
    },
    {
      clave: "DOS_A_SEIS",
      etiqueta: "2 a 6 noches",
      cantidad: conteoTramos.DOS_A_SEIS,
      porcentaje:
        totalTramos > 0 ? (conteoTramos.DOS_A_SEIS / totalTramos) * 100 : 0,
    },
    {
      clave: "SIETE_O_MAS",
      etiqueta: "7 noches o más",
      cantidad: conteoTramos.SIETE_O_MAS,
      porcentaje:
        totalTramos > 0 ? (conteoTramos.SIETE_O_MAS / totalTramos) * 100 : 0,
    },
  ];
  const conteoDias = diasSemanaDelPeriodo(filtros.desde, filtros.hasta);
  const ocupacionPorDia = conteoDias.map((cantidad, indice) => {
    const disponibles = cantidad * propiedadesFiltradas.length;
    const noches = nochesPorDia[indice].size;
    const cruda = disponibles > 0 ? (noches / disponibles) * 100 : 0;

    return { disponibles, noches, cruda };
  });
  const mejorOcupacion = Math.max(
    ...ocupacionPorDia.map((dia) => dia.cruda),
  );
  const indiceMejor =
    mejorOcupacion > 0
      ? ocupacionPorDia.findIndex((dia) => dia.cruda === mejorOcupacion)
      : -1;
  const diasSemana: DiaSemanaReporte[] = ocupacionPorDia.map(
    (dia, indice) => ({
      indice,
      etiqueta: ETIQUETAS_DIAS[indice],
      noches: dia.noches,
      nochesDisponibles: dia.disponibles,
      ocupacionCruda: dia.cruda,
      ocupacion: normalizarOcupacion(dia.cruda),
      esFinDeSemana: indice === 4 || indice === 5,
      esMejor: indice === indiceMejor,
    }),
  );
  const usoBase = propiedadesFiltradas.map((propiedad) => {
    const reservasCabana = reservasPorCabana.get(propiedad.id)?.size ?? 0;
    const noches = nochesPorCabana.get(propiedad.id)?.size ?? 0;
    const sumaEstadiasCabana =
      sumaEstadiasPorCabana.get(propiedad.id) ?? 0;
    const sumaPersonasCabana =
      sumaPersonasPorCabana.get(propiedad.id) ?? 0;
    const sumaUtilizacionCabana =
      sumaUtilizacionPorCabana.get(propiedad.id) ?? 0;
    const conteoUtilizacionCabana =
      conteoUtilizacionPorCabana.get(propiedad.id) ?? 0;
    const ocupacionCabana =
      nochesPeriodo > 0 ? (noches / nochesPeriodo) * 100 : 0;

    return {
      propiedadId: propiedad.id,
      nombre: propiedad.nombre,
      capacidad: propiedad.capacidad,
      reservas: reservasCabana,
      noches,
      nochesDisponibles: nochesPeriodo,
      ocupacionCruda: ocupacionCabana,
      ocupacion: normalizarOcupacion(ocupacionCabana),
      estadiaPromedio:
        reservasCabana > 0 ? sumaEstadiasCabana / reservasCabana : 0,
      personasPromedio:
        reservasCabana > 0 ? sumaPersonasCabana / reservasCabana : 0,
      utilizacionCapacidad:
        conteoUtilizacionCabana > 0
          ? sumaUtilizacionCabana / conteoUtilizacionCabana
          : 0,
    };
  });
  const usoOrdenado = [...usoBase].sort(
    (a, b) =>
      b.noches - a.noches ||
      a.nombre.localeCompare(b.nombre, "es-AR"),
  );
  const usoPorCabana: UsoCabanaReporte[] = usoOrdenado.map(
    (cabana, indice) => ({
      ...cabana,
      posicion: indice + 1,
      esMasUsada: indice === 0 && cabana.noches > 0,
    }),
  );
  const superposiciones = Array.from(
    nochesPorPropiedadFecha.values(),
  ).filter((cantidad) => cantidad > 1).length;
  const ocupacion = normalizarOcupacion(ocupacionCruda);
  const sinTemporada = reservasOcupacion.length - conTemporada;
  const ocupacionExcedida = ocupacionCruda > 100;
  const sinInconsistencias =
    superposiciones === 0 &&
    sobrecapacidad.length === 0 &&
    creadasDespuesDelCheckIn === 0 &&
    sinTemporada === 0 &&
    !ocupacionExcedida;

  return {
    resumen: {
      nochesOcupadas: nochesOcupadas.size,
      nochesDisponibles,
      ocupacionCruda,
      ocupacion,
      reservas: reservasOcupacion.length,
      estadiaPromedio:
        reservasOcupacion.length > 0
          ? sumaEstadias / reservasOcupacion.length
          : 0,
      personasPromedio:
        reservasOcupacion.length > 0
          ? sumaPersonas / reservasOcupacion.length
          : 0,
      totalReservasPeriodo,
      canceladas,
      rechazadas,
      canceladasRechazadasPct:
        totalReservasPeriodo > 0
          ? ((canceladas + rechazadas) / totalReservasPeriodo) * 100
          : 0,
      incluyeFuturo: filtros.hasta.getTime() > hoy.getTime(),
    },
    usoPorCabana,
    evolucionMensual: meses.map((mes) => ({
      anio: mes.anio,
      mes: mes.mes,
      clave: mes.clave,
      noches: nochesPorMes.get(mes.clave)?.size ?? 0,
      reservas: reservasPorMes.get(mes.clave)?.size ?? 0,
      esFuturo: esMesFuturo(mes.anio, mes.mes, hoy),
    })),
    duracion,
    diasSemana,
    personas: {
      promedio:
        reservasOcupacion.length > 0
          ? sumaPersonas / reservasOcupacion.length
          : 0,
      utilizacionCapacidadPromedio:
        conteoUtilizacion > 0 ? sumaUtilizacion / conteoUtilizacion : 0,
      sobrecapacidad: [...sobrecapacidad].sort(
        (a, b) => a.fechaIngreso.getTime() - b.fechaIngreso.getTime(),
      ),
    },
    calidad: {
      superposiciones,
      sobrecapacidad: sobrecapacidad.length,
      creadasDespuesDelCheckIn,
      sinTemporada,
      ocupacionExcedida,
      sinInconsistencias,
    },
    temporada: {
      conTemporada,
      total: reservasOcupacion.length,
    },
  };
}
