import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CabanaDisponibilidad } from "../disponibilidad/cabanas";
import { deClaveFecha } from "../disponibilidad/noches";
import { mensajeErrorPreReserva } from "./mensaje";
import {
  validarPreReserva,
  type EntradaValidacionPreReserva,
} from "./validar-disponibilidad";

// Construye el día indicado (clave "AAAA-MM-DD") a medianoche UTC.
function fecha(clave: string): Date {
  const dia = deClaveFecha(clave);
  if (dia === null) {
    throw new Error(`La clave ${clave} debería ser válida`);
  }
  return dia;
}

// Construye una cabaña de prueba a partir de sus noches bloqueadas.
function cabana(
  id: string,
  capacidad: number,
  bloqueadas: readonly string[] = [],
): CabanaDisponibilidad {
  return { id, capacidad, bloqueadas: new Set(bloqueadas) };
}

// Entrada válida por defecto: 3 noches, 2 personas, cabaña de capacidad 6.
function entrada(
  cambios: Partial<EntradaValidacionPreReserva> = {},
): EntradaValidacionPreReserva {
  return {
    propiedadId: "cabana-a",
    ingreso: fecha("2026-11-10"),
    salida: fecha("2026-11-13"),
    personas: 2,
    hoy: fecha("2026-11-01"),
    cabanas: [cabana("cabana-a", 6)],
    ...cambios,
  };
}

const MENSAJE_FECHA_PASADA =
  "La fecha de ingreso no puede ser anterior a hoy.";
const MENSAJE_CABANA_NO_DISPONIBLE = "No encontramos la cabaña.";
const MENSAJE_PERSONAS_INVALIDAS = "La cantidad de huéspedes no es válida.";
const MENSAJE_NOCHES_BLOQUEADAS =
  "Alguna de las noches elegidas ya no está disponible. Volvé a elegir tus fechas.";

describe("validarPreReserva", () => {
  it("acepta una pre-reserva válida", () => {
    assert.deepEqual(validarPreReserva(entrada()), { ok: true });
  });

  it("acepta el ingreso del día de hoy", () => {
    assert.deepEqual(
      validarPreReserva(
        entrada({ ingreso: fecha("2026-11-01"), hoy: fecha("2026-11-01") }),
      ),
      { ok: true },
    );
  });

  it("rechaza el ingreso del día anterior a hoy", () => {
    assert.deepEqual(
      validarPreReserva(
        entrada({ ingreso: fecha("2026-10-31"), hoy: fecha("2026-11-01") }),
      ),
      {
        ok: false,
        motivo: "FECHA_PASADA",
        estado: 400,
        mensaje: MENSAJE_FECHA_PASADA,
      },
    );
  });

  it("prioriza FECHA_PASADA sobre la cabaña inexistente y la noche bloqueada", () => {
    const conNocheBloqueada = entrada({
      ingreso: fecha("2026-10-31"),
      salida: fecha("2026-11-02"),
      hoy: fecha("2026-11-01"),
      cabanas: [cabana("cabana-a", 6, ["2026-10-31"])],
    });
    const conCabanaInexistente = entrada({
      ingreso: fecha("2026-10-31"),
      salida: fecha("2026-11-02"),
      hoy: fecha("2026-11-01"),
      propiedadId: "cabana-inexistente",
    });

    assert.deepEqual(validarPreReserva(conNocheBloqueada), {
      ok: false,
      motivo: "FECHA_PASADA",
      estado: 400,
      mensaje: MENSAJE_FECHA_PASADA,
    });
    assert.deepEqual(validarPreReserva(conCabanaInexistente), {
      ok: false,
      motivo: "FECHA_PASADA",
      estado: 400,
      mensaje: MENSAJE_FECHA_PASADA,
    });
  });

  it("rechaza con CABANA_NO_DISPONIBLE si el arreglo de cabañas viene vacío", () => {
    assert.deepEqual(validarPreReserva(entrada({ cabanas: [] })), {
      ok: false,
      motivo: "CABANA_NO_DISPONIBLE",
      estado: 404,
      mensaje: MENSAJE_CABANA_NO_DISPONIBLE,
    });
  });

  it("rechaza con CABANA_NO_DISPONIBLE si la cabaña pedida no está en el arreglo", () => {
    assert.deepEqual(
      validarPreReserva(
        entrada({ cabanas: [cabana("cabana-b", 6, ["2026-11-11"])] }),
      ),
      {
        ok: false,
        motivo: "CABANA_NO_DISPONIBLE",
        estado: 404,
        mensaje: MENSAJE_CABANA_NO_DISPONIBLE,
      },
    );
  });

  it("rechaza personas 0, -1, 2.5, NaN e Infinity", () => {
    const invalidas = [0, -1, 2.5, Number.NaN, Number.POSITIVE_INFINITY];

    for (const personas of invalidas) {
      assert.deepEqual(
        validarPreReserva(entrada({ personas })),
        {
          ok: false,
          motivo: "PERSONAS_INVALIDAS",
          estado: 400,
          mensaje: MENSAJE_PERSONAS_INVALIDAS,
        },
        `Las personas ${personas} deberían ser inválidas`,
      );
    }
  });

  it("acepta personas igual a la capacidad de la cabaña", () => {
    assert.deepEqual(
      validarPreReserva(
        entrada({ personas: 6, cabanas: [cabana("cabana-a", 6)] }),
      ),
      { ok: true },
    );
  });

  it("rechaza una persona más que la capacidad y menciona la capacidad real", () => {
    assert.deepEqual(
      validarPreReserva(
        entrada({ personas: 7, cabanas: [cabana("cabana-a", 6)] }),
      ),
      {
        ok: false,
        motivo: "EXCEDE_CAPACIDAD",
        estado: 400,
        mensaje: "La cabaña admite hasta 6 huéspedes.",
      },
    );
    assert.deepEqual(
      validarPreReserva(
        entrada({ personas: 2, cabanas: [cabana("cabana-a", 1)] }),
      ),
      {
        ok: false,
        motivo: "EXCEDE_CAPACIDAD",
        estado: 400,
        mensaje: "La cabaña admite hasta 1 huésped.",
      },
    );
  });

  it("rechaza si una noche del medio del rango está bloqueada", () => {
    assert.deepEqual(
      validarPreReserva(
        entrada({ cabanas: [cabana("cabana-a", 6, ["2026-11-11"])] }),
      ),
      {
        ok: false,
        motivo: "NOCHES_BLOQUEADAS",
        estado: 409,
        mensaje: MENSAJE_NOCHES_BLOQUEADAS,
      },
    );
  });

  it("rechaza si la primera noche (ingreso) está bloqueada", () => {
    assert.deepEqual(
      validarPreReserva(
        entrada({ cabanas: [cabana("cabana-a", 6, ["2026-11-10"])] }),
      ),
      {
        ok: false,
        motivo: "NOCHES_BLOQUEADAS",
        estado: 409,
        mensaje: MENSAJE_NOCHES_BLOQUEADAS,
      },
    );
  });

  it("rechaza si la última noche (salida - 1 día) está bloqueada", () => {
    assert.deepEqual(
      validarPreReserva(
        entrada({ cabanas: [cabana("cabana-a", 6, ["2026-11-12"])] }),
      ),
      {
        ok: false,
        motivo: "NOCHES_BLOQUEADAS",
        estado: 409,
        mensaje: MENSAJE_NOCHES_BLOQUEADAS,
      },
    );
  });

  it("acepta si la noche bloqueada es la del día de salida", () => {
    assert.deepEqual(
      validarPreReserva(
        entrada({ cabanas: [cabana("cabana-a", 6, ["2026-11-13"])] }),
      ),
      { ok: true },
    );
  });

  it("acepta si las noches bloqueadas están fuera del rango", () => {
    assert.deepEqual(
      validarPreReserva(
        entrada({
          cabanas: [
            cabana("cabana-a", 6, [
              "2026-11-09",
              "2026-11-13",
              "2026-11-20",
            ]),
          ],
        }),
      ),
      { ok: true },
    );
  });

  it("solo considera las noches de la cabaña pedida", () => {
    const otraBloqueada = [
      cabana("cabana-b", 6, ["2026-11-11"]),
      cabana("cabana-a", 6),
    ];
    const elegidaBloqueada = [
      cabana("cabana-b", 6),
      cabana("cabana-a", 6, ["2026-11-11"]),
    ];

    assert.deepEqual(validarPreReserva(entrada({ cabanas: otraBloqueada })), {
      ok: true,
    });
    assert.deepEqual(
      validarPreReserva(entrada({ cabanas: elegidaBloqueada })),
      {
        ok: false,
        motivo: "NOCHES_BLOQUEADAS",
        estado: 409,
        mensaje: MENSAJE_NOCHES_BLOQUEADAS,
      },
    );
  });

  it("rechaza un rango con salida no posterior al ingreso", () => {
    for (const salida of [fecha("2026-11-10"), fecha("2026-11-09")]) {
      assert.deepEqual(validarPreReserva(entrada({ salida })), {
        ok: false,
        motivo: "RANGO_INVALIDO",
        estado: 400,
        mensaje: mensajeErrorPreReserva("FECHAS_INVALIDAS"),
      });
    }
  });

  it("rechaza una estadía de 31 noches", () => {
    assert.deepEqual(
      validarPreReserva(
        entrada({ ingreso: fecha("2026-11-01"), salida: fecha("2026-12-02") }),
      ),
      {
        ok: false,
        motivo: "EXCEDE_NOCHES_MAX",
        estado: 400,
        mensaje: mensajeErrorPreReserva("ESTADIA_MUY_LARGA"),
      },
    );
  });

  it("acepta una estadía de exactamente 30 noches", () => {
    assert.deepEqual(
      validarPreReserva(
        entrada({ ingreso: fecha("2026-11-01"), salida: fecha("2026-12-01") }),
      ),
      { ok: true },
    );
  });

  it("con noche bloqueada y personas de más gana NOCHES_BLOQUEADAS por el orden real de cabanasLibresParaRango", () => {
    assert.deepEqual(
      validarPreReserva(
        entrada({
          personas: 3,
          cabanas: [cabana("cabana-a", 2, ["2026-11-11"])],
        }),
      ),
      {
        ok: false,
        motivo: "NOCHES_BLOQUEADAS",
        estado: 409,
        mensaje: MENSAJE_NOCHES_BLOQUEADAS,
      },
    );
  });

  it("no muta una entrada congelada ni el conjunto de noches bloqueadas", () => {
    const bloqueadas = new Set(["2026-11-11"]);
    Object.freeze(bloqueadas);
    const unica = Object.freeze({
      id: "cabana-a",
      capacidad: 6,
      bloqueadas,
    });
    const cabanas = Object.freeze([unica]);
    const entradaCongelada: EntradaValidacionPreReserva = Object.freeze({
      propiedadId: "cabana-a",
      ingreso: fecha("2026-11-10"),
      salida: fecha("2026-11-13"),
      personas: 2,
      hoy: fecha("2026-11-01"),
      cabanas,
    });

    assert.deepEqual([...bloqueadas], ["2026-11-11"]);

    assert.deepEqual(validarPreReserva(entradaCongelada), {
      ok: false,
      motivo: "NOCHES_BLOQUEADAS",
      estado: 409,
      mensaje: MENSAJE_NOCHES_BLOQUEADAS,
    });

    assert.equal(bloqueadas.size, 1);
    assert.deepEqual([...bloqueadas], ["2026-11-11"]);
    assert.equal(cabanas.length, 1);
    assert.equal(cabanas[0], unica);
  });

  it("no modifica las fechas recibidas", () => {
    const ingreso = fecha("2026-11-10");
    const salida = fecha("2026-11-13");
    const hoy = fecha("2026-11-01");
    const ingresoAntes = ingreso.getTime();
    const salidaAntes = salida.getTime();
    const hoyAntes = hoy.getTime();

    validarPreReserva({
      propiedadId: "cabana-a",
      ingreso,
      salida,
      personas: 2,
      hoy,
      cabanas: [cabana("cabana-a", 6, ["2026-11-11"])],
    });
    validarPreReserva({
      propiedadId: "cabana-a",
      ingreso,
      salida,
      personas: 2,
      hoy,
      cabanas: [cabana("cabana-a", 6)],
    });

    assert.equal(ingreso.getTime(), ingresoAntes);
    assert.equal(salida.getTime(), salidaAntes);
    assert.equal(hoy.getTime(), hoyAntes);
  });
});
