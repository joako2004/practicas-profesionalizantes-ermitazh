import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { evaluarEliminacion } from "./eliminacion";

const CONSEJO =
  "Para no perder el historial, desactivala en lugar de eliminarla.";
const MOTIVO_DATOS_INVALIDOS =
  "No se pudieron verificar las reservas y las reseñas de la cabaña. Desactivala en lugar de eliminarla.";

describe("evaluarEliminacion", () => {
  it("permite eliminar cuando no hay reservas ni reseñas", () => {
    const resultado = evaluarEliminacion({ reservas: 0, resenas: 0 });

    assert.deepStrictEqual(resultado, { permitida: true });
  });

  it("rechaza con 1 reserva asociada", () => {
    const resultado = evaluarEliminacion({ reservas: 1, resenas: 0 });

    assert.deepStrictEqual(resultado, {
      permitida: false,
      motivo: `Esta cabaña tiene 1 reserva asociada. ${CONSEJO}`,
    });
  });

  it("rechaza con varias reservas asociadas", () => {
    const resultado = evaluarEliminacion({ reservas: 3, resenas: 0 });

    assert.deepStrictEqual(resultado, {
      permitida: false,
      motivo: `Esta cabaña tiene 3 reservas asociadas. ${CONSEJO}`,
    });
  });

  it("rechaza con 1 reseña asociada", () => {
    const resultado = evaluarEliminacion({ reservas: 0, resenas: 1 });

    assert.deepStrictEqual(resultado, {
      permitida: false,
      motivo: `Esta cabaña tiene 1 reseña asociada. ${CONSEJO}`,
    });
  });

  it("rechaza con varias reseñas asociadas", () => {
    const resultado = evaluarEliminacion({ reservas: 0, resenas: 5 });

    assert.deepStrictEqual(resultado, {
      permitida: false,
      motivo: `Esta cabaña tiene 5 reseñas asociadas. ${CONSEJO}`,
    });
  });

  it("rechaza con reservas y reseñas en plural", () => {
    const resultado = evaluarEliminacion({ reservas: 3, resenas: 2 });

    assert.deepStrictEqual(resultado, {
      permitida: false,
      motivo: `Esta cabaña tiene 3 reservas y 2 reseñas asociadas. ${CONSEJO}`,
    });
  });

  it("rechaza con una reserva y una reseña", () => {
    const resultado = evaluarEliminacion({ reservas: 1, resenas: 1 });

    assert.deepStrictEqual(resultado, {
      permitida: false,
      motivo: `Esta cabaña tiene 1 reserva y 1 reseña asociadas. ${CONSEJO}`,
    });
  });

  it("rechaza con una reserva y varias reseñas", () => {
    const resultado = evaluarEliminacion({ reservas: 1, resenas: 4 });

    assert.deepStrictEqual(resultado, {
      permitida: false,
      motivo: `Esta cabaña tiene 1 reserva y 4 reseñas asociadas. ${CONSEJO}`,
    });
  });

  it("rechaza conteos negativos", () => {
    assert.deepStrictEqual(evaluarEliminacion({ reservas: -1, resenas: 0 }), {
      permitida: false,
      motivo: MOTIVO_DATOS_INVALIDOS,
    });

    assert.deepStrictEqual(evaluarEliminacion({ reservas: 0, resenas: -2 }), {
      permitida: false,
      motivo: MOTIVO_DATOS_INVALIDOS,
    });
  });

  it("rechaza NaN", () => {
    assert.deepStrictEqual(
      evaluarEliminacion({ reservas: Number.NaN, resenas: 0 }),
      {
        permitida: false,
        motivo: MOTIVO_DATOS_INVALIDOS,
      }
    );

    assert.deepStrictEqual(
      evaluarEliminacion({ reservas: 0, resenas: Number.NaN }),
      {
        permitida: false,
        motivo: MOTIVO_DATOS_INVALIDOS,
      }
    );
  });

  it("rechaza números no enteros", () => {
    assert.deepStrictEqual(evaluarEliminacion({ reservas: 1.5, resenas: 0 }), {
      permitida: false,
      motivo: MOTIVO_DATOS_INVALIDOS,
    });

    assert.deepStrictEqual(evaluarEliminacion({ reservas: 0, resenas: 0.1 }), {
      permitida: false,
      motivo: MOTIVO_DATOS_INVALIDOS,
    });
  });

  it("rechaza infinito", () => {
    assert.deepStrictEqual(
      evaluarEliminacion({ reservas: Number.POSITIVE_INFINITY, resenas: 0 }),
      {
        permitida: false,
        motivo: MOTIVO_DATOS_INVALIDOS,
      }
    );
  });

  it("rechaza una entrada nula sin lanzar excepción", () => {
    const resultado = evaluarEliminacion(null as never);

    assert.deepStrictEqual(resultado, {
      permitida: false,
      motivo: MOTIVO_DATOS_INVALIDOS,
    });
  });
});
