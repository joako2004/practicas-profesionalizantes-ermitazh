import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  AYUDA_SALIDA_OCUPADA,
  ESTADIA_VACIA,
  elegirDiaEstadia,
  infoDiaEstadia,
  limiteSalida,
  normalizarSeleccion,
  puedeLlegada,
  puedeSalida,
  resumirEstadia,
  salidaOcupadaDisponible,
  type ContextoEstadia,
  type SeleccionEstadia,
} from "./seleccion-estadia";

// Arma un contexto con las noches bloqueadas indicadas.
function contexto(
  desde: string,
  hasta: string,
  bloqueadas: ReadonlyArray<string>,
): ContextoEstadia {
  return { bloqueadas: new Set(bloqueadas), desde, hasta };
}

// Arma una selección con los dos extremos indicados.
function seleccion(
  ingreso: string | null,
  salida: string | null,
): SeleccionEstadia {
  return { ingreso, salida };
}

// Fixture A: ventana de noviembre con dos noches bloqueadas.
const CTX_A = contexto("2026-11-10", "2026-11-30", [
  "2026-11-15",
  "2026-11-20",
]);

// Fixture B: ventana larga sin bloqueos.
const CTX_B = contexto("2026-11-01", "2027-12-31", []);

// Claves que no representan un día real.
const CLAVES_INVALIDAS = ["basura", "", "2026-02-30", "10/11/2026"];

describe("constantes", () => {
  it("ESTADIA_VACIA no tiene días y está congelada", () => {
    assert.equal(ESTADIA_VACIA.ingreso, null);
    assert.equal(ESTADIA_VACIA.salida, null);
    assert.equal(Object.isFrozen(ESTADIA_VACIA), true);
  });

  it("AYUDA_SALIDA_OCUPADA tiene el texto exacto", () => {
    assert.equal(
      AYUDA_SALIDA_OCUPADA,
      "Podés elegir como salida el día en que empieza una noche ocupada.",
    );
  });
});

describe("puedeLlegada", () => {
  it("acepta solo claves dentro de la ventana y con la noche libre", () => {
    const casos: ReadonlyArray<[string, boolean]> = [
      ["2026-11-09", false],
      ["2026-11-10", true],
      ["2026-11-15", false],
      ["2026-11-16", true],
      ["2026-11-30", true],
      ["2026-12-01", false],
    ];

    for (const [clave, esperado] of casos) {
      assert.equal(puedeLlegada(clave, CTX_A), esperado, clave);
    }
  });

  it("rechaza claves inválidas", () => {
    for (const clave of CLAVES_INVALIDAS) {
      assert.equal(puedeLlegada(clave, CTX_A), false, clave);
    }
  });

  it("rechaza todo si la ventana tiene una clave inválida", () => {
    const contextos: ReadonlyArray<ContextoEstadia> = [
      contexto("basura", "2026-11-30", []),
      contexto("2026-11-10", "2026-13-01", []),
    ];

    for (const ctx of contextos) {
      for (const clave of ["2026-11-10", "2026-11-12", "2026-11-30"]) {
        assert.equal(puedeLlegada(clave, ctx), false, clave);
      }
    }
  });
});

describe("limiteSalida", () => {
  it("se recorta a la primera noche bloqueada o a hasta + 1", () => {
    const casos: ReadonlyArray<[string, string]> = [
      ["2026-11-10", "2026-11-15"],
      ["2026-11-16", "2026-11-20"],
      ["2026-11-21", "2026-12-01"],
      ["2026-11-25", "2026-12-01"],
    ];

    for (const [ingreso, esperado] of casos) {
      assert.equal(limiteSalida(ingreso, CTX_A), esperado, ingreso);
    }
  });

  it("devuelve null si el ingreso no es válido", () => {
    assert.equal(limiteSalida("2026-11-15", CTX_A), null);
    assert.equal(limiteSalida("2026-11-09", CTX_A), null);
  });

  it("usa ingreso + NOCHES_MAX cuando no hay bloqueos ni recorte", () => {
    assert.equal(limiteSalida("2026-11-10", CTX_B), "2026-12-10");
  });
});

describe("puedeSalida", () => {
  it("valida la salida contra bloqueos, máximo y ventana (fixture A)", () => {
    const casos: ReadonlyArray<[string, string, boolean]> = [
      ["2026-11-10", "2026-11-15", true],
      ["2026-11-10", "2026-11-14", true],
      ["2026-11-10", "2026-11-16", false],
      ["2026-11-10", "2026-11-10", false],
      ["2026-11-10", "2026-11-09", false],
      ["2026-11-21", "2026-12-01", true],
      ["2026-11-21", "2026-12-02", false],
    ];

    for (const [ingreso, clave, esperado] of casos) {
      assert.equal(
        puedeSalida(ingreso, clave, CTX_A),
        esperado,
        `${ingreso} -> ${clave}`,
      );
    }
  });

  it("respeta el máximo de 30 noches (fixture B)", () => {
    assert.equal(puedeSalida("2026-11-10", "2026-12-10", CTX_B), true);
    assert.equal(puedeSalida("2026-11-10", "2026-12-11", CTX_B), false);
  });

  it("rechaza claves de salida inválidas", () => {
    for (const clave of CLAVES_INVALIDAS) {
      assert.equal(puedeSalida("2026-11-10", clave, CTX_A), false, clave);
    }
  });
});

describe("elegirDiaEstadia", () => {
  it("fija el ingreso desde la selección vacía", () => {
    assert.deepEqual(
      elegirDiaEstadia(ESTADIA_VACIA, "2026-11-12", CTX_A),
      seleccion("2026-11-12", null),
    );
  });

  it("ignora como ingreso un día bloqueado o fuera de la ventana", () => {
    assert.deepEqual(
      elegirDiaEstadia(ESTADIA_VACIA, "2026-11-15", CTX_A),
      ESTADIA_VACIA,
    );
    assert.deepEqual(
      elegirDiaEstadia(ESTADIA_VACIA, "2026-12-05", CTX_A),
      ESTADIA_VACIA,
    );
  });

  it("cierra la estadía con una salida válida", () => {
    assert.deepEqual(
      elegirDiaEstadia(seleccion("2026-11-10", null), "2026-11-13", CTX_A),
      seleccion("2026-11-10", "2026-11-13"),
    );
    assert.deepEqual(
      elegirDiaEstadia(seleccion("2026-11-10", null), "2026-11-15", CTX_A),
      seleccion("2026-11-10", "2026-11-15"),
    );
  });

  it("toma un clic anterior o igual como nuevo ingreso", () => {
    assert.deepEqual(
      elegirDiaEstadia(seleccion("2026-11-12", null), "2026-11-11", CTX_A),
      seleccion("2026-11-11", null),
    );
    assert.deepEqual(
      elegirDiaEstadia(seleccion("2026-11-12", null), "2026-11-12", CTX_A),
      seleccion("2026-11-12", null),
    );
  });

  it("toma como nuevo ingreso un día posterior que cruza un bloqueo", () => {
    assert.deepEqual(
      elegirDiaEstadia(seleccion("2026-11-10", null), "2026-11-16", CTX_A),
      seleccion("2026-11-16", null),
    );
  });

  it("deja la selección intacta si el clic no sirve ni de salida ni de llegada", () => {
    const actual = seleccion("2026-11-10", null);

    assert.deepEqual(elegirDiaEstadia(actual, "2026-11-20", CTX_A), actual);
  });

  it("reinicia la selección desde una estadía completa", () => {
    const completa = seleccion("2026-11-10", "2026-11-13");

    assert.deepEqual(
      elegirDiaEstadia(completa, "2026-11-17", CTX_A),
      seleccion("2026-11-17", null),
    );
    assert.deepEqual(elegirDiaEstadia(completa, "2026-11-15", CTX_A), completa);
  });
});

describe("infoDiaEstadia", () => {
  it("sin selección deshabilita los días que no pueden ser ingreso", () => {
    assert.deepEqual(infoDiaEstadia(ESTADIA_VACIA, "2026-11-09", CTX_A), {
      ocupado: false,
      deshabilitado: true,
    });
    assert.deepEqual(infoDiaEstadia(ESTADIA_VACIA, "2026-11-12", CTX_A), {
      ocupado: false,
      deshabilitado: false,
    });
    assert.deepEqual(infoDiaEstadia(ESTADIA_VACIA, "2026-11-15", CTX_A), {
      ocupado: true,
      deshabilitado: true,
    });
  });

  it("con ingreso pendiente habilita la salida aunque el día esté ocupado", () => {
    const conIngreso = seleccion("2026-11-10", null);

    const info15 = infoDiaEstadia(conIngreso, "2026-11-15", CTX_A);
    assert.equal(info15.ocupado, true);
    assert.equal(info15.deshabilitado, false);

    const info16 = infoDiaEstadia(conIngreso, "2026-11-16", CTX_A);
    assert.equal(info16.ocupado, false);
    assert.equal(info16.deshabilitado, false);

    const info20 = infoDiaEstadia(conIngreso, "2026-11-20", CTX_A);
    assert.equal(info20.ocupado, true);
    assert.equal(info20.deshabilitado, true);

    assert.equal(
      infoDiaEstadia(conIngreso, "2026-11-10", CTX_A).seleccion,
      "unico",
    );
  });

  it("marca inicio, medios y fin de una estadía completa", () => {
    const completa = seleccion("2026-11-10", "2026-11-13");

    assert.equal(
      infoDiaEstadia(completa, "2026-11-10", CTX_A).seleccion,
      "inicio",
    );
    assert.equal(
      infoDiaEstadia(completa, "2026-11-11", CTX_A).seleccion,
      "medio",
    );
    assert.equal(
      infoDiaEstadia(completa, "2026-11-12", CTX_A).seleccion,
      "medio",
    );
    assert.equal(
      infoDiaEstadia(completa, "2026-11-13", CTX_A).seleccion,
      "fin",
    );

    const fuera = infoDiaEstadia(completa, "2026-11-14", CTX_A);
    assert.equal(Object.hasOwn(fuera, "seleccion"), false);
    assert.equal(fuera.deshabilitado, false);
  });
});

describe("salidaOcupadaDisponible", () => {
  it("detecta cuando el límite de salida cae en una noche bloqueada", () => {
    assert.equal(salidaOcupadaDisponible("2026-11-10", CTX_A), true);
    assert.equal(salidaOcupadaDisponible("2026-11-16", CTX_A), true);
    assert.equal(salidaOcupadaDisponible("2026-11-21", CTX_A), false);
    assert.equal(salidaOcupadaDisponible(null, CTX_A), false);
    assert.equal(salidaOcupadaDisponible("2026-11-15", CTX_A), false);
  });
});

describe("normalizarSeleccion", () => {
  it("devuelve la estadía vacía si no hay ingreso", () => {
    assert.equal(normalizarSeleccion(ESTADIA_VACIA, CTX_A), ESTADIA_VACIA);
    assert.deepEqual(
      normalizarSeleccion(seleccion(null, "2026-11-13"), CTX_A),
      ESTADIA_VACIA,
    );
  });

  it("conserva la misma referencia si la selección sigue válida", () => {
    const valida = seleccion("2026-11-10", "2026-11-13");

    assert.equal(normalizarSeleccion(valida, CTX_A), valida);
  });

  it("descarta una salida que quedó inválida por un bloqueo nuevo", () => {
    assert.deepEqual(
      normalizarSeleccion(seleccion("2026-11-14", "2026-11-16"), CTX_A),
      seleccion("2026-11-14", null),
    );
  });

  it("devuelve la estadía vacía si el ingreso quedó bloqueado", () => {
    assert.deepEqual(
      normalizarSeleccion(seleccion("2026-11-15", "2026-11-17"), CTX_A),
      ESTADIA_VACIA,
    );
  });
});

describe("resumirEstadia", () => {
  it("resume una estadía de tres noches con textos visibles", () => {
    assert.deepEqual(resumirEstadia(seleccion("2026-11-10", "2026-11-13")), {
      ingreso: "2026-11-10",
      salida: "2026-11-13",
      noches: 3,
      textoIngreso: "10/11/2026",
      textoSalida: "13/11/2026",
    });
  });

  it("devuelve null si falta un extremo, hay una clave inválida o el orden no sirve", () => {
    const casos: SeleccionEstadia[] = [
      seleccion("2026-11-10", null),
      seleccion(null, "2026-11-13"),
      seleccion("basura", "2026-11-13"),
      seleccion("2026-11-10", "2026-02-30"),
      seleccion("2026-11-13", "2026-11-13"),
      seleccion("2026-11-14", "2026-11-13"),
    ];

    for (const caso of casos) {
      assert.equal(resumirEstadia(caso), null);
    }
  });

  it("cuenta bien los cruces de mes y de año", () => {
    assert.equal(
      resumirEstadia(seleccion("2026-11-28", "2026-12-02"))?.noches,
      4,
    );
    assert.equal(
      resumirEstadia(seleccion("2026-12-30", "2027-01-02"))?.noches,
      3,
    );
  });
});

describe("inmutabilidad", () => {
  it("no muta la selección ni el conjunto de bloqueadas", () => {
    const bloqueadas = new Set(["2026-11-15", "2026-11-20"]);
    const copiaBloqueadas = [...bloqueadas];
    const ctx: ContextoEstadia = {
      bloqueadas,
      desde: "2026-11-10",
      hasta: "2026-11-30",
    };
    const pendiente = Object.freeze({ ingreso: "2026-11-10", salida: null });
    const completa = Object.freeze({
      ingreso: "2026-11-10",
      salida: "2026-11-13",
    });

    puedeLlegada("2026-11-12", ctx);
    limiteSalida("2026-11-10", ctx);
    puedeSalida("2026-11-10", "2026-11-13", ctx);
    elegirDiaEstadia(pendiente, "2026-11-13", ctx);
    elegirDiaEstadia(pendiente, "2026-11-16", ctx);
    infoDiaEstadia(pendiente, "2026-11-15", ctx);
    infoDiaEstadia(completa, "2026-11-11", ctx);
    salidaOcupadaDisponible("2026-11-10", ctx);
    normalizarSeleccion(completa, ctx);
    normalizarSeleccion(pendiente, ctx);
    resumirEstadia(completa);

    assert.equal(bloqueadas.size, 2);
    assert.deepEqual([...bloqueadas], copiaBloqueadas);
    assert.deepEqual(pendiente, { ingreso: "2026-11-10", salida: null });
    assert.deepEqual(completa, { ingreso: "2026-11-10", salida: "2026-11-13" });
  });
});
