import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  CAMPOS_USD,
  PRECIO_USD_MAX,
  esCampoUsd,
  validarPrecioUsd,
  validarPromoPct,
  type ResultadoValidacion,
} from "./validar";

function esperarOk(resultado: ResultadoValidacion, esperado: number | null): void {
  if (!resultado.ok) {
    assert.fail(`Se esperaba éxito, pero falló: ${resultado.error}`);
  }
  assert.equal(resultado.valor, esperado);
}

function esperarError(resultado: ResultadoValidacion): void {
  if (resultado.ok) {
    assert.fail(`Se esperaba error, pero devolvió: ${resultado.valor}`);
  }
  assert.equal(typeof resultado.error, "string");
  assert.ok(resultado.error.length > 0);
}

describe("validarPrecioUsd", () => {
  it("acepta números válidos y los redondea a 2 decimales", () => {
    esperarOk(validarPrecioUsd(145), 145);
    esperarOk(validarPrecioUsd(145.5), 145.5);
    esperarOk(validarPrecioUsd(1.005), 1.01);
    esperarOk(validarPrecioUsd(0.01), 0.01);
    esperarOk(validarPrecioUsd(0.005), 0.01);
    esperarOk(validarPrecioUsd(PRECIO_USD_MAX), 1000000);
  });

  it("rechaza valores por encima del tope, comparando el valor crudo", () => {
    esperarError(validarPrecioUsd(1000000.01));
    esperarError(validarPrecioUsd(1000000.004));
  });

  it("acepta null y strings vacíos como sinónimo de vaciar", () => {
    esperarOk(validarPrecioUsd(null), null);
    esperarOk(validarPrecioUsd(""), null);
    esperarOk(validarPrecioUsd("   "), null);
  });

  it("rechaza undefined, que no es lo mismo que vaciar", () => {
    esperarError(validarPrecioUsd(undefined));
  });

  it("rechaza valores no positivos o que redondean a 0", () => {
    esperarError(validarPrecioUsd(0));
    esperarError(validarPrecioUsd(-5));
    esperarError(validarPrecioUsd(0.004));
    esperarError(validarPrecioUsd(1e-7));
  });

  it("rechaza números no finitos", () => {
    esperarError(validarPrecioUsd(NaN));
    esperarError(validarPrecioUsd(Infinity));
    esperarError(validarPrecioUsd(-Infinity));
  });

  it("rechaza strings no vacíos y tipos que no son number", () => {
    esperarError(validarPrecioUsd("145"));
    esperarError(validarPrecioUsd("abc"));
    esperarError(validarPrecioUsd(true));
    esperarError(validarPrecioUsd({}));
    esperarError(validarPrecioUsd([]));
  });
});

describe("validarPromoPct", () => {
  it("acepta porcentajes entre 0 y 100 y los redondea", () => {
    esperarOk(validarPromoPct(0), 0);
    esperarOk(validarPromoPct(100), 100);
    esperarOk(validarPromoPct(12.5), 12.5);
    esperarOk(validarPromoPct(10.005), 10.01);
    esperarOk(validarPromoPct(0.004), 0);
  });

  it("rechaza valores fuera de rango o de tipo inválido", () => {
    esperarError(validarPromoPct(-1));
    esperarError(validarPromoPct(100.01));
    esperarError(validarPromoPct(null));
    esperarError(validarPromoPct(undefined));
    esperarError(validarPromoPct(NaN));
    esperarError(validarPromoPct("10"));
  });
});

describe("esCampoUsd", () => {
  it("reconoce los 4 campos USD", () => {
    assert.equal(esCampoUsd("precioNocheAltaUsd"), true);
    assert.equal(esCampoUsd("precioNocheBajaUsd"), true);
    assert.equal(esCampoUsd("precio2a6AltaUsd"), true);
    assert.equal(esCampoUsd("precio2a6BajaUsd"), true);
  });

  it("rechaza campos ARS legacy y valores que no son strings", () => {
    assert.equal(esCampoUsd("precioNocheAlta"), false);
    assert.equal(esCampoUsd("precioBase"), false);
    assert.equal(esCampoUsd("promoSemanalAlta"), false);
    assert.equal(esCampoUsd(""), false);
    assert.equal(esCampoUsd(42), false);
    assert.equal(esCampoUsd(null), false);
    assert.equal(esCampoUsd(undefined), false);
  });

  it("CAMPOS_USD tiene exactamente los 4 campos y todos son válidos", () => {
    assert.equal(CAMPOS_USD.length, 4);
    assert.deepEqual([...CAMPOS_USD], [
      "precioNocheAltaUsd",
      "precioNocheBajaUsd",
      "precio2a6AltaUsd",
      "precio2a6BajaUsd",
    ]);
    for (const campo of CAMPOS_USD) {
      assert.equal(esCampoUsd(campo), true);
    }
  });
});
