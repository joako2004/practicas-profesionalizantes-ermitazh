import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  calcularReporte,
  normalizarOcupacion,
  periodoDeHistorial,
} from "./calcular";
import { parsearFechaReporte } from "./fechas";
import type {
  EstadoReservaReporte,
  FiltrosReporte,
  PropiedadReporte,
  ReservaReporte,
  TemporadaReporte,
} from "./tipos";

type ConfigReserva = {
  id: string;
  propiedadId?: string;
  ingreso: string;
  salida: string;
  estado?: EstadoReservaReporte;
  personas?: number;
  creadaEn?: string;
  temporadaAplicada?: TemporadaReporte | null;
};

const PROPIEDAD_A: PropiedadReporte = {
  id: "a",
  nombre: "Cabaña A",
  capacidad: 4,
  activa: true,
};

const PROPIEDAD_B: PropiedadReporte = {
  id: "b",
  nombre: "Cabaña B",
  capacidad: 2,
  activa: true,
};

const PROPIEDAD_C: PropiedadReporte = {
  id: "c",
  nombre: "Cabaña C",
  capacidad: 3,
  activa: false,
};

function fecha(valor: string): Date {
  const resultado = parsearFechaReporte(valor);
  assert.ok(resultado);
  return resultado;
}

function crearReserva(config: ConfigReserva): ReservaReporte {
  return {
    id: config.id,
    propiedadId: config.propiedadId ?? "a",
    fechaIngreso: fecha(config.ingreso),
    fechaSalida: fecha(config.salida),
    estado: config.estado ?? "CONFIRMADA",
    personas: config.personas ?? 2,
    creadaEn: new Date(
      config.creadaEn ?? "2025-01-01T12:00:00.000Z",
    ),
    temporadaAplicada:
      config.temporadaAplicada === undefined
        ? "ALTA"
        : config.temporadaAplicada,
  };
}

function filtros(
  desde: string,
  hasta: string,
  extra: Partial<FiltrosReporte> = {},
): FiltrosReporte {
  return {
    desde: fecha(desde),
    hasta: fecha(hasta),
    propiedadId: null,
    modoEstado: "CONFIRMADA",
    ...extra,
  };
}

describe("calcularReporte", () => {
  it("cuenta noches únicas y excluye el checkout", () => {
    const reporte = calcularReporte(
      [
        crearReserva({ id: "r1", ingreso: "2026-01-10", salida: "2026-01-12" }),
        crearReserva({ id: "r2", ingreso: "2026-01-12", salida: "2026-01-13" }),
      ],
      [PROPIEDAD_A],
      filtros("2026-01-10", "2026-01-12"),
      fecha("2026-02-01"),
    );

    assert.equal(reporte.resumen.nochesOcupadas, 3);
    assert.equal(reporte.resumen.nochesDisponibles, 3);
    assert.equal(reporte.resumen.ocupacion, 100);
    assert.equal(reporte.resumen.reservas, 2);
    assert.equal(reporte.resumen.totalReservasPeriodo, 2);
    assert.equal(reporte.resumen.estadiaPromedio, 1.5);
    assert.equal(reporte.resumen.personasPromedio, 2);
    assert.equal(reporte.resumen.incluyeFuturo, false);
    assert.equal(reporte.usoPorCabana[0].noches, 3);
    assert.equal(reporte.usoPorCabana[0].reservas, 2);
    assert.equal(reporte.usoPorCabana[0].ocupacion, 100);
    assert.equal(reporte.usoPorCabana[0].estadiaPromedio, 1.5);
    assert.equal(reporte.usoPorCabana[0].personasPromedio, 2);
    assert.equal(reporte.usoPorCabana[0].posicion, 1);
    assert.equal(reporte.usoPorCabana[0].esMasUsada, true);
    assert.deepEqual(
      reporte.duracion.map((tramo) => tramo.cantidad),
      [1, 1, 0],
    );
    assert.equal(reporte.evolucionMensual[0].noches, 3);
    assert.equal(reporte.evolucionMensual[0].reservas, 2);
    assert.equal(reporte.temporada.conTemporada, 2);
    assert.equal(reporte.temporada.total, 2);
    assert.equal(reporte.calidad.sinInconsistencias, true);
  });

  it("marca la ocupación como proyectada si el período termina en el futuro", () => {
    const reporte = calcularReporte(
      [],
      [PROPIEDAD_A],
      filtros("2026-01-01", "2026-12-31"),
      fecha("2026-11-07"),
    );

    assert.equal(reporte.resumen.incluyeFuturo, true);
  });

  it("cuenta una superposición una sola vez y la reporta", () => {
    const reporte = calcularReporte(
      [
        crearReserva({ id: "r1", ingreso: "2026-01-10", salida: "2026-01-13" }),
        crearReserva({ id: "r2", ingreso: "2026-01-11", salida: "2026-01-13" }),
      ],
      [PROPIEDAD_A],
      filtros("2026-01-10", "2026-01-12"),
      fecha("2026-02-01"),
    );

    assert.equal(reporte.resumen.nochesOcupadas, 3);
    assert.equal(reporte.resumen.ocupacion, 100);
    assert.equal(reporte.calidad.superposiciones, 2);
    assert.equal(reporte.calidad.sinInconsistencias, false);
  });

  it("respeta el modo de estados y calcula canceladas sobre el total", () => {
    const reservas = [
      crearReserva({ id: "r1", ingreso: "2026-01-01", salida: "2026-01-02" }),
      crearReserva({
        id: "r2",
        ingreso: "2026-01-02",
        salida: "2026-01-03",
        estado: "PENDIENTE",
        temporadaAplicada: null,
        creadaEn: "2026-01-04T12:00:00.000Z",
      }),
      crearReserva({
        id: "r3",
        ingreso: "2026-01-03",
        salida: "2026-01-04",
        estado: "RECHAZADA",
      }),
      crearReserva({
        id: "r4",
        ingreso: "2026-01-04",
        salida: "2026-01-05",
        estado: "CANCELADA",
      }),
    ];

    const confirmadas = calcularReporte(
      reservas,
      [PROPIEDAD_A],
      filtros("2026-01-01", "2026-01-31"),
      fecha("2026-02-01"),
    );

    assert.equal(confirmadas.resumen.reservas, 1);
    assert.equal(confirmadas.resumen.nochesOcupadas, 1);
    assert.equal(confirmadas.resumen.totalReservasPeriodo, 4);
    assert.equal(confirmadas.resumen.canceladas, 1);
    assert.equal(confirmadas.resumen.rechazadas, 1);
    assert.equal(confirmadas.resumen.canceladasRechazadasPct, 50);
    assert.equal(confirmadas.temporada.conTemporada, 1);
    assert.equal(confirmadas.temporada.total, 1);
    assert.equal(confirmadas.calidad.creadasDespuesDelCheckIn, 0);

    const comprometidas = calcularReporte(
      reservas,
      [PROPIEDAD_A],
      filtros("2026-01-01", "2026-01-31", {
        modoEstado: "CONFIRMADA_PENDIENTE",
      }),
      fecha("2026-02-01"),
    );

    assert.equal(comprometidas.resumen.reservas, 2);
    assert.equal(comprometidas.resumen.nochesOcupadas, 2);
    assert.equal(comprometidas.resumen.totalReservasPeriodo, 4);
    assert.equal(comprometidas.resumen.canceladasRechazadasPct, 50);
    assert.equal(comprometidas.temporada.conTemporada, 1);
    assert.equal(comprometidas.temporada.total, 2);
    assert.equal(comprometidas.calidad.sinTemporada, 1);
    assert.equal(comprometidas.calidad.creadasDespuesDelCheckIn, 1);
    assert.equal(comprometidas.calidad.sinInconsistencias, false);
  });

  it("excluye cabañas inactivas y aplica el filtro de cabaña", () => {
    const reservas = [
      crearReserva({ id: "ra", ingreso: "2026-01-01", salida: "2026-01-02" }),
      crearReserva({
        id: "rb",
        propiedadId: "b",
        ingreso: "2026-01-01",
        salida: "2026-01-02",
      }),
      crearReserva({
        id: "rc",
        propiedadId: "c",
        ingreso: "2026-01-01",
        salida: "2026-01-02",
      }),
    ];

    const todas = calcularReporte(
      reservas,
      [PROPIEDAD_A, PROPIEDAD_B, PROPIEDAD_C],
      filtros("2026-01-01", "2026-01-02"),
      fecha("2026-02-01"),
    );

    assert.equal(todas.resumen.nochesOcupadas, 2);
    assert.equal(todas.resumen.nochesDisponibles, 4);
    assert.equal(todas.resumen.ocupacion, 50);
    assert.equal(todas.usoPorCabana.length, 2);
    assert.equal(todas.usoPorCabana[0].nombre, "Cabaña A");
    assert.equal(todas.usoPorCabana[0].esMasUsada, true);
    assert.equal(todas.usoPorCabana[1].nombre, "Cabaña B");
    assert.equal(todas.usoPorCabana[1].esMasUsada, false);

    const soloB = calcularReporte(
      reservas,
      [PROPIEDAD_A, PROPIEDAD_B, PROPIEDAD_C],
      filtros("2026-01-01", "2026-01-02", { propiedadId: "b" }),
      fecha("2026-02-01"),
    );

    assert.equal(soloB.resumen.nochesOcupadas, 1);
    assert.equal(soloB.resumen.nochesDisponibles, 2);
    assert.equal(soloB.resumen.ocupacion, 50);
    assert.equal(soloB.usoPorCabana.length, 1);
    assert.equal(soloB.usoPorCabana[0].nombre, "Cabaña B");

    const soloInactiva = calcularReporte(
      reservas,
      [PROPIEDAD_A, PROPIEDAD_B, PROPIEDAD_C],
      filtros("2026-01-01", "2026-01-02", { propiedadId: "c" }),
      fecha("2026-02-01"),
    );

    assert.equal(soloInactiva.resumen.nochesOcupadas, 0);
    assert.equal(soloInactiva.resumen.nochesDisponibles, 0);
    assert.equal(soloInactiva.usoPorCabana.length, 0);
  });

  it("detecta sobrecapacidad y calcula la utilización promedio", () => {
    const reporte = calcularReporte(
      [
        crearReserva({
          id: "r1",
          ingreso: "2026-01-01",
          salida: "2026-01-02",
          personas: 4,
        }),
        crearReserva({
          id: "r2",
          ingreso: "2026-01-02",
          salida: "2026-01-04",
          personas: 6,
        }),
      ],
      [PROPIEDAD_A],
      filtros("2026-01-01", "2026-01-04"),
      fecha("2026-02-01"),
    );

    assert.equal(reporte.resumen.nochesOcupadas, 3);
    assert.equal(reporte.resumen.ocupacion, 75);
    assert.equal(reporte.resumen.personasPromedio, 5);
    assert.equal(reporte.personas.promedio, 5);
    assert.equal(reporte.personas.utilizacionCapacidadPromedio, 125);
    assert.equal(reporte.usoPorCabana[0].utilizacionCapacidad, 125);
    assert.equal(reporte.personas.sobrecapacidad.length, 1);
    assert.equal(reporte.personas.sobrecapacidad[0].reservaId, "r2");
    assert.equal(reporte.calidad.sobrecapacidad, 1);
    assert.equal(reporte.calidad.sinInconsistencias, false);
  });

  it("distribuye las estadías en tres tramos y cruza meses", () => {
    const reporte = calcularReporte(
      [
        crearReserva({ id: "r1", ingreso: "2026-01-01", salida: "2026-01-02" }),
        crearReserva({ id: "r2", ingreso: "2026-01-02", salida: "2026-01-05" }),
        crearReserva({ id: "r3", ingreso: "2026-01-05", salida: "2026-01-13" }),
      ],
      [PROPIEDAD_A],
      filtros("2026-01-01", "2026-01-31"),
      fecha("2026-02-01"),
    );

    assert.deepEqual(
      reporte.duracion.map((tramo) => tramo.cantidad),
      [1, 1, 1],
    );
    assert.ok(
      reporte.duracion.every(
        (tramo) => Math.abs(tramo.porcentaje - 100 / 3) < 1e-9,
      ),
    );
    assert.equal(reporte.resumen.estadiaPromedio, 4);
    assert.equal(reporte.resumen.nochesOcupadas, 12);
    assert.equal(reporte.evolucionMensual.length, 1);
  });

  it("marca meses futuros y devuelve un reporte vacío sin reservas", () => {
    const reporte = calcularReporte(
      [],
      [PROPIEDAD_A],
      filtros("2026-11-01", "2027-01-31"),
      fecha("2026-11-07"),
    );

    assert.equal(reporte.resumen.reservas, 0);
    assert.equal(reporte.resumen.ocupacion, 0);
    assert.equal(reporte.resumen.nochesDisponibles, 92);
    assert.equal(reporte.usoPorCabana.length, 1);
    assert.equal(reporte.usoPorCabana[0].noches, 0);
    assert.equal(reporte.usoPorCabana[0].esMasUsada, false);
    assert.deepEqual(
      reporte.evolucionMensual.map((mes) => mes.esFuturo),
      [false, true, true],
    );
    assert.equal(reporte.calidad.sinInconsistencias, true);
  });
});

describe("normalizarOcupacion", () => {
  it("limita el valor visual a 100", () => {
    assert.equal(normalizarOcupacion(120), 100);
  });

  it("convierte valores negativos o inválidos a cero", () => {
    assert.equal(normalizarOcupacion(-5), 0);
    assert.equal(normalizarOcupacion(Number.NaN), 0);
  });
});

describe("periodoDeHistorial", () => {
  const respaldo = {
    desde: fecha("2026-01-01"),
    hasta: fecha("2026-12-31"),
  };

  it("toma la primera entrada y la última noche de salida", () => {
    const periodo = periodoDeHistorial(
      [
        crearReserva({ id: "r1", ingreso: "2026-01-10", salida: "2026-01-12" }),
        crearReserva({
          id: "r2",
          ingreso: "2026-12-30",
          salida: "2027-01-02",
        }),
      ],
      respaldo,
    );

    assert.equal(periodo.desde.toISOString(), "2026-01-10T00:00:00.000Z");
    assert.equal(periodo.hasta.toISOString(), "2027-01-01T00:00:00.000Z");
  });

  it("usa el respaldo cuando no hay reservas", () => {
    assert.deepEqual(periodoDeHistorial([], respaldo), respaldo);
  });

  it("calcula una sola noche de historial", () => {
    const periodo = periodoDeHistorial(
      [crearReserva({ id: "r1", ingreso: "2026-06-10", salida: "2026-06-11" })],
      respaldo,
    );

    assert.equal(periodo.desde.toISOString(), "2026-06-10T00:00:00.000Z");
    assert.equal(periodo.hasta.toISOString(), "2026-06-10T00:00:00.000Z");
  });

  it("usa el respaldo si el rango calculado es inválido", () => {
    const periodo = periodoDeHistorial(
      [crearReserva({ id: "r1", ingreso: "2026-06-10", salida: "2026-06-10" })],
      respaldo,
    );

    assert.deepEqual(periodo, respaldo);
  });
});
