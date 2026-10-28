import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  MENSAJE_PORTADA_OK,
  hacerPortada,
  mensajeFalloPortada,
} from "./orden";

const A = "https://ejemplo.supabase.co/storage/v1/object/public/fotos/cabanas/1/a.jpeg";
const B = "https://ejemplo.supabase.co/storage/v1/object/public/fotos/cabanas/1/b.jpeg";
const C = "https://ejemplo.supabase.co/storage/v1/object/public/fotos/cabanas/1/c.jpeg";
const D = "https://ejemplo.supabase.co/storage/v1/object/public/fotos/cabanas/1/d.jpeg";
const E = "https://ejemplo.supabase.co/storage/v1/object/public/fotos/cabanas/1/e.jpeg";

describe("hacerPortada", () => {
  it("mueve una foto del medio a la portada y conserva el orden relativo", () => {
    const fotos = [A, B, C, D];

    assert.deepEqual(hacerPortada(fotos, 2, C), {
      ok: true,
      fotos: [C, A, B, D],
    });
  });

  it("mueve la última foto a la portada", () => {
    const fotos = [A, B, C, D];

    assert.deepEqual(hacerPortada(fotos, 3, D), {
      ok: true,
      fotos: [D, A, B, C],
    });
  });

  it("mueve la foto de la posición 1 y la portada anterior queda en la 1", () => {
    const fotos = [A, B, C];

    const resultado = hacerPortada(fotos, 1, B);

    assert.equal(resultado.ok, true);
    if (!resultado.ok) return;

    assert.deepEqual(resultado.fotos, [B, A, C]);
    assert.equal(resultado.fotos[1], A);
  });

  it("no cambia la cantidad de fotos ni pierde o duplica ninguna", () => {
    const fotos = [A, B, C, D, E];

    const resultado = hacerPortada(fotos, 3, D);

    assert.equal(resultado.ok, true);
    if (!resultado.ok) return;

    assert.equal(resultado.fotos.length, fotos.length);
    assert.deepEqual([...resultado.fotos].sort(), [...fotos].sort());
  });

  it("no muta el array de entrada y devuelve uno nuevo", () => {
    const fotos = [A, B, C];
    const copia = [...fotos];

    const resultado = hacerPortada(fotos, 2, C);

    assert.deepEqual(fotos, copia);
    assert.equal(resultado.ok, true);
    if (!resultado.ok) return;

    assert.notEqual(resultado.fotos, fotos);
  });

  it("devuelve ya-es-portada cuando la posición es 0", () => {
    assert.deepEqual(hacerPortada([A, B], 0, A), {
      ok: false,
      motivo: "ya-es-portada",
    });
  });

  it("devuelve desactualizada cuando la URL no coincide con la posición", () => {
    assert.deepEqual(hacerPortada([A, B, C], 1, C), {
      ok: false,
      motivo: "desactualizada",
    });
  });

  it("devuelve desactualizada ante diferencias mínimas de texto", () => {
    const fotos = [A, `${B}/`];

    assert.deepEqual(hacerPortada(fotos, 1, B), {
      ok: false,
      motivo: "desactualizada",
    });
  });

  it("devuelve posicion-invalida para posiciones negativas o no enteras", () => {
    const fotos = [A, B, C];

    assert.deepEqual(hacerPortada(fotos, -1, A), {
      ok: false,
      motivo: "posicion-invalida",
    });
    assert.deepEqual(hacerPortada(fotos, 1.5, B), {
      ok: false,
      motivo: "posicion-invalida",
    });
    assert.deepEqual(hacerPortada(fotos, Number.NaN, A), {
      ok: false,
      motivo: "posicion-invalida",
    });
  });

  it("devuelve posicion-invalida si la posición queda fuera de rango", () => {
    assert.deepEqual(hacerPortada([A, B], 2, A), {
      ok: false,
      motivo: "posicion-invalida",
    });
    assert.deepEqual(hacerPortada([A, B], 99, A), {
      ok: false,
      motivo: "posicion-invalida",
    });
  });

  it("devuelve posicion-invalida con un array vacío", () => {
    assert.deepEqual(hacerPortada([], 0, A), {
      ok: false,
      motivo: "posicion-invalida",
    });
  });

  it("con URLs repetidas solo mueve el elemento de la posición indicada", () => {
    const fotos = [A, B, A, C];

    assert.deepEqual(hacerPortada(fotos, 2, A), {
      ok: true,
      fotos: [A, A, B, C],
    });
  });

  it("con la URL repetida al final no deduplica ni pierde apariciones", () => {
    const fotos = [A, B, C, A];

    const resultado = hacerPortada(fotos, 3, A);

    assert.equal(resultado.ok, true);
    if (!resultado.ok) return;

    assert.deepEqual(resultado.fotos, [A, A, B, C]);
    assert.equal(resultado.fotos.length, fotos.length);
  });
});

describe("mensajeFalloPortada", () => {
  it("devuelve los textos exactos de cada motivo", () => {
    assert.equal(
      mensajeFalloPortada("ya-es-portada"),
      "Esa foto ya es la portada."
    );
    assert.equal(
      mensajeFalloPortada("desactualizada"),
      "La lista de fotos cambió. Actualizá la página e intentá de nuevo."
    );
    assert.equal(
      mensajeFalloPortada("posicion-invalida"),
      "Foto inválida."
    );
  });
});

describe("MENSAJE_PORTADA_OK", () => {
  it("es el texto exacto que se muestra al confirmar el cambio", () => {
    assert.equal(
      MENSAJE_PORTADA_OK,
      "Listo: esa foto ahora es la portada de la cabaña."
    );
  });
});
