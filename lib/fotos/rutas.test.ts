import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  BUCKET_FOTOS,
  TAMANO_MAXIMO_BYTES,
  construirUrlPublica,
  esPathProtegido,
  extraerPathDeUrl,
  generarPathNuevo,
  mismaFoto,
  obtenerPathsProtegidos,
  validarArchivoFoto,
  type ResultadoValidacionArchivo,
} from "./rutas";

const URL_BASE = "https://ejemplo.supabase.co";
const PREFIJO_PUBLICO = `${URL_BASE}/storage/v1/object/public/${BUCKET_FOTOS}`;

function errorDe(resultado: ResultadoValidacionArchivo): string {
  if (resultado.ok) {
    assert.fail("Se esperaba un resultado inválido");
  }

  return resultado.error;
}

describe("extraerPathDeUrl", () => {
  it("decodifica la barra codificada como %2F", () => {
    assert.equal(
      extraerPathDeUrl(`${PREFIJO_PUBLICO}/1%2F2.jpeg`),
      "1/2.jpeg"
    );
  });

  it("acepta la barra literal entre carpetas", () => {
    assert.equal(
      extraerPathDeUrl(`${PREFIJO_PUBLICO}/exteriores_pileta_juegos/144.jpeg`),
      "exteriores_pileta_juegos/144.jpeg"
    );
  });

  it("ignora la query string", () => {
    assert.equal(
      extraerPathDeUrl(`${PREFIJO_PUBLICO}/1%2F2.jpeg?t=123`),
      "1/2.jpeg"
    );
  });

  it("devuelve null para una URL de otro bucket", () => {
    assert.equal(
      extraerPathDeUrl(`${URL_BASE}/storage/v1/object/public/otro-bucket/1.jpeg`),
      null
    );
  });

  it("devuelve null si el prefijo aparece pero no al comienzo del pathname", () => {
    assert.equal(
      extraerPathDeUrl(
        `${URL_BASE}/otra/storage/v1/object/public/propiedades-fotos/a.jpeg`
      ),
      null
    );
  });

  it("devuelve null para un string que no es URL", () => {
    assert.equal(extraerPathDeUrl("esto no es una url"), null);
  });

  it("devuelve null cuando el prefijo no tiene path", () => {
    assert.equal(extraerPathDeUrl(`${PREFIJO_PUBLICO}/`), null);
  });

  it("devuelve null cuando el path contiene ..", () => {
    assert.equal(
      extraerPathDeUrl(`${PREFIJO_PUBLICO}/a%2F..%2Fb.jpeg`),
      null
    );
  });

  it("devuelve null cuando el porcentaje está mal formado", () => {
    assert.equal(extraerPathDeUrl(`${PREFIJO_PUBLICO}/%E0%A4%A`), null);
  });

  it("decodifica la carpeta compartida 3_y_4", () => {
    assert.equal(
      extraerPathDeUrl(`${PREFIJO_PUBLICO}/3_y_4%2F67.jpeg`),
      "3_y_4/67.jpeg"
    );
  });
});

describe("construirUrlPublica", () => {
  it("hace ida y vuelta con un nombre con espacio y tilde", () => {
    const path = "cabanas/abc/foto ñandú.jpeg";
    const url = construirUrlPublica(URL_BASE, path);

    assert.equal(
      url,
      `${PREFIJO_PUBLICO}/cabanas/abc/foto%20%C3%B1and%C3%BA.jpeg`
    );
    assert.equal(extraerPathDeUrl(url), path);
  });

  it("da el mismo resultado con y sin barra final en urlBase", () => {
    assert.equal(
      construirUrlPublica(`${URL_BASE}/`, "cabanas/abc/foto.jpeg"),
      construirUrlPublica(URL_BASE, "cabanas/abc/foto.jpeg")
    );
  });

  it("lanza con paths inválidos", () => {
    for (const path of [
      "",
      "/a.jpeg",
      "a.jpeg/",
      "a//b.jpeg",
      "a/../b.jpeg",
      "a/./b.jpeg",
    ]) {
      assert.throws(() => construirUrlPublica(URL_BASE, path));
    }
  });
});

describe("mismaFoto", () => {
  it("reconoce la misma foto con %2F y con barra literal", () => {
    assert.equal(
      mismaFoto(
        `${PREFIJO_PUBLICO}/1%2F2.jpeg`,
        `${PREFIJO_PUBLICO}/1/2.jpeg`
      ),
      true
    );
  });

  it("devuelve false para fotos distintas", () => {
    assert.equal(
      mismaFoto(
        `${PREFIJO_PUBLICO}/1/2.jpeg`,
        `${PREFIJO_PUBLICO}/1/3.jpeg`
      ),
      false
    );
  });

  it("devuelve false si alguna URL es inválida", () => {
    assert.equal(mismaFoto("esto no es una url", `${PREFIJO_PUBLICO}/1/2.jpeg`), false);
    assert.equal(mismaFoto(`${PREFIJO_PUBLICO}/1/2.jpeg`, "esto no es una url"), false);
  });
});

describe("validarArchivoFoto", () => {
  it("acepta jpeg, png y webp", () => {
    for (const tipo of ["image/jpeg", "image/png", "image/webp"]) {
      assert.deepEqual(
        validarArchivoFoto({
          nombre: `foto.${tipo.split("/")[1]}`,
          tipo,
          tamano: 1024,
        }),
        { ok: true }
      );
    }
  });

  it("rechaza gif", () => {
    const error = errorDe(
      validarArchivoFoto({
        nombre: "foto.gif",
        tipo: "image/gif",
        tamano: 1024,
      })
    );

    assert.ok(error.includes("image/gif"));
    assert.ok(error.includes("no está permitido"));
  });

  it("rechaza HEIC con un mensaje específico", () => {
    const esperado =
      "Las fotos HEIC no están soportadas: exportala como JPEG, PNG o WebP";

    assert.deepEqual(
      validarArchivoFoto({
        nombre: "foto.heic",
        tipo: "image/heic",
        tamano: 1024,
      }),
      { ok: false, error: esperado }
    );

    assert.deepEqual(
      validarArchivoFoto({
        nombre: "foto.HEIF",
        tipo: "application/octet-stream",
        tamano: 1024,
      }),
      { ok: false, error: esperado }
    );
  });

  it("rechaza un archivo vacío", () => {
    assert.deepEqual(
      validarArchivoFoto({
        nombre: "foto.jpeg",
        tipo: "image/jpeg",
        tamano: 0,
      }),
      { ok: false, error: "El archivo está vacío" }
    );
  });

  it("acepta exactamente 5 MiB", () => {
    assert.deepEqual(
      validarArchivoFoto({
        nombre: "foto.jpeg",
        tipo: "image/jpeg",
        tamano: TAMANO_MAXIMO_BYTES,
      }),
      { ok: true }
    );
  });

  it("rechaza 5 MiB más un byte e informa el máximo y el peso recibido", () => {
    const error = errorDe(
      validarArchivoFoto({
        nombre: "foto.jpeg",
        tipo: "image/jpeg",
        tamano: TAMANO_MAXIMO_BYTES + 1,
      })
    );

    assert.ok(error.includes("5 MB"));
    assert.ok(error.includes(String(TAMANO_MAXIMO_BYTES + 1)));
  });
});

describe("generarPathNuevo", () => {
  it("genera el path exacto con ahora y sufijo fijos", () => {
    assert.equal(
      generarPathNuevo({
        propiedadId: "abc",
        tipo: "image/jpeg",
        ahora: 1700000000000,
        sufijo: "abcd1234",
      }),
      "cabanas/abc/1700000000000-abcd1234.jpeg"
    );
  });

  it("lanza con propiedadId inválido", () => {
    for (const propiedadId of ["a/b", "a b", "..", ""]) {
      assert.throws(() =>
        generarPathNuevo({
          propiedadId,
          tipo: "image/jpeg",
          ahora: 1,
          sufijo: "abcd1234",
        })
      );
    }
  });

  it("lanza con un tipo no permitido", () => {
    assert.throws(() =>
      generarPathNuevo({
        propiedadId: "abc",
        tipo: "image/gif",
        ahora: 1,
        sufijo: "abcd1234",
      })
    );
  });

  it("genera un path válido sin parámetros opcionales", () => {
    const path = generarPathNuevo({ propiedadId: "abc", tipo: "image/webp" });

    assert.match(
      path,
      /^cabanas\/[A-Za-z0-9_-]+\/\d+-[a-z0-9]{8}\.(jpeg|png|webp)$/
    );
    assert.equal(extraerPathDeUrl(construirUrlPublica(URL_BASE, path)), path);
  });
});

describe("obtenerPathsProtegidos y esPathProtegido", () => {
  it("junta paths decodificados e ignora URLs inválidas", () => {
    const protegidos = obtenerPathsProtegidos([
      `${PREFIJO_PUBLICO}/1%2F2.jpeg`,
      `${PREFIJO_PUBLICO}/exteriores_pileta_juegos/144.jpeg`,
      "esto no es una url",
    ]);

    assert.equal(protegidos.size, 2);
    assert.ok(protegidos.has("1/2.jpeg"));
    assert.ok(protegidos.has("exteriores_pileta_juegos/144.jpeg"));
    assert.equal(esPathProtegido("1/2.jpeg", protegidos), true);
    assert.equal(esPathProtegido("1/3.jpeg", protegidos), false);
  });
});
