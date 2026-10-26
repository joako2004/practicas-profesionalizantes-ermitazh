import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  MAX_ARCHIVOS_POR_TANDA,
  TAMANO_MAXIMO_BYTES,
  validarArchivoFoto,
  type ResultadoValidacionArchivo,
} from "./rutas";
import {
  actualizarEstado,
  claveArchivo,
  incorporarArchivos,
  itemsSubibles,
  quitarItem,
  resumenTanda,
  type CandidatoArchivo,
  type ItemSubida,
} from "./subida";

function candidato(
  nombre: string,
  tipo: string,
  tamano: number,
  ultimaModificacion = 1
): CandidatoArchivo {
  return { nombre, tipo, tamano, ultimaModificacion };
}

function itemsDesde(candidatos: CandidatoArchivo[]): ItemSubida[] {
  return incorporarArchivos([], candidatos, MAX_ARCHIVOS_POR_TANDA).items;
}

function errorDeValidacion(resultado: ResultadoValidacionArchivo): string {
  if (resultado.ok) {
    assert.fail("Se esperaba un resultado inválido");
  }

  return resultado.error;
}

describe("claveArchivo", () => {
  it("combina nombre, tamaño y última modificación", () => {
    const base = candidato("foto.jpeg", "image/jpeg", 1024, 10);

    assert.equal(claveArchivo(base), claveArchivo({ ...base }));
    assert.notEqual(
      claveArchivo(base),
      claveArchivo({ ...base, nombre: "otra.jpeg" })
    );
    assert.notEqual(claveArchivo(base), claveArchivo({ ...base, tamano: 2048 }));
    assert.notEqual(
      claveArchivo(base),
      claveArchivo({ ...base, ultimaModificacion: 11 })
    );
  });
});

describe("incorporarArchivos", () => {
  it("acepta jpeg, png y webp válidos en estado pendiente y en orden", () => {
    const { items, rechazados } = incorporarArchivos(
      [],
      [
        candidato("a.jpeg", "image/jpeg", 1024, 1),
        candidato("b.png", "image/png", 2048, 2),
        candidato("c.webp", "image/webp", 4096, 3),
      ],
      MAX_ARCHIVOS_POR_TANDA
    );

    assert.deepEqual(rechazados, []);
    assert.deepEqual(
      items.map((item) => item.nombre),
      ["a.jpeg", "b.png", "c.webp"]
    );
    assert.ok(items.every((item) => item.estado === "pendiente"));
  });

  it("agrega los nuevos al final de los existentes", () => {
    const existentes = itemsDesde([
      candidato("uno.jpeg", "image/jpeg", 1024, 1),
    ]);

    const { items } = incorporarArchivos(
      existentes,
      [candidato("dos.png", "image/png", 1024, 2)],
      MAX_ARCHIVOS_POR_TANDA
    );

    assert.deepEqual(
      items.map((item) => item.nombre),
      ["uno.jpeg", "dos.png"]
    );
    assert.equal(items[0].clave, existentes[0].clave);
  });

  it("rechaza un duplicado que ya está en la lista existente", () => {
    const existente = candidato("foto.jpeg", "image/jpeg", 1024, 1);
    const existentes = itemsDesde([existente]);

    const { items, rechazados } = incorporarArchivos(
      existentes,
      [candidato("foto.jpeg", "image/jpeg", 1024, 1)],
      MAX_ARCHIVOS_POR_TANDA
    );

    assert.equal(items.length, 1);
    assert.deepEqual(rechazados, [
      { nombre: "foto.jpeg", motivo: "Ya agregaste este archivo." },
    ]);
  });

  it("rechaza un duplicado dentro del mismo lote", () => {
    const { items, rechazados } = incorporarArchivos(
      [],
      [
        candidato("foto.png", "image/png", 1024, 5),
        candidato("foto.png", "image/png", 1024, 5),
      ],
      MAX_ARCHIVOS_POR_TANDA
    );

    assert.equal(items.length, 1);
    assert.deepEqual(rechazados, [
      { nombre: "foto.png", motivo: "Ya agregaste este archivo." },
    ]);
  });

  it("rechaza HEIC con el mensaje de validarArchivoFoto", () => {
    const heic = candidato("foto.heic", "image/heic", 1024, 1);
    const esperado = errorDeValidacion(
      validarArchivoFoto({
        nombre: heic.nombre,
        tipo: heic.tipo,
        tamano: heic.tamano,
      })
    );

    const { items, rechazados } = incorporarArchivos(
      [],
      [heic],
      MAX_ARCHIVOS_POR_TANDA
    );

    assert.deepEqual(items, []);
    assert.deepEqual(rechazados, [{ nombre: "foto.heic", motivo: esperado }]);
  });

  it("rechaza un archivo más grande que TAMANO_MAXIMO_BYTES", () => {
    const grande = candidato(
      "grande.jpeg",
      "image/jpeg",
      TAMANO_MAXIMO_BYTES + 1,
      1
    );
    const esperado = errorDeValidacion(
      validarArchivoFoto({
        nombre: grande.nombre,
        tipo: grande.tipo,
        tamano: grande.tamano,
      })
    );

    const { items, rechazados } = incorporarArchivos(
      [],
      [grande],
      MAX_ARCHIVOS_POR_TANDA
    );

    assert.deepEqual(items, []);
    assert.deepEqual(rechazados, [
      { nombre: "grande.jpeg", motivo: esperado },
    ]);
  });

  it("rechaza un tipo no permitido", () => {
    const gif = candidato("animado.gif", "image/gif", 1024, 1);
    const esperado = errorDeValidacion(
      validarArchivoFoto({
        nombre: gif.nombre,
        tipo: gif.tipo,
        tamano: gif.tamano,
      })
    );

    const { items, rechazados } = incorporarArchivos(
      [],
      [gif],
      MAX_ARCHIVOS_POR_TANDA
    );

    assert.deepEqual(items, []);
    assert.deepEqual(rechazados, [{ nombre: "animado.gif", motivo: esperado }]);
  });

  it("respeta el tope de la tanda", () => {
    const existentes = itemsDesde(
      Array.from({ length: 8 }, (_, indice) =>
        candidato(`previa-${indice}.jpeg`, "image/jpeg", 1024, indice + 1)
      )
    );
    const nuevos = Array.from({ length: 5 }, (_, indice) =>
      candidato(`nueva-${indice}.jpeg`, "image/jpeg", 2048, 100 + indice)
    );

    const { items, rechazados } = incorporarArchivos(
      existentes,
      nuevos,
      MAX_ARCHIVOS_POR_TANDA
    );

    assert.equal(items.length, MAX_ARCHIVOS_POR_TANDA);
    assert.deepEqual(
      items.slice(8).map((item) => item.nombre),
      ["nueva-0.jpeg", "nueva-1.jpeg"]
    );
    assert.equal(rechazados.length, 3);
    for (const rechazo of rechazados) {
      assert.equal(
        rechazo.motivo,
        `Máximo ${MAX_ARCHIVOS_POR_TANDA} fotos por tanda.`
      );
    }
  });

  it("no muta los arreglos de entrada", () => {
    const existentes = itemsDesde([
      candidato("uno.jpeg", "image/jpeg", 1024, 1),
    ]);
    const copiaExistentes = existentes.map((item) => ({ ...item }));
    const candidatos = [candidato("dos.png", "image/png", 2048, 2)];
    const copiaCandidatos = candidatos.map((item) => ({ ...item }));

    const { items } = incorporarArchivos(
      existentes,
      candidatos,
      MAX_ARCHIVOS_POR_TANDA
    );

    assert.deepEqual(existentes, copiaExistentes);
    assert.deepEqual(candidatos, copiaCandidatos);
    assert.equal(items.length, 2);
    assert.notEqual(items, existentes);
  });
});

describe("quitarItem", () => {
  it("quita por clave sin mutar el arreglo original", () => {
    const items = itemsDesde([
      candidato("uno.jpeg", "image/jpeg", 1024, 1),
      candidato("dos.png", "image/png", 1024, 2),
    ]);

    const resultado = quitarItem(items, items[0].clave);

    assert.deepEqual(
      resultado.map((item) => item.nombre),
      ["dos.png"]
    );
    assert.equal(items.length, 2);
  });
});

describe("actualizarEstado", () => {
  it("cambia el estado sin mutar y limpia el error al salir de error", () => {
    const items = itemsDesde([
      candidato("uno.jpeg", "image/jpeg", 1024, 1),
    ]);
    const clave = items[0].clave;

    const subiendo = actualizarEstado(items, clave, "subiendo");
    assert.equal(subiendo[0].estado, "subiendo");
    assert.equal(items[0].estado, "pendiente");

    const conError = actualizarEstado(subiendo, clave, "error", "Falló la subida.");
    assert.equal(conError[0].estado, "error");
    assert.equal(conError[0].error, "Falló la subida.");

    const listo = actualizarEstado(conError, clave, "listo");
    assert.equal(listo[0].estado, "listo");
    assert.equal(listo[0].error, undefined);
    assert.equal("error" in listo[0], false);
  });

  it("ignora las claves que no están en la lista", () => {
    const items = itemsDesde([
      candidato("uno.jpeg", "image/jpeg", 1024, 1),
    ]);

    assert.deepEqual(actualizarEstado(items, "otra-clave", "listo"), items);
  });
});

describe("itemsSubibles", () => {
  it("devuelve pendientes y con error, no los listos ni los que suben", () => {
    const items = itemsDesde([
      candidato("uno.jpeg", "image/jpeg", 1024, 1),
      candidato("dos.jpeg", "image/jpeg", 1024, 2),
      candidato("tres.jpeg", "image/jpeg", 1024, 3),
      candidato("cuatro.jpeg", "image/jpeg", 1024, 4),
    ]);

    let resultado = actualizarEstado(items, items[0].clave, "listo");
    resultado = actualizarEstado(resultado, items[1].clave, "subiendo");
    resultado = actualizarEstado(resultado, items[2].clave, "error", "Falló");

    assert.deepEqual(
      itemsSubibles(resultado).map((item) => item.nombre),
      ["tres.jpeg", "cuatro.jpeg"]
    );
  });
});

describe("resumenTanda", () => {
  it("cuenta cada estado", () => {
    const items = itemsDesde([
      candidato("uno.jpeg", "image/jpeg", 1024, 1),
      candidato("dos.jpeg", "image/jpeg", 1024, 2),
      candidato("tres.jpeg", "image/jpeg", 1024, 3),
      candidato("cuatro.jpeg", "image/jpeg", 1024, 4),
    ]);

    let resultado = actualizarEstado(items, items[0].clave, "listo");
    resultado = actualizarEstado(resultado, items[1].clave, "subiendo");
    resultado = actualizarEstado(resultado, items[2].clave, "error", "Falló");

    assert.deepEqual(resumenTanda(resultado), {
      total: 4,
      listos: 1,
      conError: 1,
      pendientes: 1,
      subiendo: 1,
    });
  });

  it("devuelve todo en cero para una lista vacía", () => {
    assert.deepEqual(resumenTanda([]), {
      total: 0,
      listos: 0,
      conError: 0,
      pendientes: 0,
      subiendo: 0,
    });
  });
});
