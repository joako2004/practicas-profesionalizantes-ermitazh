import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  cabanasLibresParaRango,
  type CabanaDisponibilidad,
} from "./cabanas";
import { deClaveFecha } from "./noches";
import {
  claveDeVentana,
  contextoCabanaUnica,
  contextoGeneral,
  leerRespuestaDisponibilidad,
  type DisponibilidadCliente,
} from "./respuesta-api";
import { puedeLlegada, type ContextoEstadia } from "./seleccion-estadia";

// Fixture base: dos cabañas con una única noche bloqueada en común.
const FIXTURE = {
  ventana: { desde: "2026-11-10", hasta: "2026-11-30" },
  cabanas: [
    { id: "a", capacidad: 4, bloqueadas: ["2026-11-11", "2026-11-12"] },
    { id: "b", capacidad: 2, bloqueadas: ["2026-11-12", "2026-11-13"] },
  ],
};

// Cabaña cruda válida; los cambios reemplazan los campos indicados.
function cabana(
  cambios: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: "a",
    capacidad: 4,
    bloqueadas: ["2026-11-11"],
    ...cambios,
  };
}

// Respuesta cruda con la ventana indicada y las cabañas recibidas.
function respuesta(
  cabanas: unknown,
  ventana: unknown = { desde: "2026-11-10", hasta: "2026-11-30" },
): unknown {
  return { ventana, cabanas };
}

// Copia de un objeto crudo sin el campo indicado.
function sinCampo(
  objeto: Record<string, unknown>,
  campo: string,
): Record<string, unknown> {
  const copia = { ...objeto };
  delete copia[campo];
  return copia;
}

// Lee una respuesta que debe ser válida o falla la prueba.
function leer(json: unknown): DisponibilidadCliente {
  const datos = leerRespuestaDisponibilidad(json);
  if (datos === null) {
    assert.fail("La respuesta debía ser válida");
  }
  return datos;
}

// Contexto de una cabaña que debe existir o falla la prueba.
function contextoDe(
  datos: DisponibilidadCliente,
  id: string,
): ContextoEstadia {
  const ctx = contextoCabanaUnica(datos, id);
  if (ctx === null) {
    assert.fail(`La cabaña ${id} debía existir`);
  }
  return ctx;
}

// Contexto general que debe existir o falla la prueba.
function contextoGeneralDe(datos: DisponibilidadCliente): ContextoEstadia {
  const ctx = contextoGeneral(datos);
  if (ctx === null) {
    assert.fail("La respuesta debía tener cabañas");
  }
  return ctx;
}

describe("claveDeVentana", () => {
  it("acepta claves y ISO a medianoche UTC", () => {
    const casos: ReadonlyArray<[string, string]> = [
      ["2026-11-10", "2026-11-10"],
      ["2026-11-10T00:00:00.000Z", "2026-11-10"],
      ["2026-11-10T00:00:00Z", "2026-11-10"],
      ["2026-11-10T00:00:00.000000Z", "2026-11-10"],
      ["2024-02-29", "2024-02-29"],
    ];

    for (const [entrada, esperado] of casos) {
      assert.equal(claveDeVentana(entrada), esperado, entrada);
    }
  });

  it("rechaza horas o zonas distintas de la medianoche UTC", () => {
    const casos = [
      "2026-11-10T10:00:00.000Z",
      "2026-11-10T00:00:00.000-03:00",
      "2026-11-10T00:00:00+00:00",
      "2026-11-10T00:00:00.000",
      "2026-11-10T00:00:00.Z",
      "2026-11-10t00:00:00z",
    ];

    for (const entrada of casos) {
      assert.equal(claveDeVentana(entrada), null, entrada);
    }
  });

  it("rechaza fechas inexistentes y formatos laxos", () => {
    const casos = [
      "2026-02-30",
      "2026-13-01",
      "2026-02-30T00:00:00.000Z",
      " 2026-11-10",
      "2026-11-10 ",
      "2026-11-10\n",
      "",
      "10/11/2026",
    ];

    for (const entrada of casos) {
      assert.equal(claveDeVentana(entrada), null, JSON.stringify(entrada));
    }
  });

  it("rechaza valores que no son strings", () => {
    const casos: readonly unknown[] = [
      20261110,
      null,
      undefined,
      true,
      new Date(Date.UTC(2026, 10, 10)),
      ["2026-11-10"],
      { fecha: "2026-11-10" },
    ];

    for (const entrada of casos) {
      assert.equal(claveDeVentana(entrada), null);
    }
  });
});

describe("leerRespuestaDisponibilidad", () => {
  it("acepta el fixture y devuelve las bloqueadas como Set", () => {
    const datos = leer(FIXTURE);

    assert.equal(datos.desde, "2026-11-10");
    assert.equal(datos.hasta, "2026-11-30");
    assert.equal(datos.cabanas.length, 2);

    assert.equal(datos.cabanas[0].id, "a");
    assert.equal(datos.cabanas[0].capacidad, 4);
    assert.deepEqual(
      datos.cabanas[0].bloqueadas,
      new Set(["2026-11-11", "2026-11-12"]),
    );

    assert.equal(datos.cabanas[1].id, "b");
    assert.equal(datos.cabanas[1].capacidad, 2);
    assert.deepEqual(
      datos.cabanas[1].bloqueadas,
      new Set(["2026-11-12", "2026-11-13"]),
    );
  });

  it("acepta la ventana en ISO y la normaliza igual", () => {
    const datos = leer({
      ventana: {
        desde: "2026-11-10T00:00:00.000Z",
        hasta: "2026-11-30T00:00:00.000Z",
      },
      cabanas: FIXTURE.cabanas,
    });

    assert.equal(datos.desde, "2026-11-10");
    assert.equal(datos.hasta, "2026-11-30");
    assert.equal(datos.cabanas.length, 2);
  });

  it("colapsa las bloqueadas repetidas en un Set", () => {
    const datos = leer(
      respuesta([cabana({ bloqueadas: ["2026-11-11", "2026-11-11"] })]),
    );

    assert.equal(datos.cabanas[0].bloqueadas.size, 1);
    assert.equal(datos.cabanas[0].bloqueadas.has("2026-11-11"), true);
  });

  it("acepta una lista de cabañas vacía", () => {
    const datos = leer(respuesta([]));

    assert.deepEqual(datos.cabanas, []);
    assert.equal(datos.desde, "2026-11-10");
    assert.equal(datos.hasta, "2026-11-30");
  });

  it("acepta ids con guiones y guiones bajos", () => {
    const datos = leer(respuesta([cabana({ id: "cabana-1_A" })]));

    assert.equal(datos.cabanas[0].id, "cabana-1_A");
  });

  const RESPUESTAS_INVALIDAS: ReadonlyArray<[string, unknown]> = [
    ["json null", null],
    ["un string", "2026-11-10"],
    ["un número", 42],
    ["un array", [FIXTURE]],
    ["un objeto vacío", {}],
    ["sin ventana", { cabanas: [] }],
    ["ventana no objeto", { ventana: "2026-11-10", cabanas: [] }],
    ["ventana null", { ventana: null, cabanas: [] }],
    ["ventana sin hasta", respuesta([], { desde: "2026-11-10" })],
    ["desde inválido", respuesta([], { desde: "2026-02-30", hasta: "2026-11-30" })],
    ["desde > hasta", respuesta([], { desde: "2026-12-01", hasta: "2026-11-30" })],
    ["hasta en ISO con hora", respuesta([], {
      desde: "2026-11-10",
      hasta: "2026-11-30T10:00:00.000Z",
    })],
    ["cabanas no array", respuesta("nada")],
    ["cabanas null", respuesta(null)],
    ["una cabaña null", respuesta([null])],
    ["una cabaña no objeto", respuesta(["a"])],
    ["cabaña sin id", respuesta([sinCampo(cabana(), "id")])],
    ["id vacío", respuesta([cabana({ id: "" })])],
    ["id con espacio", respuesta([cabana({ id: "a b" })])],
    ["id de 65 caracteres", respuesta([cabana({ id: "a".repeat(65) })])],
    ["id numérico", respuesta([cabana({ id: 7 })])],
    ["capacidad 0", respuesta([cabana({ capacidad: 0 })])],
    ["capacidad 101", respuesta([cabana({ capacidad: 101 })])],
    ["capacidad 2.5", respuesta([cabana({ capacidad: 2.5 })])],
    ["capacidad string", respuesta([cabana({ capacidad: "4" })])],
    ["capacidad ausente", respuesta([sinCampo(cabana(), "capacidad")])],
    ["bloqueadas ausente", respuesta([sinCampo(cabana(), "bloqueadas")])],
    ["bloqueadas no array", respuesta([cabana({ bloqueadas: "2026-11-11" })])],
    ["bloqueadas null", respuesta([cabana({ bloqueadas: null })])],
    [
      "una bloqueada inválida",
      respuesta([cabana({ bloqueadas: ["2026-02-30"] })]),
    ],
    [
      "una bloqueada numérica",
      respuesta([cabana({ bloqueadas: [20261111] })]),
    ],
    [
      "una bloqueada en ISO",
      respuesta([cabana({ bloqueadas: ["2026-11-11T00:00:00.000Z"] })]),
    ],
    ["ids repetidos", respuesta([cabana(), cabana({ id: "a" })])],
  ];

  it("devuelve null ante cualquier dato dudoso", () => {
    for (const [caso, entrada] of RESPUESTAS_INVALIDAS) {
      assert.equal(leerRespuestaDisponibilidad(entrada), null, caso);
    }
  });
});

describe("contextoCabanaUnica", () => {
  it("devuelve una copia de las bloqueadas propias de la cabaña", () => {
    const datos = leer(FIXTURE);

    const ctxA = contextoDe(datos, "a");
    assert.equal(ctxA.desde, "2026-11-10");
    assert.equal(ctxA.hasta, "2026-11-30");
    assert.deepEqual(ctxA.bloqueadas, new Set(["2026-11-11", "2026-11-12"]));

    const ctxB = contextoDe(datos, "b");
    assert.deepEqual(ctxB.bloqueadas, new Set(["2026-11-12", "2026-11-13"]));

    // El contexto no comparte el Set con los datos leídos.
    assert.notEqual(ctxB.bloqueadas, datos.cabanas[1].bloqueadas);
  });

  it("devuelve null si la cabaña no está en la respuesta", () => {
    assert.equal(contextoCabanaUnica(leer(FIXTURE), "zzz"), null);
    assert.equal(contextoCabanaUnica(leer(respuesta([])), "a"), null);
  });
});

describe("contextoGeneral", () => {
  it("bloquea solo las noches ocupadas en todas las cabañas", () => {
    const ctx = contextoGeneralDe(leer(FIXTURE));

    assert.deepEqual(ctx.bloqueadas, new Set(["2026-11-12"]));
    assert.equal(ctx.desde, "2026-11-10");
    assert.equal(ctx.hasta, "2026-11-30");
  });

  it("con una sola cabaña conserva todas sus bloqueadas", () => {
    const datos = leer(respuesta([cabana({ bloqueadas: ["2026-11-11"] })]));
    const ctx = contextoGeneralDe(datos);

    assert.deepEqual(ctx.bloqueadas, new Set(["2026-11-11"]));
  });

  it("devuelve null sin cabañas", () => {
    assert.equal(contextoGeneral(leer(respuesta([]))), null);
  });
});

describe("integración con las reglas de D6a", () => {
  it("el modo general habilita la llegada según la intersección", () => {
    const ctx = contextoGeneralDe(leer(FIXTURE));

    assert.equal(puedeLlegada("2026-11-12", ctx), false);
    assert.equal(puedeLlegada("2026-11-11", ctx), true);
  });

  it("el modo de una cabaña usa sus propias bloqueadas", () => {
    const ctx = contextoDe(leer(FIXTURE), "a");

    assert.equal(puedeLlegada("2026-11-11", ctx), false);
    assert.equal(puedeLlegada("2026-11-13", ctx), true);
  });
});

describe("caso clave del modo general", () => {
  it("el calendario general no garantiza una cabaña libre toda la estadía", () => {
    const datos = leer(
      respuesta([
        cabana({ id: "a", bloqueadas: ["2026-11-11"] }),
        cabana({ id: "b", bloqueadas: ["2026-11-12"] }),
      ]),
    );

    const general = contextoGeneralDe(datos);
    assert.equal(general.bloqueadas.size, 0);
    assert.equal(puedeLlegada("2026-11-10", general), true);

    const ingreso = deClaveFecha("2026-11-10");
    const salida = deClaveFecha("2026-11-13");
    if (ingreso === null || salida === null) {
      assert.fail("Las claves del caso debían ser válidas");
    }

    const resultado = cabanasLibresParaRango(ingreso, salida, 1, datos.cabanas);

    assert.equal(resultado.ok, false);
    if (resultado.ok) {
      assert.fail("No debía haber cabañas libres para todo el rango");
    }
    assert.equal(resultado.motivo, "NINGUNA_LIBRE");
  });
});

describe("compatibilidad de tipos", () => {
  it("las cabañas del cliente son asignables a CabanaDisponibilidad", () => {
    const datos = leer(FIXTURE);
    const cabanas: CabanaDisponibilidad[] = datos.cabanas;

    assert.equal(cabanas.length, 2);
    assert.equal(cabanas[0].id, "a");
    assert.deepEqual(
      cabanas[1].bloqueadas,
      new Set(["2026-11-12", "2026-11-13"]),
    );
  });
});

describe("inmutabilidad", () => {
  it("no modifica el JSON de entrada", () => {
    const entrada: unknown = structuredClone(FIXTURE);
    const copia = structuredClone(entrada);

    const datos = leer(entrada);
    assert.notEqual(contextoCabanaUnica(datos, "a"), null);
    assert.equal(contextoCabanaUnica(datos, "zzz"), null);
    assert.notEqual(contextoGeneral(datos), null);

    const ingreso = deClaveFecha("2026-11-10");
    const salida = deClaveFecha("2026-11-13");
    if (ingreso === null || salida === null) {
      assert.fail("Las claves del caso debían ser válidas");
    }
    cabanasLibresParaRango(ingreso, salida, 1, datos.cabanas);

    assert.deepEqual(entrada, copia);
  });
});
