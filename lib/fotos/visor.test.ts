import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  UMBRAL_DESLIZAMIENTO,
  decidirDeslizamiento,
  indiceAnterior,
  indiceSiguiente,
  indiceValido,
  textoPosicion,
} from "./visor";

describe("UMBRAL_DESLIZAMIENTO", () => {
  it("vale 50 por defecto", () => {
    assert.equal(UMBRAL_DESLIZAMIENTO, 50);
  });
});

describe("indiceValido", () => {
  it("acepta el primero, uno del medio y el último", () => {
    assert.equal(indiceValido(0, 14), true);
    assert.equal(indiceValido(6, 14), true);
    assert.equal(indiceValido(13, 14), true);
  });

  it("rechaza un total de cero", () => {
    assert.equal(indiceValido(0, 0), false);
  });

  it("rechaza índices negativos", () => {
    assert.equal(indiceValido(-1, 14), false);
  });

  it("rechaza índices no enteros", () => {
    assert.equal(indiceValido(1.5, 14), false);
    assert.equal(indiceValido(Number.NaN, 14), false);
    assert.equal(indiceValido(Number.POSITIVE_INFINITY, 14), false);
  });

  it("rechaza índices mayores o iguales al total", () => {
    assert.equal(indiceValido(14, 14), false);
    assert.equal(indiceValido(20, 14), false);
  });

  it("rechaza totales inválidos", () => {
    assert.equal(indiceValido(0, -1), false);
    assert.equal(indiceValido(0, 2.5), false);
  });
});

describe("indiceSiguiente", () => {
  it("devuelve el siguiente en el medio de la lista", () => {
    assert.equal(indiceSiguiente(6, 14), 7);
  });

  it("devuelve el siguiente desde la primera foto", () => {
    assert.equal(indiceSiguiente(0, 3), 1);
  });

  it("devuelve null en la última foto", () => {
    assert.equal(indiceSiguiente(13, 14), null);
  });

  it("devuelve null si hay una sola foto", () => {
    assert.equal(indiceSiguiente(0, 1), null);
  });

  it("devuelve null con un total de cero", () => {
    assert.equal(indiceSiguiente(0, 0), null);
  });

  it("devuelve null con un índice negativo", () => {
    assert.equal(indiceSiguiente(-1, 14), null);
  });

  it("devuelve null con un índice no entero", () => {
    assert.equal(indiceSiguiente(1.5, 14), null);
  });

  it("devuelve null con un índice mayor o igual al total", () => {
    assert.equal(indiceSiguiente(14, 14), null);
    assert.equal(indiceSiguiente(20, 14), null);
  });
});

describe("indiceAnterior", () => {
  it("devuelve el anterior en el medio de la lista", () => {
    assert.equal(indiceAnterior(6, 14), 5);
  });

  it("devuelve el anterior desde la última foto", () => {
    assert.equal(indiceAnterior(13, 14), 12);
  });

  it("devuelve null en la primera foto", () => {
    assert.equal(indiceAnterior(0, 14), null);
  });

  it("devuelve null si hay una sola foto", () => {
    assert.equal(indiceAnterior(0, 1), null);
  });

  it("devuelve null con un total de cero", () => {
    assert.equal(indiceAnterior(0, 0), null);
  });

  it("devuelve null con un índice negativo", () => {
    assert.equal(indiceAnterior(-1, 14), null);
  });

  it("devuelve null con un índice no entero", () => {
    assert.equal(indiceAnterior(1.5, 14), null);
  });

  it("devuelve null con un índice mayor o igual al total", () => {
    assert.equal(indiceAnterior(14, 14), null);
    assert.equal(indiceAnterior(20, 14), null);
  });
});

describe("textoPosicion", () => {
  it("muestra la primera posición sobre el total", () => {
    assert.equal(textoPosicion(0, 14), "1 / 14");
  });

  it("muestra una posición del medio sobre el total", () => {
    assert.equal(textoPosicion(2, 14), "3 / 14");
  });

  it("muestra la última posición sobre el total", () => {
    assert.equal(textoPosicion(13, 14), "14 / 14");
  });

  it("funciona con una sola foto", () => {
    assert.equal(textoPosicion(0, 1), "1 / 1");
  });
});

describe("decidirDeslizamiento", () => {
  it("interpreta un deslizamiento hacia la izquierda como siguiente", () => {
    assert.equal(decidirDeslizamiento(-120, 10), "siguiente");
  });

  it("interpreta un deslizamiento hacia la derecha como anterior", () => {
    assert.equal(decidirDeslizamiento(120, 10), "anterior");
  });

  it("devuelve null si el movimiento no llega al umbral", () => {
    assert.equal(decidirDeslizamiento(-49, 10), null);
    assert.equal(decidirDeslizamiento(20, 5), null);
  });

  it("acepta un movimiento que iguala el umbral", () => {
    assert.equal(decidirDeslizamiento(-50, 10), "siguiente");
    assert.equal(decidirDeslizamiento(50, 10), "anterior");
  });

  it("devuelve null si el movimiento vertical predomina", () => {
    assert.equal(decidirDeslizamiento(-100, 120), null);
    assert.equal(decidirDeslizamiento(100, -120), null);
  });

  it("devuelve null si los movimientos horizontales y verticales son iguales", () => {
    assert.equal(decidirDeslizamiento(-100, 100), null);
    assert.equal(decidirDeslizamiento(100, -100), null);
    assert.equal(decidirDeslizamiento(0, 0), null);
  });

  it("respeta un umbral personalizado", () => {
    assert.equal(decidirDeslizamiento(-80, 10, 100), null);
    assert.equal(decidirDeslizamiento(-120, 10, 100), "siguiente");
    assert.equal(decidirDeslizamiento(120, 10, 100), "anterior");
    assert.equal(decidirDeslizamiento(-100, 10, 100), "siguiente");
  });

  it("acepta un umbral personalizado de cero", () => {
    assert.equal(decidirDeslizamiento(-1, 0, 0), "siguiente");
    assert.equal(decidirDeslizamiento(1, 0, 0), "anterior");
  });

  it("devuelve null con valores no finitos o umbral negativo", () => {
    assert.equal(decidirDeslizamiento(Number.NaN, 10), null);
    assert.equal(decidirDeslizamiento(-100, Number.POSITIVE_INFINITY), null);
    assert.equal(decidirDeslizamiento(-100, 10, Number.NaN), null);
    assert.equal(decidirDeslizamiento(-100, 10, -1), null);
  });
});
