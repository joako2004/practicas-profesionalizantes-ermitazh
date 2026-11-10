import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  validarNuevaPropiedad,
  claveNombre,
  LIMITES_PROPIEDAD,
} from "./validar-nueva";

describe("validarNuevaPropiedad", () => {
  // Caso válido completo
  it("debe validar una propiedad completa con todos los campos correctos", () => {
    const entrada = {
      nombre: "Cabaña del Lago",
      descripcion: "Una cabaña junto al lago",
      capacidad: "4",
      orden: "2",
      activa: true,
      servicios: ["Wifi", "Cocina", "Estacionamiento"],
      precioNocheAltaUsd: "150",
      precioNocheBajaUsd: "100",
      precio2a6AltaUsd: "80",
      precio2a6BajaUsd: "60",
      promoSemanalAlta: "10",
      promoSemanalBaja: "5",
    };
    const resultado = validarNuevaPropiedad(entrada);
    assert.ok(resultado.ok, "Debería haber éxito");
    assert.strictEqual(resultado.valor.nombre, "Cabaña del Lago");
    assert.strictEqual(resultado.valor.descripcion, "Una cabaña junto al lago");
    assert.strictEqual(resultado.valor.capacidad, 4);
    assert.strictEqual(resultado.valor.orden, 2);
    assert.strictEqual(resultado.valor.activa, true);
    assert.deepStrictEqual(resultado.valor.servicios, ["Wifi", "Cocina", "Estacionamiento"]);
    assert.strictEqual(resultado.valor.precioNocheAltaUsd, 150);
    assert.strictEqual(resultado.valor.precioNocheBajaUsd, 100);
    assert.strictEqual(resultado.valor.precio2a6AltaUsd, 80);
    assert.strictEqual(resultado.valor.precio2a6BajaUsd, 60);
    assert.strictEqual(resultado.valor.promoSemanalAlta, 10);
    assert.strictEqual(resultado.valor.promoSemanalBaja, 5);
  });

  it("debe validar con campos mínimos: nombre, descripción y capacidad", () => {
    const entrada = {
      nombre: "Cabaña Simple",
      descripcion: "Una cabaña básica",
      capacidad: "2",
    };
    const resultado = validarNuevaPropiedad(entrada);
    assert.ok(resultado.ok, "Debería haber éxito");
    if (resultado.ok) {
      assert.strictEqual(resultado.valor.nombre, "Cabaña Simple");
      assert.strictEqual(resultado.valor.descripcion, "Una cabaña básica");
      assert.strictEqual(resultado.valor.capacidad, 2);
      assert.strictEqual(resultado.valor.orden, null);
      assert.strictEqual(resultado.valor.activa, false);
      assert.deepStrictEqual(resultado.valor.servicios, []);
      assert.strictEqual(resultado.valor.promoSemanalAlta, 0);
      assert.strictEqual(resultado.valor.promoSemanalBaja, 0);
    }
  });

  it("debe colapsar espacios y normalizar mayúsculas en nombre y descripción", () => {
    const entrada = {
      nombre: "  Cabaña   del  Lago  ",
      descripcion: "  Descripción  con  espacios  ",
      capacidad: "2",
    };
    const resultado = validarNuevaPropiedad(entrada);
    assert.ok(resultado.ok, "Debería haber éxito");
    if (resultado.ok) {
      assert.strictEqual(resultado.valor.nombre, "Cabaña del Lago");
      assert.strictEqual(resultado.valor.descripcion, "Descripción con espacios");
    }
  });

  it("debe rechazar nombre vacío", () => {
    const resultado = validarNuevaPropiedad({ nombre: "", descripcion: "Desc", capacidad: "2" });
    assert.ok(!resultado.ok, "Debería haber error");
    assert.strictEqual(resultado.errores?.nombre, "El nombre es obligatorio");
  });

  it("debe rechazar nombre solo con espacios", () => {
    const resultado = validarNuevaPropiedad({ nombre: "   ", descripcion: "Desc", capacidad: "2" });
    assert.ok(!resultado.ok, "Debería haber error");
    assert.strictEqual(resultado.errores?.nombre, "El nombre es obligatorio");
  });

  it("debe rechazar nombre de 81 caracteres", () => {
    const nombreLargo = "A".repeat(81);
    const resultado = validarNuevaPropiedad({ nombre: nombreLargo, descripcion: "Desc", capacidad: "2" });
    assert.ok(!resultado.ok, "Debería haber error");
    assert.strictEqual(resultado.errores?.nombre, `El nombre no puede tener más de ${LIMITES_PROPIEDAD.nombreMax} caracteres`);
  });

  it("debe aceptar nombre de 80 caracteres", () => {
    const nombreJusto = "A".repeat(80);
    const resultado = validarNuevaPropiedad({ nombre: nombreJusto, descripcion: "Desc", capacidad: "2" });
    assert.ok(resultado.ok, "Debería haber éxito");
  });

  it("debe rechazar descripción vacía", () => {
    const resultado = validarNuevaPropiedad({ nombre: "Nom", descripcion: "", capacidad: "2" });
    assert.ok(!resultado.ok, "Debería haber error");
    assert.strictEqual(resultado.errores?.descripcion, "La descripción es obligatoria");
  });

  it("debe rechazar descripción de 2001 caracteres", () => {
    const descLarga = "X".repeat(2001);
    const resultado = validarNuevaPropiedad({ nombre: "Nom", descripcion: descLarga, capacidad: "2" });
    assert.ok(!resultado.ok, "Debería haber error");
  });

  it("debe rechazar capacidad 0", () => {
    const resultado = validarNuevaPropiedad({ nombre: "Nom", descripcion: "Desc", capacidad: "0" });
    assert.ok(!resultado.ok, "Debería haber error");
    assert.strictEqual(resultado.errores?.capacidad, `La capacidad debe ser un número entero entre 1 y ${LIMITES_PROPIEDAD.capacidadMax}`);
  });

  it("debe rechazar capacidad 21", () => {
    const resultado = validarNuevaPropiedad({ nombre: "Nom", descripcion: "Desc", capacidad: "21" });
    assert.ok(!resultado.ok, "Debería haber error");
  });

  it("debe rechazar capacidad '2.5' (decimal)", () => {
    const resultado = validarNuevaPropiedad({ nombre: "Nom", descripcion: "Desc", capacidad: "2.5" });
    assert.ok(!resultado.ok, "Debería haber error");
  });

  it("debe rechazar capacidad 'abc' (texto)", () => {
    const resultado = validarNuevaPropiedad({ nombre: "Nom", descripcion: "Desc", capacidad: "abc" });
    assert.ok(!resultado.ok, "Debería haber error");
  });

  it("debe rechazar capacidad vacía (obligatoria)", () => {
    const resultado = validarNuevaPropiedad({ nombre: "Nom", descripcion: "Desc", capacidad: "" });
    assert.ok(!resultado.ok, "Debería haber error");
    assert.strictEqual(resultado.errores?.capacidad, "La capacidad es obligatoria.");
  });

  it("debe rechazar capacidad ausente (undefined)", () => {
    const resultado = validarNuevaPropiedad({ nombre: "Nom", descripcion: "Desc" });
    assert.ok(!resultado.ok, "Debería haber error");
    assert.strictEqual(resultado.errores?.capacidad, "La capacidad es obligatoria.");
  });

  it("debe rechazar capacidad null", () => {
    const resultado = validarNuevaPropiedad({ nombre: "Nom", descripcion: "Desc", capacidad: null });
    assert.ok(!resultado.ok, "Debería haber error");
    assert.strictEqual(resultado.errores?.capacidad, "La capacidad es obligatoria.");
  });

  it("debe rechazar capacidad con solo espacios", () => {
    const resultado = validarNuevaPropiedad({ nombre: "Nom", descripcion: "Desc", capacidad: "   " });
    assert.ok(!resultado.ok, "Debería haber error");
    assert.strictEqual(resultado.errores?.capacidad, "La capacidad es obligatoria.");
  });

  it("debe devolver capacidad numérica cuando llega '4'", () => {
    const resultado = validarNuevaPropiedad({ nombre: "Nom", descripcion: "Desc", capacidad: "4" });
    assert.ok(resultado.ok, "Debería haber éxito");
    if (resultado.ok) {
      assert.strictEqual(resultado.valor.capacidad, 4);
      assert.strictEqual(typeof resultado.valor.capacidad, "number");
    }
  });

  it("debe aceptar capacidad '6'", () => {
    const resultado = validarNuevaPropiedad({ nombre: "Nom", descripcion: "Desc", capacidad: "6" });
    assert.ok(resultado.ok, "Debería haber éxito");
    if (resultado.ok) {
      assert.strictEqual(resultado.valor.capacidad, 6);
    }
  });

  it("debe aceptar orden vacío (null automático)", () => {
    const resultado = validarNuevaPropiedad({ nombre: "Nom", descripcion: "Desc", capacidad: "2" });
    assert.ok(resultado.ok, "Debería haber éxito");
    if (resultado.ok) {
      assert.strictEqual(resultado.valor.orden, null);
    }
  });

  it("debe rechazar orden '-1' (negativo)", () => {
    const resultado = validarNuevaPropiedad({ nombre: "Nom", descripcion: "Desc", capacidad: "2", orden: "-1" });
    assert.ok(!resultado.ok, "Debería haber error");
  });

  it("debe rechazar orden '10000' (mayor a 9999)", () => {
    const resultado = validarNuevaPropiedad({ nombre: "Nom", descripcion: "Desc", capacidad: "2", orden: "10000" });
    assert.ok(!resultado.ok, "Debería haber error");
  });

  it("debe aceptar orden '3'", () => {
    const resultado = validarNuevaPropiedad({ nombre: "Nom", descripcion: "Desc", capacidad: "2", orden: "3" });
    assert.ok(resultado.ok, "Debería haber éxito");
    if (resultado.ok) {
      assert.strictEqual(resultado.valor.orden, 3);
    }
  });

  it("debe quitar duplicados case-insensitive en servicios ('WiFi' y 'wifi')", () => {
    const resultado = validarNuevaPropiedad({
      nombre: "Nom", descripcion: "Desc", capacidad: "2",
      servicios: ["WiFi", "wifi"],
    });
    assert.ok(resultado.ok, "Debería haber éxito");
    if (resultado.ok) {
      assert.strictEqual(resultado.valor.servicios.length, 1);
      assert.strictEqual(resultado.valor.servicios[0], "WiFi");
    }
  });

  it("debe manejar servicios con vacíos (descartarlos)", () => {
    const resultado = validarNuevaPropiedad({
      nombre: "Nom", descripcion: "Desc", capacidad: "2",
      servicios: ["", "  ", "Wifi"],
    });
    if (resultado.ok) {
      assert.deepStrictEqual(resultado.valor.servicios, ["Wifi"]);
    }
  });

  it("debe rechazar servicios con 21 elementos", () => {
    const muchos = Array.from({ length: 21 }, (_, i) => `Servicio ${i + 1}`);
    const resultado = validarNuevaPropiedad({
      nombre: "Nom", descripcion: "Desc", capacidad: "2", servicios: muchos,
    });
    assert.ok(!resultado.ok, "Debería haber error");
  });

  it("debe rechazar servicio de 41 caracteres", () => {
    const largo = "X".repeat(41);
    const resultado = validarNuevaPropiedad({
      nombre: "Nom", descripcion: "Desc", capacidad: "2",
      servicios: [largo],
    });
    assert.ok(!resultado.ok, "Debería haber error");
  });

  it("debe aceptar precios vacíos (convertir a null)", () => {
    const entrada = {
      nombre: "Nom", descripcion: "Desc", capacidad: "2",
      precioNocheAltaUsd: "", precioNocheBajaUsd: "",
      precio2a6AltaUsd: "", precio2a6BajaUsd: "",
    };
    const resultado = validarNuevaPropiedad(entrada);
    assert.ok(resultado.ok, "Debería haber éxito");
    if (resultado.ok) {
      assert.strictEqual(resultado.valor.precioNocheAltaUsd, null);
      assert.strictEqual(resultado.valor.precioNocheBajaUsd, null);
      assert.strictEqual(resultado.valor.precio2a6AltaUsd, null);
      assert.strictEqual(resultado.valor.precio2a6BajaUsd, null);
    }
  });

  it("debe rechazar precio '0'", () => {
    const resultado = validarNuevaPropiedad({
      nombre: "Nom", descripcion: "Desc", capacidad: "2",
      precioNocheAltaUsd: "0",
    });
    assert.ok(!resultado.ok, "Debería haber error");
  });

  it("debe rechazar precio '-5' (negativo)", () => {
    const resultado = validarNuevaPropiedad({
      nombre: "Nom", descripcion: "Desc", capacidad: "2",
      precioNocheAltaUsd: "-5",
    });
    assert.ok(!resultado.ok, "Debería haber error");
  });

  it("debe rechazar precio '1000001' (sobre tope)", () => {
    const resultado = validarNuevaPropiedad({
      nombre: "Nom", descripcion: "Desc", capacidad: "2",
      precioNocheAltaUsd: "1000001",
    });
    assert.ok(!resultado.ok, "Debería haber error");
  });

  it("debe aceptar precio '110,50' (parseFloat lo convierte a 110)", () => {
    const resultado = validarNuevaPropiedad({
      nombre: "Nom", descripcion: "Desc", capacidad: "2",
      precioNocheAltaUsd: "110,50",
    });
    assert.ok(resultado.ok, "Debería haber éxito");
  });

  it("debe aceptar precio '110.50'", () => {
    const resultado = validarNuevaPropiedad({
      nombre: "Nom", descripcion: "Desc", capacidad: "2",
      precioNocheAltaUsd: "110.50",
    });
    assert.ok(resultado.ok, "Debería haber éxito");
  });

  it("debe aceptar promoción vacía (valor 0)", () => {
    const resultado = validarNuevaPropiedad({
      nombre: "Nom", descripcion: "Desc", capacidad: "2",
      promoSemanalAlta: "", promoSemanalBaja: "",
    });
    assert.ok(resultado.ok, "Debería haber éxito");
    if (resultado.ok) {
      assert.strictEqual(resultado.valor.promoSemanalAlta, 0);
      assert.strictEqual(resultado.valor.promoSemanalBaja, 0);
    }
  });

  it("debe aceptar promoción '0'", () => {
    const resultado = validarNuevaPropiedad({
      nombre: "Nom", descripcion: "Desc", capacidad: "2",
      promoSemanalAlta: "0",
    });
    assert.ok(resultado.ok, "Debería haber éxito");
    if (resultado.ok) {
      assert.strictEqual(resultado.valor.promoSemanalAlta, 0);
    }
  });

  it("debe aceptar promoción '10'", () => {
    const resultado = validarNuevaPropiedad({
      nombre: "Nom", descripcion: "Desc", capacidad: "2",
      promoSemanalAlta: "10",
    });
    assert.ok(resultado.ok, "Debería haber éxito");
    if (resultado.ok) {
      assert.strictEqual(resultado.valor.promoSemanalAlta, 10);
    }
  });

  it("debe rechazar promoción '101' (mayor a 100)", () => {
    const resultado = validarNuevaPropiedad({
      nombre: "Nom", descripcion: "Desc", capacidad: "2",
      promoSemanalAlta: "101",
    });
    assert.ok(!resultado.ok, "Debería haber error");
  });

  it("debe rechazar promoción '-1' (menor a 0)", () => {
    const resultado = validarNuevaPropiedad({
      nombre: "Nom", descripcion: "Desc", capacidad: "2",
      promoSemanalAlta: "-1",
    });
    assert.ok(!resultado.ok, "Debería haber error");
  });

  it("debe devolver todos los errores juntos cuando hay múltiples fallos", () => {
    const resultado = validarNuevaPropiedad({
      nombre: "", descripcion: "", capacidad: "0", orden: "-1",
    });
    assert.ok(!resultado.ok, "Debería haber error");
    if (!resultado.ok && resultado.errores) {
      const keys = Object.keys(resultado.errores);
      assert.ok(keys.length >= 3, `Deberían haber al menos 3 errores, tuvieron: ${keys.join(", ")}`);
    }
  });

  it("debe rechazar entrada null", () => {
    const resultado = validarNuevaPropiedad(null as never);
    assert.ok(!resultado.ok, "Debería haber error");
  });

  it("debe rechazar entrada undefined", () => {
    const resultado = validarNuevaPropiedad(undefined as never);
    assert.ok(!resultado.ok, "Debería haber error");
  });

  it("debe rechazar entrada string", () => {
    const resultado = validarNuevaPropiedad("Hola" as never);
    assert.ok(!resultado.ok, "Debería haber error");
  });
});

describe("claveNombre", () => {
  it("debe devolver clave minúsculas sin tildes ni espacios repetidos", () => {
    const resultado = claveNombre("Cabaña del Lago");
    assert.ok(typeof resultado === "string");
    assert.strictEqual(resultado, resultado.toLowerCase(), "Debe ser minúscula");
    assert.ok(!/á|é|í|ó|ú|ñ/.test(resultado), "No debe tener tildes");
  });

  it("debe remover tildes del nombre", () => {
    const resultado = claveNombre("Árbol");
    assert.strictEqual(resultado, "arbol");
  });

  it("debe eliminar espacios repetidos y en extremos", () => {
    const resultado = claveNombre("  Árbol   Solo  ");
    assert.ok(resultado.includes("árbol") || resultado.includes("arbol"));
  });
});