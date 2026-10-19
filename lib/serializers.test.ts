import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  obtenerPrecioUnaNocheUsd,
  obtenerPreciosUsd,
  numeroOpcional,
  serializarPropiedad,
} from "./serializers";
import { calcularPrecio } from "./precios/calcular";

const rawBase = {
  id: "p1",
  nombre: "Cabaña 1",
  descripcion: "d",
  capacidad: 4,
  precioBase: "100.00",
  promoSemanal: "0.00",
  precioNocheAlta: "0.00",
  promoSemanalAlta: "10.00",
  precioNocheBaja: "0.00",
  promoSemanalBaja: "20.00",
  precioNocheAltaUsd: "160.00",
  precioNocheBajaUsd: "100.00",
  precio2a6AltaUsd: "145.00",
  precio2a6BajaUsd: "90.00",
  fotos: [],
  servicios: [],
  activa: true,
  orden: 0,
  creadaEn: new Date("2026-01-01T00:00:00.000Z"),
  actualizadaEn: new Date("2026-01-02T00:00:00.000Z"),
};

describe("numeroOpcional", () => {
  it("convierte valores numéricos y distingue el 0 de la ausencia de dato", () => {
    assert.equal(numeroOpcional("160.00"), 160);
    assert.equal(numeroOpcional(145), 145);
    assert.equal(numeroOpcional(0), 0);
    assert.equal(numeroOpcional("0"), 0);
  });

  it("devuelve null cuando no hay dato", () => {
    assert.equal(numeroOpcional(null), null);
    assert.equal(numeroOpcional(undefined), null);
    assert.equal(numeroOpcional(""), null);
    assert.equal(numeroOpcional("   "), null);
  });

  it("devuelve null cuando el valor no es un número finito", () => {
    assert.equal(numeroOpcional(Number.NaN), null);
    assert.equal(numeroOpcional("abc"), null);
    assert.equal(numeroOpcional(Infinity), null);
  });

  it("acepta objetos con toString numérico como los Decimal de Prisma", () => {
    const decimal = { toString: () => "12.5" };
    assert.equal(numeroOpcional(decimal), 12.5);
  });
});

describe("serializarPropiedad", () => {
  it("convierte los campos de precio en USD a number", () => {
    const propiedad = serializarPropiedad(rawBase);

    assert.equal(propiedad.precioNocheAltaUsd, 160);
    assert.equal(propiedad.precioNocheBajaUsd, 100);
    assert.equal(propiedad.precio2a6AltaUsd, 145);
    assert.equal(propiedad.precio2a6BajaUsd, 90);
    assert.equal(propiedad.promoSemanalAlta, 10);
    assert.equal(propiedad.promoSemanalBaja, 20);
    assert.equal(typeof propiedad.precioNocheAltaUsd, "number");
    assert.equal(typeof propiedad.precioNocheBajaUsd, "number");
    assert.equal(typeof propiedad.precio2a6AltaUsd, "number");
    assert.equal(typeof propiedad.precio2a6BajaUsd, "number");
  });

  it("mantiene null cuando el campo es null o no fue seleccionado", () => {
    const conNull = serializarPropiedad({ ...rawBase, precio2a6BajaUsd: null });
    assert.equal(conNull.precio2a6BajaUsd, null);

    const sinCampo: Record<string, unknown> = { ...rawBase };
    delete sinCampo.precioNocheAltaUsd;
    const sinDato = serializarPropiedad(sinCampo);
    assert.equal(sinDato.precioNocheAltaUsd, null);
    assert.notEqual(sinDato.precioNocheAltaUsd, 0);
    assert.equal(Number.isNaN(sinDato.precioNocheAltaUsd), false);
  });

  it("no altera los campos legacy", () => {
    const propiedad = serializarPropiedad(rawBase);

    assert.equal(propiedad.precioNocheAlta, 0);
    assert.equal(propiedad.precioBase, 100);
    assert.equal(propiedad.promoSemanalAlta, 10);
  });
});

describe("obtenerPreciosUsd", () => {
  it("arma el insumo de calcularPrecio con los campos del serializer", () => {
    assert.deepEqual(obtenerPreciosUsd(serializarPropiedad(rawBase)), {
      precioNocheAltaUsd: 160,
      precioNocheBajaUsd: 100,
      precio2a6AltaUsd: 145,
      precio2a6BajaUsd: 90,
      promoAlta: 10,
      promoBaja: 20,
    });
  });
});

describe("obtenerPrecioUnaNocheUsd", () => {
  it("devuelve el precio según la temporada", () => {
    const propiedad = serializarPropiedad(rawBase);
    assert.equal(obtenerPrecioUnaNocheUsd(propiedad, "ALTA"), 160);
    assert.equal(obtenerPrecioUnaNocheUsd(propiedad, "BAJA"), 100);
  });

  it("devuelve null cuando falta el precio de la temporada pedida", () => {
    const propiedad = serializarPropiedad({ ...rawBase, precioNocheAltaUsd: null });
    assert.equal(obtenerPrecioUnaNocheUsd(propiedad, "ALTA"), null);
    assert.equal(obtenerPrecioUnaNocheUsd(propiedad, "BAJA"), 100);
  });

  it("devuelve null cuando el precio no es positivo", () => {
    const conCero = serializarPropiedad({ ...rawBase, precioNocheAltaUsd: 0 });
    assert.equal(obtenerPrecioUnaNocheUsd(conCero, "ALTA"), null);

    const conNegativo = serializarPropiedad({ ...rawBase, precioNocheAltaUsd: -50 });
    assert.equal(obtenerPrecioUnaNocheUsd(conNegativo, "ALTA"), null);
  });
});

describe("integración con calcularPrecio", () => {
  it("calcula 7 noches de temporada alta con la promo semanal", () => {
    const resultado = calcularPrecio({
      noches: 7,
      temporada: "ALTA",
      precios: obtenerPreciosUsd(serializarPropiedad(rawBase)),
      cotizacionVenta: 1000,
    });

    if (!resultado.ok) {
      assert.fail(`Se esperaba un cálculo válido, se obtuvo: ${resultado.motivo}`);
    }
    assert.equal(resultado.totalUsd, 913.5);
    assert.equal(resultado.totalArs, 917000);
  });
});
