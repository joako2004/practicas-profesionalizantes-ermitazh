import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  calcularPrecio,
  redondearArsAPesos,
  type CalculoPrecio,
  type CalculoPrecioOk,
  type PreciosPropiedadUsd,
  type Temporada,
} from "./calcular";

const preciosBase: PreciosPropiedadUsd = {
  precioNocheAltaUsd: 160,
  precioNocheBajaUsd: 100,
  precio2a6AltaUsd: 145,
  precio2a6BajaUsd: 90,
  promoAlta: 10,
  promoBaja: 20,
};

type OpcionesCalculo = {
  temporada?: Temporada;
  precios?: PreciosPropiedadUsd;
  cotizacionVenta?: number | null;
};

function calcular(noches: number, opciones: OpcionesCalculo = {}): CalculoPrecio {
  return calcularPrecio({
    noches,
    temporada: opciones.temporada ?? "ALTA",
    precios: opciones.precios ?? preciosBase,
    cotizacionVenta: opciones.cotizacionVenta === undefined ? 1000 : opciones.cotizacionVenta,
  });
}

function conPrecios(cambios: Partial<PreciosPropiedadUsd>): PreciosPropiedadUsd {
  return { ...preciosBase, ...cambios };
}

function esperarOk(resultado: CalculoPrecio): asserts resultado is CalculoPrecioOk {
  assert.ok(resultado.ok);
}

describe("cálculo de precios por tramo", () => {
  it("1 noche en ALTA usa el precio de una noche", () => {
    const resultado = calcular(1);
    esperarOk(resultado);

    assert.equal(resultado.tramo, "UNA_NOCHE");
    assert.equal(resultado.precioUnaNocheUsd, 160);
    assert.equal(resultado.precioNocheBaseUsd, 160);
    assert.equal(resultado.precioNocheAplicadoUsd, 160);
    assert.equal(resultado.promoAplicadaPct, 0);
    assert.equal(resultado.totalUsd, 160);
    assert.equal(resultado.cotizacionVenta, 1000);
    assert.equal(resultado.precioNocheBaseArs, 160000);
    assert.equal(resultado.precioNocheAplicadoArs, 160000);
    assert.equal(resultado.totalArs, 160000);
  });

  it("2 noches en ALTA usan el precio de 2 a 6", () => {
    const resultado = calcular(2);
    esperarOk(resultado);

    assert.equal(resultado.tramo, "DE_DOS_A_SEIS");
    assert.equal(resultado.precioNocheBaseUsd, 145);
    assert.equal(resultado.precioNocheAplicadoUsd, 145);
    assert.equal(resultado.promoAplicadaPct, 0);
    assert.equal(resultado.totalUsd, 290);
    assert.equal(resultado.precioNocheAplicadoArs, 145000);
    assert.equal(resultado.totalArs, 290000);
  });

  it("6 noches en ALTA usan el precio de 2 a 6 sin promo", () => {
    const resultado = calcular(6);
    esperarOk(resultado);

    assert.equal(resultado.tramo, "DE_DOS_A_SEIS");
    assert.equal(resultado.totalUsd, 870);
    assert.equal(resultado.totalArs, 870000);
  });

  it("7 noches en ALTA aplican la promo sobre el precio de 2 a 6", () => {
    const resultado = calcular(7);
    esperarOk(resultado);

    assert.equal(resultado.tramo, "SIETE_O_MAS");
    assert.equal(resultado.precioNocheBaseUsd, 145);
    assert.equal(resultado.precioNocheAplicadoUsd, 130.5);
    assert.equal(resultado.promoAplicadaPct, 10);
    assert.equal(resultado.totalUsd, 913.5);
    assert.equal(resultado.precioNocheBaseArs, 145000);
    assert.equal(resultado.precioNocheAplicadoArs, 130500);
    assert.equal(resultado.totalArs, 913500);
  });

  it("30 noches en ALTA aplican la promo y el total sale del precio por noche exacto", () => {
    const resultado = calcular(30);
    esperarOk(resultado);

    assert.equal(resultado.tramo, "SIETE_O_MAS");
    assert.equal(resultado.totalUsd, 3915);
    assert.equal(resultado.precioNocheAplicadoArs, 130500);
    assert.equal(resultado.totalArs, 3915000);
  });
});

describe("fallback de precio de 2 a 6", () => {
  it("2 noches caen al precio de una noche si falta el de 2 a 6", () => {
    const resultado = calcular(2, { precios: conPrecios({ precio2a6AltaUsd: null }) });
    esperarOk(resultado);

    assert.equal(resultado.tramo, "DE_DOS_A_SEIS");
    assert.equal(resultado.precioNocheBaseUsd, 160);
    assert.equal(resultado.precioNocheAplicadoUsd, 160);
    assert.equal(resultado.totalUsd, 320);
    assert.equal(resultado.totalArs, 320000);
  });

  it("7 noches caen al precio de una noche y luego aplican la promo", () => {
    const resultado = calcular(7, { precios: conPrecios({ precio2a6AltaUsd: null }) });
    esperarOk(resultado);

    assert.equal(resultado.tramo, "SIETE_O_MAS");
    assert.equal(resultado.precioNocheBaseUsd, 160);
    assert.equal(resultado.precioNocheAplicadoUsd, 144);
    assert.equal(resultado.totalUsd, 1008);
    assert.equal(resultado.totalArs, 1008000);
  });
});

describe("promociones del tramo de 7 o más noches", () => {
  it("promo 0 y promo nula no descuentan", () => {
    const conCero = calcular(7, { precios: conPrecios({ promoAlta: 0 }) });
    const conNula = calcular(7, { precios: conPrecios({ promoAlta: null }) });
    esperarOk(conCero);

    assert.equal(conCero.precioNocheAplicadoUsd, 145);
    assert.equal(conCero.promoAplicadaPct, 0);
    assert.equal(conCero.totalUsd, 1015);
    assert.equal(conCero.totalArs, 1015000);
    assert.deepEqual(conNula, conCero);
  });

  it("promo 100 deja el total en 0 sin ser error", () => {
    const resultado = calcular(7, { precios: conPrecios({ promoAlta: 100 }) });
    esperarOk(resultado);

    assert.equal(resultado.precioNocheBaseUsd, 145);
    assert.equal(resultado.precioNocheAplicadoUsd, 0);
    assert.equal(resultado.promoAplicadaPct, 100);
    assert.equal(resultado.totalUsd, 0);
    assert.equal(resultado.precioNocheAplicadoArs, 0);
    assert.equal(resultado.totalArs, 0);
  });

  it("promos inválidas se tratan como 0", () => {
    const esperado = calcular(7, { precios: conPrecios({ promoAlta: 0 }) });

    for (const promoAlta of [150, -5, NaN]) {
      const resultado = calcular(7, { precios: conPrecios({ promoAlta }) });
      assert.deepEqual(resultado, esperado);
    }
  });
});

describe("temporadas", () => {
  it("BAJA usa sus propios precios y no mezcla los de ALTA", () => {
    const unaNoche = calcular(1, { temporada: "BAJA" });
    esperarOk(unaNoche);

    assert.equal(unaNoche.temporada, "BAJA");
    assert.equal(unaNoche.tramo, "UNA_NOCHE");
    assert.equal(unaNoche.precioUnaNocheUsd, 100);
    assert.equal(unaNoche.precioNocheAplicadoUsd, 100);
    assert.equal(unaNoche.totalUsd, 100);
    assert.equal(unaNoche.totalArs, 100000);

    const sieteNoches = calcular(7, { temporada: "BAJA" });
    esperarOk(sieteNoches);

    assert.equal(sieteNoches.temporada, "BAJA");
    assert.equal(sieteNoches.tramo, "SIETE_O_MAS");
    assert.equal(sieteNoches.precioNocheBaseUsd, 90);
    assert.equal(sieteNoches.precioNocheAplicadoUsd, 72);
    assert.equal(sieteNoches.promoAplicadaPct, 20);
    assert.equal(sieteNoches.totalUsd, 504);
    assert.equal(sieteNoches.precioNocheBaseArs, 90000);
    assert.equal(sieteNoches.precioNocheAplicadoArs, 72000);
    assert.equal(sieteNoches.totalArs, 504000);
  });
});

describe("falta de precio y de cotización", () => {
  it("sin precio de una noche para la temporada devuelve SIN_PRECIO", () => {
    for (const precioNocheAltaUsd of [null, 0, -1]) {
      const resultado = calcular(3, { precios: conPrecios({ precioNocheAltaUsd }) });
      assert.deepEqual(resultado, { ok: false, motivo: "SIN_PRECIO" });
    }
  });

  it("sin cotización válida devuelve solo los valores USD", () => {
    for (const cotizacionVenta of [null, 0, NaN, -100]) {
      const resultado = calcular(2, { cotizacionVenta });
      esperarOk(resultado);

      assert.equal(resultado.cotizacionVenta, null);
      assert.equal(resultado.precioNocheAplicadoUsd, 145);
      assert.equal(resultado.totalUsd, 290);
      assert.equal(resultado.precioNocheBaseArs, null);
      assert.equal(resultado.precioNocheAplicadoArs, null);
      assert.equal(resultado.totalArs, null);
    }
  });
});

describe("redondeo de pesos", () => {
  it("no redondea al millar: muestra el valor exacto de una noche", () => {
    const resultado = calcular(1, { cotizacionVenta: 1565 });
    esperarOk(resultado);

    assert.equal(resultado.precioNocheBaseArs, 250400);
    assert.equal(resultado.precioNocheAplicadoArs, 250400);
    assert.equal(resultado.totalArs, 250400);
  });

  it("3 noches sin precio de 2 a 6 usan el de una noche y no se redondean al millar", () => {
    const resultado = calcular(3, {
      cotizacionVenta: 1565,
      precios: conPrecios({ precio2a6AltaUsd: null }),
    });
    esperarOk(resultado);

    assert.equal(resultado.precioNocheAplicadoArs, 250400);
    assert.equal(resultado.totalArs, 751200);
  });

  it("7 noches con promo: el total en pesos coincide con el total en USD por la cotización", () => {
    const resultado = calcular(7, {
      cotizacionVenta: 1565,
      precios: conPrecios({ precio2a6AltaUsd: null }),
    });
    esperarOk(resultado);

    assert.equal(resultado.precioNocheAplicadoUsd, 144);
    assert.equal(resultado.totalUsd, 1008);
    assert.equal(resultado.precioNocheAplicadoArs, 225360);
    assert.equal(resultado.totalArs, 1577520);
    assert.equal(resultado.totalArs, resultado.totalUsd * 1565);
  });

  it("redondea al peso entero cuando la cotización trae decimales", () => {
    // 160 × 1640,77 = 262523,2
    const resultado = calcular(1, { cotizacionVenta: 1640.77 });
    esperarOk(resultado);

    assert.equal(resultado.precioNocheAplicadoArs, 262523);
    assert.equal(resultado.totalArs, 262523);
  });

  it("redondea la mitad de un peso hacia arriba y arma el total desde el precio por noche ya redondeado", () => {
    // 145 × 1234,5 = 179002,5
    const resultado = calcular(2, { cotizacionVenta: 1234.5 });
    esperarOk(resultado);

    assert.equal(resultado.precioNocheBaseArs, 179003);
    assert.equal(resultado.precioNocheAplicadoArs, 179003);
    assert.equal(resultado.totalArs, 358006);
  });

  it("redondearArsAPesos resuelve los casos límite", () => {
    assert.equal(redondearArsAPesos(176500), 176500);
    assert.equal(redondearArsAPesos(176500.4), 176500);
    assert.equal(redondearArsAPesos(176500.5), 176501);
    assert.equal(redondearArsAPesos(0), 0);
    assert.equal(redondearArsAPesos(0.4), 0);
    assert.equal(redondearArsAPesos(0.5), 1);
  });
});

describe("validación de noches", () => {
  it("rechaza noches no enteras o fuera de rango", () => {
    for (const noches of [0, 31, 1.5, NaN, -1, Infinity]) {
      const resultado = calcular(noches);
      assert.deepEqual(resultado, { ok: false, motivo: "NOCHES_INVALIDAS" });
    }
  });

  it("acepta los bordes de 1 y 30 noches", () => {
    const unaNoche = calcular(1);
    esperarOk(unaNoche);
    assert.equal(unaNoche.noches, 1);

    const treintaNoches = calcular(30);
    esperarOk(treintaNoches);
    assert.equal(treintaNoches.noches, 30);
  });

  it("prioriza NOCHES_INVALIDAS sobre SIN_PRECIO", () => {
    const resultado = calcular(0, { precios: conPrecios({ precioNocheAltaUsd: null }) });
    assert.deepEqual(resultado, { ok: false, motivo: "NOCHES_INVALIDAS" });
  });
});

describe("pureza", () => {
  it("no lanza ni muta argumentos congelados y es determinística", () => {
    const preciosCongelados = Object.freeze(conPrecios({}));
    const inputCongelado = Object.freeze({
      noches: 7,
      temporada: "ALTA" as const,
      precios: preciosCongelados,
      cotizacionVenta: 1000,
    });

    const primero = calcularPrecio(inputCongelado);
    const segundo = calcularPrecio(inputCongelado);

    assert.deepEqual(segundo, primero);
  });
});
