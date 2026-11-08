import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  claveFecha,
  diasSemanaDelPeriodo,
  esMesFuturo,
  filtroReservasDelPeriodo,
  finExclusivo,
  indiceDiaSemana,
  mesesDelPeriodo,
  nochesDeReservaEnPeriodo,
  nochesDelPeriodo,
  nochesEntre,
  parsearFechaReporte,
  reservaSolapaPeriodo,
  sumarDias,
  textoFecha,
  type MesPeriodo,
} from "./fechas";

function fecha(valor: string): Date {
  const resultado = parsearFechaReporte(valor);
  assert.ok(resultado);
  return resultado;
}

describe("parsearFechaReporte", () => {
  it("parsea una fecha válida en UTC", () => {
    const resultado = parsearFechaReporte("2026-11-07");
    assert.ok(resultado);
    assert.equal(resultado.toISOString(), "2026-11-07T00:00:00.000Z");
  });

  it("rechaza un formato inválido", () => {
    assert.equal(parsearFechaReporte("07/11/2026"), null);
  });

  it("rechaza un día inexistente", () => {
    assert.equal(parsearFechaReporte("2026-02-30"), null);
  });

  it("acepta el 29 de febrero de un año bisiesto", () => {
    const resultado = parsearFechaReporte("2028-02-29");
    assert.ok(resultado);
    assert.equal(claveFecha(resultado), "2028-02-29");
  });

  it("rechaza el 29 de febrero de un año no bisiesto", () => {
    assert.equal(parsearFechaReporte("2027-02-29"), null);
  });

  it("devuelve null para valores vacíos", () => {
    assert.equal(parsearFechaReporte(null), null);
    assert.equal(parsearFechaReporte(""), null);
  });
});

describe("fechas del período", () => {
  it("suma días cruzando fin de mes", () => {
    assert.equal(claveFecha(sumarDias(fecha("2026-01-31"), 1)), "2026-02-01");
  });

  it("suma días cruzando fin de año", () => {
    assert.equal(claveFecha(sumarDias(fecha("2026-12-31"), 1)), "2027-01-01");
  });

  it("calcula el fin exclusivo", () => {
    assert.equal(claveFecha(finExclusivo(fecha("2026-12-31"))), "2027-01-01");
  });

  it("cuenta una sola noche", () => {
    assert.equal(nochesEntre(fecha("2026-10-20"), fecha("2026-10-21")), 1);
  });

  it("cuenta dos a seis noches", () => {
    assert.equal(nochesEntre(fecha("2026-10-20"), fecha("2026-10-26")), 6);
  });

  it("cuenta siete noches o más", () => {
    assert.equal(nochesEntre(fecha("2026-10-20"), fecha("2026-10-28")), 8);
  });

  it("excluye el día de salida", () => {
    const noches = nochesDeReservaEnPeriodo(
      fecha("2026-10-20"),
      fecha("2026-10-23"),
      fecha("2026-10-20"),
      fecha("2026-10-23"),
    );

    assert.deepEqual(noches, ["2026-10-20", "2026-10-21", "2026-10-22"]);
  });

  it("incluye desde y hasta como noches", () => {
    assert.equal(nochesDelPeriodo(fecha("2026-10-20"), fecha("2026-10-20")), 1);
  });

  it("no cuenta un período invertido", () => {
    assert.equal(nochesDelPeriodo(fecha("2026-10-21"), fecha("2026-10-20")), 0);
  });

  it("recorta las noches al período consultado", () => {
    const noches = nochesDeReservaEnPeriodo(
      fecha("2026-10-18"),
      fecha("2026-10-25"),
      fecha("2026-10-20"),
      fecha("2026-10-22"),
    );

    assert.deepEqual(noches, ["2026-10-20", "2026-10-21", "2026-10-22"]);
  });

  it("cuenta una reserva que cruza el fin de año", () => {
    const noches = nochesDeReservaEnPeriodo(
      fecha("2026-12-30"),
      fecha("2027-01-03"),
      fecha("2026-12-01"),
      fecha("2027-01-31"),
    );

    assert.deepEqual(noches, [
      "2026-12-30",
      "2026-12-31",
      "2027-01-01",
      "2027-01-02",
    ]);
  });
});

describe("filtro de reservas del período", () => {
  it("usa el fin exclusivo de hasta como límite de ingreso", () => {
    const filtro = filtroReservasDelPeriodo(
      fecha("2026-01-01"),
      fecha("2026-12-31"),
    );

    assert.equal(claveFecha(filtro.fechaIngreso.lt), "2027-01-01");
    assert.equal(claveFecha(filtro.fechaSalida.gt), "2026-01-01");
  });
});

describe("superposición con el período", () => {
  const desde = fecha("2026-10-10");
  const hasta = fecha("2026-10-20");

  it("detecta una reserva dentro del período", () => {
    assert.equal(
      reservaSolapaPeriodo(fecha("2026-10-12"), fecha("2026-10-15"), desde, hasta),
      true,
    );
  });

  it("detecta una reserva que empieza antes del período", () => {
    assert.equal(
      reservaSolapaPeriodo(fecha("2026-10-08"), fecha("2026-10-12"), desde, hasta),
      true,
    );
  });

  it("detecta una reserva que termina después del período", () => {
    assert.equal(
      reservaSolapaPeriodo(fecha("2026-10-18"), fecha("2026-10-23"), desde, hasta),
      true,
    );
  });

  it("no cuenta una reserva que sale el primer día", () => {
    assert.equal(
      reservaSolapaPeriodo(fecha("2026-10-08"), fecha("2026-10-10"), desde, hasta),
      false,
    );
  });

  it("sí cuenta una reserva que ingresa el último día", () => {
    assert.equal(
      reservaSolapaPeriodo(fecha("2026-10-20"), fecha("2026-10-21"), desde, hasta),
      true,
    );
  });

  it("no cuenta una reserva que ingresa el día siguiente al período", () => {
    assert.equal(
      reservaSolapaPeriodo(fecha("2026-10-21"), fecha("2026-10-22"), desde, hasta),
      false,
    );
  });
});

describe("meses y días de semana", () => {
  it("lista los meses de un período parcial", () => {
    const meses = mesesDelPeriodo(fecha("2026-11-15"), fecha("2027-02-02"));
    const esperado: MesPeriodo[] = [
      { anio: 2026, mes: 11, clave: "2026-11" },
      { anio: 2026, mes: 12, clave: "2026-12" },
      { anio: 2027, mes: 1, clave: "2027-01" },
      { anio: 2027, mes: 2, clave: "2027-02" },
    ];

    assert.deepEqual(meses, esperado);
  });

  it("calcula el índice de día de semana con lunes como cero", () => {
    assert.equal(indiceDiaSemana(fecha("2026-01-05")), 0);
    assert.equal(indiceDiaSemana(fecha("2026-01-11")), 6);
  });

  it("cuenta los días de una semana completa", () => {
    assert.deepEqual(
      diasSemanaDelPeriodo(fecha("2026-01-05"), fecha("2026-01-11")),
      [1, 1, 1, 1, 1, 1, 1],
    );
  });

  it("marca un mes futuro", () => {
    assert.equal(esMesFuturo(2026, 12, fecha("2026-11-07")), true);
    assert.equal(esMesFuturo(2026, 11, fecha("2026-11-07")), false);
  });

  it("formatea una fecha corta", () => {
    assert.equal(textoFecha(fecha("2026-11-07")), "07/11/2026");
  });
});
