import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  BUCKET_FOTOS,
  obtenerPathsProtegidos,
} from "./rutas";
import {
  contienePath,
  decidirBorradoArchivo,
  quitarFotoPorPath,
  quitarFotoPorUrlExacta,
} from "./referencias";

const URL_BASE = "https://ejemplo.supabase.co";
const PREFIJO_PUBLICO = `${URL_BASE}/storage/v1/object/public/${BUCKET_FOTOS}`;

function url(path: string): string {
  return `${PREFIJO_PUBLICO}/${path}`;
}

describe("quitarFotoPorPath", () => {
  it("quita la entrada con %2F aunque se pida con el path decodificado", () => {
    const fotos = [
      url("3_y_4%2F66.jpeg"),
      url("3_y_4%2F67.jpeg"),
      url("3_y_4%2F68.jpeg"),
    ];

    assert.deepEqual(quitarFotoPorPath(fotos, "3_y_4/67.jpeg"), [
      url("3_y_4%2F66.jpeg"),
      url("3_y_4%2F68.jpeg"),
    ]);
  });

  it("mantiene el orden del resto", () => {
    const fotos = [
      url("1/a.jpeg"),
      url("1/b.jpeg"),
      url("1/c.jpeg"),
      url("1/d.jpeg"),
    ];

    assert.deepEqual(quitarFotoPorPath(fotos, "1/b.jpeg"), [
      url("1/a.jpeg"),
      url("1/c.jpeg"),
      url("1/d.jpeg"),
    ]);
  });

  it("no muta el array original", () => {
    const fotos = [url("1/a.jpeg"), url("1/b.jpeg")];
    const copia = [...fotos];

    quitarFotoPorPath(fotos, "1/a.jpeg");

    assert.deepEqual(fotos, copia);
  });

  it("si el path no está, devuelve una copia igual", () => {
    const fotos = [url("1/a.jpeg"), url("1/b.jpeg")];
    const resultado = quitarFotoPorPath(fotos, "1/otra.jpeg");

    assert.deepEqual(resultado, fotos);
    assert.notEqual(resultado, fotos);
  });

  it("conserva las entradas con URL inválida", () => {
    const fotos = [url("1/a.jpeg"), "esto no es una url"];

    assert.deepEqual(quitarFotoPorPath(fotos, "1/a.jpeg"), [
      "esto no es una url",
    ]);
  });
});

describe("quitarFotoPorUrlExacta", () => {
  it("quita la coincidencia exacta y mantiene el orden del resto", () => {
    const fotos = [
      "https://externo.example/a.jpeg",
      "https://externo.example/b.jpeg",
      "https://externo.example/c.jpeg",
    ];

    assert.deepEqual(quitarFotoPorUrlExacta(fotos, fotos[1]), [
      "https://externo.example/a.jpeg",
      "https://externo.example/c.jpeg",
    ]);
  });

  it("no quita URLs parecidas: barra final, mayúsculas o parámetros", () => {
    const fotos = [
      "https://externo.example/a.jpeg",
      "https://externo.example/a.jpeg/",
      "https://externo.example/A.jpeg",
      "https://externo.example/a.jpeg?x=1",
    ];

    assert.deepEqual(
      quitarFotoPorUrlExacta(fotos, "https://externo.example/a.jpeg"),
      [
        "https://externo.example/a.jpeg/",
        "https://externo.example/A.jpeg",
        "https://externo.example/a.jpeg?x=1",
      ]
    );
  });

  it("quita todas las apariciones repetidas de la URL", () => {
    const repetida = "https://externo.example/a.jpeg";
    const fotos = [repetida, "https://externo.example/b.jpeg", repetida];

    assert.deepEqual(quitarFotoPorUrlExacta(fotos, repetida), [
      "https://externo.example/b.jpeg",
    ]);
  });

  it("no muta el array original", () => {
    const fotos = [
      "https://externo.example/a.jpeg",
      "https://externo.example/b.jpeg",
    ];
    const copia = [...fotos];

    quitarFotoPorUrlExacta(fotos, fotos[0]);

    assert.deepEqual(fotos, copia);
  });

  it("con array vacío o sin coincidencias devuelve el mismo contenido", () => {
    assert.deepEqual(
      quitarFotoPorUrlExacta([], "https://externo.example/a.jpeg"),
      []
    );

    const fotos = [
      "https://externo.example/a.jpeg",
      "https://externo.example/b.jpeg",
    ];
    const resultado = quitarFotoPorUrlExacta(
      fotos,
      "https://externo.example/otra.jpeg"
    );

    assert.deepEqual(resultado, fotos);
    assert.notEqual(resultado, fotos);
  });
});

describe("contienePath", () => {
  it("encuentra el path con la barra codificada y con la literal", () => {
    assert.equal(contienePath([url("3_y_4%2F67.jpeg")], "3_y_4/67.jpeg"), true);
    assert.equal(contienePath([url("3_y_4/67.jpeg")], "3_y_4/67.jpeg"), true);
  });

  it("devuelve false si el path no está o la entrada no es válida", () => {
    assert.equal(contienePath([url("1/a.jpeg")], "1/b.jpeg"), false);
    assert.equal(contienePath(["esto no es una url"], "1/a.jpeg"), false);
  });
});

describe("decidirBorradoArchivo", () => {
  it("borra cuando el archivo solo está en la cabaña actual", () => {
    assert.deepEqual(
      decidirBorradoArchivo({
        path: "cabanas/1/1700000000000-aaaaaaaa.jpeg",
        propiedadIdActual: "1",
        propiedades: [
          { id: "1", fotos: [url("cabanas/1/1700000000000-aaaaaaaa.jpeg")] },
          { id: "2", fotos: [url("cabanas/2/otra.jpeg")] },
        ],
        urlsImagenes: [],
        protegidos: new Set<string>(),
      }),
      { borrar: true }
    );
  });

  it("conserva cuando otra cabaña usa el mismo archivo (carpeta 3_y_4)", () => {
    assert.deepEqual(
      decidirBorradoArchivo({
        path: "3_y_4/67.jpeg",
        propiedadIdActual: "3",
        propiedades: [
          { id: "3", fotos: [url("3_y_4%2F67.jpeg")] },
          { id: "4", fotos: [url("3_y_4/67.jpeg")] },
        ],
        urlsImagenes: [],
        protegidos: new Set<string>(),
      }),
      { borrar: false, motivo: "otra-propiedad" }
    );
  });

  it("conserva cuando la tabla imagenes referencia el archivo", () => {
    assert.deepEqual(
      decidirBorradoArchivo({
        path: "exteriores_pileta_juegos/144.jpeg",
        propiedadIdActual: "1",
        propiedades: [],
        urlsImagenes: [url("exteriores_pileta_juegos%2F144.jpeg")],
        protegidos: new Set<string>(),
      }),
      { borrar: false, motivo: "imagenes" }
    );
  });

  it("conserva lo protegido y la protección gana sobre otra propiedad", () => {
    const protegidos = obtenerPathsProtegidos([
      url("exteriores_pileta_juegos/144.jpeg"),
    ]);

    assert.deepEqual(
      decidirBorradoArchivo({
        path: "exteriores_pileta_juegos/144.jpeg",
        propiedadIdActual: "1",
        propiedades: [
          { id: "2", fotos: [url("exteriores_pileta_juegos/144.jpeg")] },
        ],
        urlsImagenes: [],
        protegidos,
      }),
      { borrar: false, motivo: "protegida" }
    );
  });

  it("ignora la cabaña actual aunque todavía tenga el archivo", () => {
    assert.deepEqual(
      decidirBorradoArchivo({
        path: "1/a.jpeg",
        propiedadIdActual: "1",
        propiedades: [{ id: "1", fotos: [url("1/a.jpeg")] }],
        urlsImagenes: [],
        protegidos: new Set<string>(),
      }),
      { borrar: true }
    );
  });
});
