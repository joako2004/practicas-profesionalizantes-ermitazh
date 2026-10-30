import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { NOCHES_MAX as NOCHES_MAX_PROYECTO } from "../precios/calcular";
import {
  NOCHES_MAX,
  aClaveFecha,
  aTextoFecha,
  deClaveFecha,
  deTextoFecha,
  nochesDeRango,
  puedeElegirseComoLlegada,
  puedeElegirseComoSalida,
  salidaMaxima,
  sumarDias,
  validarRango,
} from "./noches";

// Construye el día indicado (clave "AAAA-MM-DD") a medianoche UTC.
function fecha(clave: string): Date {
  const dia = deClaveFecha(clave);
  if (dia === null) {
    throw new Error(`La clave ${clave} debería ser válida`);
  }
  return dia;
}

// Construye el día indicado en texto visible "DD/MM/AAAA" a medianoche UTC.
function fechaDeTexto(texto: string): Date {
  const dia = deTextoFecha(texto);
  if (dia === null) {
    throw new Error(`El texto ${texto} debería ser válido`);
  }
  return dia;
}

// Devuelve el texto visible de una fecha, o "" si es null.
function textoDe(dia: Date | null): string {
  return dia === null ? "" : aTextoFecha(dia);
}

describe("aClaveFecha y deClaveFecha", () => {
  it("hacen ida y vuelta para varias fechas", () => {
    const claves = [
      "2026-10-05",
      "2026-10-31",
      "2026-12-31",
      "2027-01-01",
      "2028-02-29",
    ];

    for (const clave of claves) {
      const dia = fecha(clave);
      assert.equal(aClaveFecha(dia), clave);
      assert.equal(deClaveFecha(clave)?.getTime(), dia.getTime());
    }
  });

  it("devuelve null para claves con formato inválido o fecha inexistente", () => {
    const invalidas = [
      "2026-02-31",
      "26-1-1",
      "",
      "2026-13-01",
      "2026-10-1",
      "2026-10-05T00:00:00",
      " 2026-10-05",
    ];

    for (const clave of invalidas) {
      assert.equal(deClaveFecha(clave), null, `La clave ${clave} debería ser inválida`);
    }
  });

  it("acepta el 29/02/2028 y rechaza el 29/02/2027", () => {
    assert.equal(aClaveFecha(fecha("2028-02-29")), "2028-02-29");
    assert.equal(deClaveFecha("2028-02-29")?.getTime(), Date.UTC(2028, 1, 29));
    assert.equal(deClaveFecha("2027-02-29"), null);
  });

  it("devuelve una clave vacía para una fecha inválida", () => {
    assert.equal(aClaveFecha(new Date("x")), "");
  });
});

describe("aTextoFecha", () => {
  it("formatea el 05/10/2026 como 05/10/2026", () => {
    assert.equal(aTextoFecha(fecha("2026-10-05")), "05/10/2026");
  });

  it("formatea el 31/12/2026 con ceros a la izquierda", () => {
    assert.equal(aTextoFecha(fecha("2026-12-31")), "31/12/2026");
  });

  it("formatea el 29/02/2028", () => {
    assert.equal(aTextoFecha(fecha("2028-02-29")), "29/02/2028");
  });

  it("devuelve una cadena vacía para una fecha inválida", () => {
    assert.equal(aTextoFecha(new Date("x")), "");
  });
});

describe("deTextoFecha", () => {
  it("acepta el 05/10/2026", () => {
    assert.equal(aClaveFecha(fechaDeTexto("05/10/2026")), "2026-10-05");
  });

  it("acepta el 29/02/2028", () => {
    assert.equal(aClaveFecha(fechaDeTexto("29/02/2028")), "2028-02-29");
  });

  it("interpreta 10/11/2026 como el 10 de noviembre", () => {
    const dia = fechaDeTexto("10/11/2026");
    assert.equal(dia.getUTCFullYear(), 2026);
    assert.equal(dia.getUTCMonth(), 10);
    assert.equal(dia.getUTCDate(), 10);
    assert.equal(aClaveFecha(dia), "2026-11-10");
  });

  it("devuelve null para textos inválidos", () => {
    const invalidos = [
      "31/02/2026",
      "29/02/2027",
      "5/10/2026",
      "05-10/2026",
      "05/10/26",
      "2026-10-05",
      "",
      " 05/10/2026",
      "05/10/2026 ",
      "10/13/2026",
      "00/10/2026",
    ];

    for (const texto of invalidos) {
      assert.equal(deTextoFecha(texto), null, `El texto ${texto} debería ser inválido`);
    }
  });
});

describe("ida y vuelta entre textos y fechas", () => {
  it("conserva el mismo día para fin de mes, fin de año y bisiesto", () => {
    const fechas = [
      fecha("2026-10-05"),
      fecha("2026-10-31"),
      fecha("2026-12-31"),
      fecha("2027-01-01"),
      fecha("2028-02-29"),
    ];

    for (const dia of fechas) {
      assert.equal(deTextoFecha(aTextoFecha(dia))?.getTime(), dia.getTime());
      assert.equal(deClaveFecha(aClaveFecha(dia))?.getTime(), dia.getTime());
    }
  });
});

describe("sumarDias", () => {
  it("suma dentro del mes", () => {
    assert.equal(aTextoFecha(sumarDias(fecha("2026-10-05"), 3)), "08/10/2026");
  });

  it("cruza el fin de mes", () => {
    assert.equal(aTextoFecha(sumarDias(fecha("2026-10-31"), 1)), "01/11/2026");
  });

  it("cruza el fin de año", () => {
    assert.equal(aTextoFecha(sumarDias(fecha("2026-12-31"), 1)), "01/01/2027");
  });

  it("acepta días negativos", () => {
    assert.equal(aTextoFecha(sumarDias(fecha("2027-01-01"), -1)), "31/12/2026");
    assert.equal(aTextoFecha(sumarDias(fecha("2028-03-01"), -1)), "29/02/2028");
  });

  it("no muta la fecha original", () => {
    const original = fecha("2026-10-31");
    const instanteOriginal = original.getTime();

    sumarDias(original, 1);

    assert.equal(original.getTime(), instanteOriginal);
  });
});

describe("nochesDeRango", () => {
  it("del 10/10/2026 al 13/10/2026 ocupa las noches 10, 11 y 12", () => {
    assert.deepEqual(nochesDeRango(fecha("2026-10-10"), fecha("2026-10-13")), [
      "2026-10-10",
      "2026-10-11",
      "2026-10-12",
    ]);
  });

  it("devuelve una sola noche cuando la salida es el día siguiente", () => {
    assert.deepEqual(nochesDeRango(fecha("2026-10-10"), fecha("2026-10-11")), [
      "2026-10-10",
    ]);
  });

  it("devuelve una lista vacía si la salida es igual al ingreso", () => {
    assert.deepEqual(nochesDeRango(fecha("2026-10-10"), fecha("2026-10-10")), []);
  });

  it("devuelve una lista vacía si la salida es anterior al ingreso", () => {
    assert.deepEqual(nochesDeRango(fecha("2026-10-11"), fecha("2026-10-10")), []);
  });

  it("devuelve una lista vacía si alguna fecha es inválida", () => {
    assert.deepEqual(nochesDeRango(new Date("x"), fecha("2026-10-13")), []);
    assert.deepEqual(nochesDeRango(fecha("2026-10-10"), new Date("x")), []);
  });

  it("cruza el fin de año del 30/12/2026 al 02/01/2027", () => {
    assert.deepEqual(nochesDeRango(fecha("2026-12-30"), fecha("2027-01-02")), [
      "2026-12-30",
      "2026-12-31",
      "2027-01-01",
    ]);
  });

  it("cruza el 29/02/2028", () => {
    assert.deepEqual(nochesDeRango(fecha("2028-02-28"), fecha("2028-03-01")), [
      "2028-02-28",
      "2028-02-29",
    ]);
    assert.deepEqual(nochesDeRango(fecha("2028-02-29"), fecha("2028-03-02")), [
      "2028-02-29",
      "2028-03-01",
    ]);
  });

  it("cruza un fin de mes", () => {
    assert.deepEqual(nochesDeRango(fecha("2026-10-31"), fecha("2026-11-02")), [
      "2026-10-31",
      "2026-11-01",
    ]);
  });
});

describe("validarRango", () => {
  it("usa el mismo máximo de noches que el módulo de precios", () => {
    assert.equal(NOCHES_MAX, NOCHES_MAX_PROYECTO);
  });

  it("acepta un rango sin noches bloqueadas", () => {
    assert.deepEqual(validarRango(fecha("2026-10-10"), fecha("2026-10-13"), new Set()), {
      ok: true,
      noches: ["2026-10-10", "2026-10-11", "2026-10-12"],
    });
  });

  it("acepta exactamente NOCHES_MAX noches", () => {
    const resultado = validarRango(fecha("2026-10-01"), fecha("2026-10-31"), new Set());

    assert.equal(resultado.ok, true);
    if (resultado.ok) {
      assert.equal(resultado.noches.length, NOCHES_MAX);
      assert.equal(resultado.noches[0], "2026-10-01");
      assert.equal(resultado.noches[resultado.noches.length - 1], "2026-10-30");
    }
  });

  it("rechaza NOCHES_MAX + 1 noches", () => {
    assert.deepEqual(validarRango(fecha("2026-10-01"), fecha("2026-11-01"), new Set()), {
      ok: false,
      motivo: "EXCEDE_NOCHES_MAX",
      maximo: NOCHES_MAX,
    });
  });

  it("rechaza una salida igual al ingreso", () => {
    assert.deepEqual(validarRango(fecha("2026-10-10"), fecha("2026-10-10"), new Set()), {
      ok: false,
      motivo: "RANGO_INVALIDO",
    });
  });

  it("rechaza una salida anterior al ingreso", () => {
    assert.deepEqual(validarRango(fecha("2026-10-11"), fecha("2026-10-10"), new Set()), {
      ok: false,
      motivo: "RANGO_INVALIDO",
    });
  });

  it("rechaza fechas inválidas", () => {
    assert.deepEqual(validarRango(new Date("x"), fecha("2026-10-13"), new Set()), {
      ok: false,
      motivo: "RANGO_INVALIDO",
    });
    assert.deepEqual(validarRango(fecha("2026-10-10"), new Date("x"), new Set()), {
      ok: false,
      motivo: "RANGO_INVALIDO",
    });
  });

  it("detecta una noche bloqueada en el medio del rango", () => {
    assert.deepEqual(
      validarRango(
        fecha("2026-10-10"),
        fecha("2026-10-14"),
        new Set(["2026-10-11"]),
      ),
      {
        ok: false,
        motivo: "NOCHES_BLOQUEADAS",
        noches: ["2026-10-11"],
      },
    );
  });

  it("devuelve las noches bloqueadas en orden ascendente", () => {
    assert.deepEqual(
      validarRango(
        fecha("2026-10-10"),
        fecha("2026-10-14"),
        new Set(["2026-10-13", "2026-10-11"]),
      ),
      {
        ok: false,
        motivo: "NOCHES_BLOQUEADAS",
        noches: ["2026-10-11", "2026-10-13"],
      },
    );
  });

  it("no invalida el rango si la noche de salida está bloqueada", () => {
    assert.deepEqual(
      validarRango(fecha("2026-10-10"), fecha("2026-10-13"), new Set(["2026-10-13"])),
      {
        ok: true,
        noches: ["2026-10-10", "2026-10-11", "2026-10-12"],
      },
    );
  });

  it("invalida el rango si la noche de ingreso está bloqueada", () => {
    assert.deepEqual(
      validarRango(fecha("2026-10-10"), fecha("2026-10-13"), new Set(["2026-10-10"])),
      {
        ok: false,
        motivo: "NOCHES_BLOQUEADAS",
        noches: ["2026-10-10"],
      },
    );
  });

  it("ignora las noches bloqueadas fuera del rango", () => {
    const bloqueadas = new Set(["2026-10-09", "2026-10-13", "2026-10-20"]);

    assert.deepEqual(validarRango(fecha("2026-10-10"), fecha("2026-10-13"), bloqueadas), {
      ok: true,
      noches: ["2026-10-10", "2026-10-11", "2026-10-12"],
    });
  });

  it("comprueba el máximo antes que las noches bloqueadas", () => {
    assert.deepEqual(
      validarRango(
        fecha("2026-10-01"),
        fecha("2026-11-01"),
        new Set(["2026-10-10"]),
      ),
      {
        ok: false,
        motivo: "EXCEDE_NOCHES_MAX",
        maximo: NOCHES_MAX,
      },
    );
  });
});

describe("puedeElegirseComoLlegada", () => {
  it("acepta un día cuya noche está libre", () => {
    assert.equal(puedeElegirseComoLlegada(fecha("2026-10-10"), new Set()), true);
  });

  it("rechaza un día cuya noche está bloqueada", () => {
    assert.equal(
      puedeElegirseComoLlegada(fecha("2026-10-10"), new Set(["2026-10-10"])),
      false,
    );
  });

  it("mantiene elegible el día anterior a una noche bloqueada", () => {
    assert.equal(
      puedeElegirseComoLlegada(fecha("2026-10-10"), new Set(["2026-10-11"])),
      true,
    );
  });
});

describe("puedeElegirseComoSalida", () => {
  it("rechaza una salida igual al ingreso", () => {
    assert.equal(
      puedeElegirseComoSalida(fecha("2026-10-10"), fecha("2026-10-10"), new Set()),
      false,
    );
  });

  it("rechaza una salida más allá de una noche bloqueada", () => {
    assert.equal(
      puedeElegirseComoSalida(fecha("2026-10-10"), fecha("2026-10-13"), new Set(["2026-10-12"])),
      false,
    );
  });

  it("acepta una salida justo el día de una noche bloqueada", () => {
    assert.equal(
      puedeElegirseComoSalida(fecha("2026-10-10"), fecha("2026-10-12"), new Set(["2026-10-12"])),
      true,
    );
  });
});

describe("salidaMaxima", () => {
  it("sin bloqueos devuelve ingreso + NOCHES_MAX", () => {
    assert.equal(textoDe(salidaMaxima(fecha("2026-10-10"), new Set())), "09/11/2026");
  });

  it("con la noche del 15/10/2026 bloqueada devuelve el 15/10/2026", () => {
    const resultado = salidaMaxima(fecha("2026-10-10"), new Set(["2026-10-15"]));

    assert.equal(textoDe(resultado), "15/10/2026");
  });

  it("devuelve null si la noche del propio ingreso está bloqueada", () => {
    assert.equal(salidaMaxima(fecha("2026-10-10"), new Set(["2026-10-10"])), null);
  });

  it("ignora un bloqueo más allá de las NOCHES_MAX noches", () => {
    const resultado = salidaMaxima(fecha("2026-10-10"), new Set(["2026-11-20"]));

    assert.equal(textoDe(resultado), "09/11/2026");
  });

  it("devuelve null si el ingreso es inválido", () => {
    assert.equal(salidaMaxima(new Date("x"), new Set()), null);
  });
});

describe("consistencia entre salidaMaxima y puedeElegirseComoSalida", () => {
  it("acepta exactamente los días posteriores al ingreso hasta la salida máxima", () => {
    const ingreso = fecha("2026-10-10");
    const bloqueadas = new Set(["2026-10-15", "2026-10-20", "2026-11-05"]);
    const maximo = salidaMaxima(ingreso, bloqueadas);

    if (maximo === null) {
      throw new Error("La salida máxima no debería ser null");
    }

    for (let i = -2; i <= NOCHES_MAX + 3; i += 1) {
      const dia = sumarDias(ingreso, i);
      const esperado: boolean = i > 0 && dia.getTime() <= maximo.getTime();

      assert.equal(
        puedeElegirseComoSalida(ingreso, dia, bloqueadas),
        esperado,
        `El día ${aTextoFecha(dia)} no coincide con la salida máxima`,
      );
    }
  });

  it("rechaza todos los días cuando la noche del ingreso está bloqueada", () => {
    const ingreso = fecha("2026-10-10");
    const bloqueadas = new Set(["2026-10-10", "2026-10-15"]);

    assert.equal(salidaMaxima(ingreso, bloqueadas), null);

    for (let i = -2; i <= NOCHES_MAX + 3; i += 1) {
      const dia = sumarDias(ingreso, i);
      assert.equal(
        puedeElegirseComoSalida(ingreso, dia, bloqueadas),
        false,
        `El día ${aTextoFecha(dia)} debería estar rechazado`,
      );
    }
  });
});

describe("inmutabilidad", () => {
  it("no muta las fechas ni el conjunto de noches bloqueadas", () => {
    const ingreso = fecha("2026-10-10");
    const salida = fecha("2026-10-13");
    const bloqueadas = new Set(["2026-10-12", "2026-10-13"]);
    const instanteIngreso = ingreso.getTime();
    const instanteSalida = salida.getTime();
    const bloqueadasAntes = [...bloqueadas].sort();

    aClaveFecha(ingreso);
    aTextoFecha(ingreso);
    sumarDias(ingreso, 5);
    nochesDeRango(ingreso, salida);
    validarRango(ingreso, salida, bloqueadas);
    puedeElegirseComoLlegada(ingreso, bloqueadas);
    puedeElegirseComoSalida(ingreso, salida, bloqueadas);
    salidaMaxima(ingreso, bloqueadas);

    assert.equal(ingreso.getTime(), instanteIngreso);
    assert.equal(salida.getTime(), instanteSalida);
    assert.deepEqual([...bloqueadas].sort(), bloqueadasAntes);
  });
});
