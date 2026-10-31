import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { NOCHES_MAX_POR_ACCION, nochesDeRangoAdmin } from "./rangos-admin";
import {
  SELECCION_VACIA,
  elegirDiaRango,
  marcaDeDia,
  rangoDeSeleccion,
  resumirSeleccion,
  type MarcaSeleccion,
  type SeleccionRango,
} from "./seleccion-admin";

// Arma una selección con los dos extremos indicados.
function seleccion(
  inicio: string | null,
  fin: string | null,
): SeleccionRango {
  return { inicio, fin };
}

// Claves que no representan un día real.
const CLAVES_INVALIDAS = ["hola", "2026-02-30", "05/11/2026", ""];

describe("SELECCION_VACIA", () => {
  it("no tiene inicio ni fin y está congelada", () => {
    assert.equal(SELECCION_VACIA.inicio, null);
    assert.equal(SELECCION_VACIA.fin, null);
    assert.equal(Object.isFrozen(SELECCION_VACIA), true);
  });
});

describe("elegirDiaRango", () => {
  it("elige el primer día como inicio y deja el fin pendiente", () => {
    assert.deepEqual(
      elegirDiaRango(SELECCION_VACIA, "2026-11-05"),
      seleccion("2026-11-05", null),
    );
    assert.deepEqual(SELECCION_VACIA, seleccion(null, null));
  });

  it("cierra el rango con un segundo clic posterior", () => {
    const conInicio = seleccion("2026-11-05", null);

    assert.deepEqual(
      elegirDiaRango(conInicio, "2026-11-08"),
      seleccion("2026-11-05", "2026-11-08"),
    );
  });

  it("arma un rango de un solo día si el segundo clic es el mismo día", () => {
    const conInicio = seleccion("2026-11-05", null);

    assert.deepEqual(
      elegirDiaRango(conInicio, "2026-11-05"),
      seleccion("2026-11-05", "2026-11-05"),
    );
  });

  it("reemplaza el inicio si el segundo clic es anterior", () => {
    const conInicio = seleccion("2026-11-05", null);

    assert.deepEqual(
      elegirDiaRango(conInicio, "2026-11-03"),
      seleccion("2026-11-03", null),
    );
  });

  it("reinicia la selección con un tercer clic sobre un rango completo", () => {
    const completo = seleccion("2026-11-05", "2026-11-08");

    assert.deepEqual(
      elegirDiaRango(completo, "2026-11-20"),
      seleccion("2026-11-20", null),
    );
  });

  it("ignora las claves inválidas sin cambiar el estado", () => {
    const estados = [
      SELECCION_VACIA,
      seleccion("2026-11-05", null),
      seleccion("2026-11-05", "2026-11-08"),
    ];

    for (const estado of estados) {
      for (const clave of CLAVES_INVALIDAS) {
        assert.deepEqual(
          elegirDiaRango(estado, clave),
          estado,
          `la clave "${clave}" no debería modificar la selección`,
        );
      }
    }
  });

  it("no muta la selección de entrada", () => {
    const original = seleccion("2026-11-05", null);
    const copia = { ...original };

    const resultado = elegirDiaRango(original, "2026-11-08");

    assert.deepEqual(original, copia);
    assert.notEqual(resultado, original);
  });

  it("cruza el cambio de año sin correrse de día", () => {
    const conInicio = elegirDiaRango(SELECCION_VACIA, "2026-12-30");

    assert.deepEqual(
      elegirDiaRango(conInicio, "2027-01-02"),
      seleccion("2026-12-30", "2027-01-02"),
    );
  });
});

describe("rangoDeSeleccion", () => {
  it("devuelve null si no hay inicio", () => {
    assert.equal(rangoDeSeleccion(SELECCION_VACIA), null);
  });

  it("usa el inicio como desde y hasta cuando todavía no hay fin", () => {
    assert.deepEqual(rangoDeSeleccion(seleccion("2026-11-05", null)), {
      desde: "2026-11-05",
      hasta: "2026-11-05",
    });
  });

  it("devuelve los dos extremos cuando el rango está completo", () => {
    assert.deepEqual(
      rangoDeSeleccion(seleccion("2026-11-05", "2026-11-08")),
      { desde: "2026-11-05", hasta: "2026-11-08" },
    );
  });

  it("normaliza un rango con los extremos invertidos", () => {
    assert.deepEqual(
      rangoDeSeleccion(seleccion("2026-11-08", "2026-11-05")),
      { desde: "2026-11-05", hasta: "2026-11-08" },
    );
  });
});

describe("marcaDeDia", () => {
  it("no marca nada si no hay selección", () => {
    assert.equal(marcaDeDia(SELECCION_VACIA, "2026-11-05"), undefined);
  });

  it("marca como único el día de una selección de un solo día", () => {
    const unDia = seleccion("2026-11-05", null);

    assert.equal(marcaDeDia(unDia, "2026-11-05"), "unico");
    assert.equal(marcaDeDia(unDia, "2026-11-04"), undefined);
    assert.equal(marcaDeDia(unDia, "2026-11-06"), undefined);
  });

  it("marca inicio, medios y fin de un rango de varios días", () => {
    const rango = seleccion("2026-11-05", "2026-11-08");

    const marcas: ReadonlyArray<[string, MarcaSeleccion | undefined]> = [
      ["2026-11-04", undefined],
      ["2026-11-05", "inicio"],
      ["2026-11-06", "medio"],
      ["2026-11-07", "medio"],
      ["2026-11-08", "fin"],
      ["2026-11-09", undefined],
    ];

    for (const [clave, esperada] of marcas) {
      assert.equal(marcaDeDia(rango, clave), esperada, clave);
    }
  });

  it("marca como único un rango cuyo fin es igual al inicio", () => {
    const rango = seleccion("2026-11-05", "2026-11-05");

    assert.equal(marcaDeDia(rango, "2026-11-05"), "unico");
    assert.equal(marcaDeDia(rango, "2026-11-06"), undefined);
  });

  it("marca correctamente un rango que cruza el cambio de año", () => {
    const rango = seleccion("2026-12-30", "2027-01-02");

    assert.equal(marcaDeDia(rango, "2026-12-29"), undefined);
    assert.equal(marcaDeDia(rango, "2026-12-30"), "inicio");
    assert.equal(marcaDeDia(rango, "2026-12-31"), "medio");
    assert.equal(marcaDeDia(rango, "2027-01-01"), "medio");
    assert.equal(marcaDeDia(rango, "2027-01-02"), "fin");
    assert.equal(marcaDeDia(rango, "2027-01-03"), undefined);
  });
});

describe("resumirSeleccion", () => {
  it("devuelve null si no hay selección", () => {
    assert.equal(resumirSeleccion(SELECCION_VACIA, new Set()), null);
  });

  it("resume un solo día libre", () => {
    assert.deepEqual(
      resumirSeleccion(seleccion("2026-11-05", null), new Set()),
      {
        desde: "2026-11-05",
        hasta: "2026-11-05",
        noches: 1,
        yaBloqueadas: 0,
        libres: 1,
        excedeMaximo: false,
      },
    );
  });

  it("cuenta solo las bloqueadas que caen dentro del rango", () => {
    const bloqueadas = new Set(["2026-11-06", "2026-11-07", "2026-12-01"]);

    assert.deepEqual(
      resumirSeleccion(seleccion("2026-11-05", "2026-11-08"), bloqueadas),
      {
        desde: "2026-11-05",
        hasta: "2026-11-08",
        noches: 4,
        yaBloqueadas: 2,
        libres: 2,
        excedeMaximo: false,
      },
    );
  });

  it("cuenta los días de un rango que cruza el cambio de año", () => {
    const resumen = resumirSeleccion(
      seleccion("2026-12-30", "2027-01-02"),
      new Set(),
    );

    assert.equal(resumen?.noches, 4);
    assert.equal(resumen?.libres, 4);
  });

  it("cuenta bien el 29 de febrero de un año bisiesto", () => {
    const resumen = resumirSeleccion(
      seleccion("2028-02-28", "2028-03-01"),
      new Set(),
    );

    assert.equal(resumen?.noches, 3);
  });

  it("no excede el máximo con exactamente 30 noches", () => {
    const resumen = resumirSeleccion(
      seleccion("2026-11-01", "2026-11-30"),
      new Set(),
    );

    assert.equal(resumen?.noches, 30);
    assert.equal(resumen?.excedeMaximo, false);
  });

  it("excede el máximo con 31 noches", () => {
    const resumen = resumirSeleccion(
      seleccion("2026-11-01", "2026-12-01"),
      new Set(),
    );

    assert.equal(resumen?.noches, 31);
    assert.equal(resumen?.excedeMaximo, true);
  });

  it("coincide con la validación de rangos-admin en el límite", () => {
    const deTreinta = resumirSeleccion(
      seleccion("2026-11-01", "2026-11-30"),
      new Set(),
    );
    const deTreintaYUno = resumirSeleccion(
      seleccion("2026-11-01", "2026-12-01"),
      new Set(),
    );

    if (deTreinta === null || deTreintaYUno === null) {
      assert.fail("los dos rangos del límite deberían producir resumen");
    }

    const validacionTreinta = nochesDeRangoAdmin(
      "2026-11-01",
      "2026-11-30",
    );
    assert.equal(validacionTreinta.ok, true);
    if (validacionTreinta.ok) {
      assert.equal(validacionTreinta.fechas.length, deTreinta.noches);
    }

    const validacionTreintaYUno = nochesDeRangoAdmin(
      "2026-11-01",
      "2026-12-01",
    );
    if (validacionTreintaYUno.ok) {
      assert.fail("el rango de 31 noches no debería ser válido");
    }
    assert.equal(validacionTreintaYUno.motivo, "EXCEDE_MAXIMO");
    if (validacionTreintaYUno.motivo === "EXCEDE_MAXIMO") {
      assert.equal(validacionTreintaYUno.maximo, NOCHES_MAX_POR_ACCION);
    }

    assert.equal(deTreinta.excedeMaximo, false);
    assert.equal(deTreintaYUno.excedeMaximo, true);
  });

  it("normaliza un rango invertido antes de contar", () => {
    const resumen = resumirSeleccion(
      seleccion("2026-11-08", "2026-11-05"),
      new Set(),
    );

    assert.deepEqual(resumen, {
      desde: "2026-11-05",
      hasta: "2026-11-08",
      noches: 4,
      yaBloqueadas: 0,
      libres: 4,
      excedeMaximo: false,
    });
  });

  it("devuelve null si alguna clave del rango es inválida", () => {
    const casos: SeleccionRango[] = [
      seleccion("hola", "2026-11-08"),
      seleccion("2026-11-05", "2026-02-30"),
      seleccion("2026-11-05", "05/11/2026"),
      seleccion("", ""),
    ];

    for (const caso of casos) {
      assert.equal(resumirSeleccion(caso, new Set()), null);
    }
  });

  it("resume un rango enorme que todavía entra en el tope", () => {
    const resumen = resumirSeleccion(
      seleccion("2000-01-01", "2100-12-31"),
      new Set(),
    );

    assert.equal(resumen?.noches, 36890);
    assert.equal(resumen?.yaBloqueadas, 0);
    assert.equal(resumen?.libres, 36890);
    assert.equal(resumen?.excedeMaximo, true);
  });

  it("devuelve null si el rango supera el tope de recorrido", () => {
    assert.equal(
      resumirSeleccion(seleccion("1000-01-01", "9999-12-31"), new Set()),
      null,
    );
  });

  it("no muta la selección ni el conjunto de bloqueadas", () => {
    const entrada = seleccion("2026-11-05", "2026-11-08");
    const copiaEntrada = { ...entrada };
    const bloqueadas = new Set(["2026-11-06", "2026-11-07"]);
    const copiaBloqueadas = new Set(bloqueadas);

    resumirSeleccion(entrada, bloqueadas);

    assert.deepEqual(entrada, copiaEntrada);
    assert.deepEqual([...bloqueadas], [...copiaBloqueadas]);
  });
});
