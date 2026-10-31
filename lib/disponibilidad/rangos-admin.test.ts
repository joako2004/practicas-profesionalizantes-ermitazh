import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  NOCHES_MAX_POR_ACCION,
  nochesDeRangoAdmin,
  type ResultadoNochesAdmin,
} from "./rangos-admin";
import { aClaveFecha, deTextoFecha } from "./noches";

// Construye el día indicado en texto visible "DD/MM/AAAA" a medianoche UTC.
function fechaDeTexto(texto: string): Date {
  const dia = deTextoFecha(texto);
  if (dia === null) {
    throw new Error(`El texto ${texto} debería ser válido`);
  }
  return dia;
}

// Falla el test con un mensaje claro si el resultado no es ok.
function exigirOk(resultado: ResultadoNochesAdmin): Date[] {
  if (!resultado.ok) {
    throw new Error(`Se esperaba un resultado ok, se recibió ${resultado.motivo}`);
  }
  return resultado.fechas;
}

// Convierte una lista de fechas a sus claves "AAAA-MM-DD".
function claves(fechas: readonly Date[]): string[] {
  return fechas.map((dia) => aClaveFecha(dia));
}

describe("nochesDeRangoAdmin: rangos válidos", () => {
  it("marca 1 noche cuando el rango es un solo día (10/10/2026)", () => {
    const fechas = exigirOk(nochesDeRangoAdmin("2026-10-10", "2026-10-10"));

    assert.equal(fechas.length, 1);
    assert.deepEqual(claves(fechas), ["2026-10-10"]);
    assert.equal(fechas[0].getTime(), fechaDeTexto("10/10/2026").getTime());
  });

  it("marca las 4 noches inclusivas del 10/10/2026 al 13/10/2026", () => {
    const fechas = exigirOk(nochesDeRangoAdmin("2026-10-10", "2026-10-13"));

    assert.equal(fechas.length, 4);
    assert.deepEqual(claves(fechas), [
      "2026-10-10",
      "2026-10-11",
      "2026-10-12",
      "2026-10-13",
    ]);

    // Cada fecha debe ser la medianoche UTC exacta de su día.
    for (const dia of fechas) {
      assert.equal(
        dia.getTime(),
        Date.UTC(dia.getUTCFullYear(), dia.getUTCMonth(), dia.getUTCDate()),
      );
      assert.equal(dia.getUTCHours(), 0);
      assert.equal(dia.getUTCMinutes(), 0);
      assert.equal(dia.getUTCSeconds(), 0);
      assert.equal(dia.getUTCMilliseconds(), 0);
    }
  });

  it("acepta exactamente 30 noches (10/10/2026 a 08/11/2026)", () => {
    const fechas = exigirOk(nochesDeRangoAdmin("2026-10-10", "2026-11-08"));

    assert.equal(NOCHES_MAX_POR_ACCION, 30);
    assert.equal(fechas.length, 30);
    assert.equal(aClaveFecha(fechas[0]), "2026-10-10");
    assert.equal(aClaveFecha(fechas[fechas.length - 1]), "2026-11-08");
  });

  it("cuenta bien el cruce de fin de mes (28/10/2026 a 02/11/2026)", () => {
    const fechas = exigirOk(nochesDeRangoAdmin("2026-10-28", "2026-11-02"));

    assert.deepEqual(claves(fechas), [
      "2026-10-28",
      "2026-10-29",
      "2026-10-30",
      "2026-10-31",
      "2026-11-01",
      "2026-11-02",
    ]);
  });

  it("cuenta bien el cruce de fin de año (30/12/2026 a 02/01/2027)", () => {
    const fechas = exigirOk(nochesDeRangoAdmin("2026-12-30", "2027-01-02"));

    assert.equal(fechas.length, 4);
    assert.deepEqual(claves(fechas), [
      "2026-12-30",
      "2026-12-31",
      "2027-01-01",
      "2027-01-02",
    ]);
  });

  it("incluye el 29/02/2028 en un rango bisiesto (27/02/2028 a 01/03/2028)", () => {
    const fechas = exigirOk(nochesDeRangoAdmin("2028-02-27", "2028-03-01"));

    assert.deepEqual(claves(fechas), [
      "2028-02-27",
      "2028-02-28",
      "2028-02-29",
      "2028-03-01",
    ]);
    assert.equal(fechas[2].getTime(), Date.UTC(2028, 1, 29));
  });

  it("acepta los bordes del rango de años (01/01/2000 y 31/12/2100)", () => {
    assert.deepEqual(
      claves(exigirOk(nochesDeRangoAdmin("2000-01-01", "2000-01-01"))),
      ["2000-01-01"],
    );
    assert.deepEqual(
      claves(exigirOk(nochesDeRangoAdmin("2100-12-31", "2100-12-31"))),
      ["2100-12-31"],
    );
  });
});

describe("nochesDeRangoAdmin: máximo por acción", () => {
  it("rechaza 31 noches (10/10/2026 a 09/11/2026) con el máximo informado", () => {
    const resultado = nochesDeRangoAdmin("2026-10-10", "2026-11-09");

    assert.deepEqual(resultado, {
      ok: false,
      motivo: "EXCEDE_MAXIMO",
      maximo: 30,
    });
  });

  it("rechaza un rango gigantesco (01/01/2000 a 31/12/2100) sin generar fechas", () => {
    const resultado = nochesDeRangoAdmin("2000-01-01", "2100-12-31");

    assert.deepEqual(resultado, {
      ok: false,
      motivo: "EXCEDE_MAXIMO",
      maximo: 30,
    });
    // El rechazo no trae lista de fechas: el total se calculó antes de generar.
    assert.equal("fechas" in resultado, false);
  });
});

describe("nochesDeRangoAdmin: rango inválido", () => {
  it("rechaza cuando desde es posterior a hasta (13/10/2026 a 10/10/2026)", () => {
    const resultado = nochesDeRangoAdmin("2026-10-13", "2026-10-10");

    assert.deepEqual(resultado, { ok: false, motivo: "RANGO_INVALIDO" });
  });
});

describe("nochesDeRangoAdmin: fechas inválidas", () => {
  it("rechaza claves con formato inválido o fecha inexistente", () => {
    const invalidas = [
      "",
      "2026-02-31",
      "26-1-1",
      "10/10/2026",
      "2026-10-1",
      "2026-13-01",
    ];

    for (const clave of invalidas) {
      assert.deepEqual(
        nochesDeRangoAdmin(clave, "2026-10-10"),
        { ok: false, motivo: "FECHA_INVALIDA" },
        `La clave ${clave} debería ser inválida como desde`,
      );
      assert.deepEqual(
        nochesDeRangoAdmin("2026-10-10", clave),
        { ok: false, motivo: "FECHA_INVALIDA" },
        `La clave ${clave} debería ser inválida como hasta`,
      );
    }
  });

  it("rechaza años fuera de 2000-2100 (31/12/1999 y 01/01/2101)", () => {
    assert.deepEqual(nochesDeRangoAdmin("1999-12-31", "2000-01-01"), {
      ok: false,
      motivo: "FECHA_INVALIDA",
    });
    assert.deepEqual(nochesDeRangoAdmin("2100-12-31", "2101-01-01"), {
      ok: false,
      motivo: "FECHA_INVALIDA",
    });
  });

  it("rechaza valores que no son string", () => {
    const valores: unknown[] = [null, undefined, 42, true];

    for (const valor of valores) {
      assert.deepEqual(
        nochesDeRangoAdmin(valor as unknown as string, "2026-10-10"),
        { ok: false, motivo: "FECHA_INVALIDA" },
      );
      assert.deepEqual(
        nochesDeRangoAdmin("2026-10-10", valor as unknown as string),
        { ok: false, motivo: "FECHA_INVALIDA" },
      );
    }
  });

  it("prioriza FECHA_INVALIDA sobre RANGO_INVALIDO", () => {
    assert.deepEqual(nochesDeRangoAdmin("2026-02-31", "2026-01-01"), {
      ok: false,
      motivo: "FECHA_INVALIDA",
    });
    assert.deepEqual(nochesDeRangoAdmin("2026-12-31", "2026-02-31"), {
      ok: false,
      motivo: "FECHA_INVALIDA",
    });
  });

  it("prioriza FECHA_INVALIDA sobre EXCEDE_MAXIMO", () => {
    assert.deepEqual(nochesDeRangoAdmin("2026-02-31", "2100-12-31"), {
      ok: false,
      motivo: "FECHA_INVALIDA",
    });
    assert.deepEqual(nochesDeRangoAdmin("1999-12-31", "2100-12-31"), {
      ok: false,
      motivo: "FECHA_INVALIDA",
    });
  });
});

describe("nochesDeRangoAdmin: independencia de las fechas", () => {
  it("no comparte instancias entre posiciones ni entre llamadas", () => {
    const fechas = exigirOk(nochesDeRangoAdmin("2026-10-10", "2026-10-12"));

    // Mutar la primera fecha no cambia la segunda.
    fechas[0].setUTCFullYear(1999);
    assert.equal(aClaveFecha(fechas[1]), "2026-10-11");

    // Una llamada nueva tampoco comparte instancias con la anterior.
    const otras = exigirOk(nochesDeRangoAdmin("2026-10-10", "2026-10-12"));
    assert.notEqual(otras[0], fechas[0]);
    assert.deepEqual(claves(otras), [
      "2026-10-10",
      "2026-10-11",
      "2026-10-12",
    ]);
  });
});
