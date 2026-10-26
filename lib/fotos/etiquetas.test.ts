import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { clasificarFoto } from "./etiquetas";
import {
  BUCKET_FOTOS,
  obtenerPathsProtegidos,
} from "./rutas";

const URL_BASE = "https://ejemplo.supabase.co";
const PREFIJO_PUBLICO = `${URL_BASE}/storage/v1/object/public/${BUCKET_FOTOS}`;

function url(path: string): string {
  return `${PREFIJO_PUBLICO}/${path}`;
}

describe("clasificarFoto", () => {
  it("no comparte una foto que solo está en la cabaña actual", () => {
    const foto = url("cabanas/1/a.jpeg");

    assert.deepEqual(
      clasificarFoto({
        url: foto,
        propiedadIdActual: "1",
        propiedades: [
          { id: "1", nombre: "Cabaña 1", fotos: [foto] },
          { id: "2", nombre: "Cabaña 2", fotos: [url("cabanas/2/b.jpeg")] },
        ],
        urlsImagenes: [],
        protegidos: new Set<string>(),
      }),
      {
        path: "cabanas/1/a.jpeg",
        compartidaCon: [],
        enGaleriaExteriores: false,
        fijaEnElSitio: false,
        externa: false,
      }
    );
  });

  it("detecta la carpeta compartida 3_y_4 con %2F y con barra literal", () => {
    assert.deepEqual(
      clasificarFoto({
        url: url("3_y_4%2F66.jpeg"),
        propiedadIdActual: "3",
        propiedades: [
          { id: "3", nombre: "Cabaña 3", fotos: [url("3_y_4%2F66.jpeg")] },
          { id: "4", nombre: "Cabaña 4", fotos: [url("3_y_4/66.jpeg")] },
        ],
        urlsImagenes: [],
        protegidos: new Set<string>(),
      }),
      {
        path: "3_y_4/66.jpeg",
        compartidaCon: ["Cabaña 4"],
        enGaleriaExteriores: false,
        fijaEnElSitio: false,
        externa: false,
      }
    );
  });

  it("cuenta una sola vez la cabaña que repite la foto en su array", () => {
    const resultado = clasificarFoto({
      url: url("3_y_4/66.jpeg"),
      propiedadIdActual: "3",
      propiedades: [
        { id: "3", nombre: "Cabaña 3", fotos: [url("3_y_4/66.jpeg")] },
        {
          id: "4",
          nombre: "Cabaña 4",
          fotos: [url("3_y_4%2F66.jpeg"), url("3_y_4/66.jpeg")],
        },
      ],
      urlsImagenes: [],
      protegidos: new Set<string>(),
    });

    assert.deepEqual(resultado.compartidaCon, ["Cabaña 4"]);
  });

  it("devuelve todas las cabañas que comparten la foto en orden", () => {
    const resultado = clasificarFoto({
      url: url("3_y_4/66.jpeg"),
      propiedadIdActual: "3",
      propiedades: [
        { id: "3", nombre: "Cabaña 3", fotos: [url("3_y_4/66.jpeg")] },
        { id: "5", nombre: "Cabaña 5", fotos: [url("3_y_4%2F66.jpeg")] },
        { id: "4", nombre: "Cabaña 4", fotos: [url("3_y_4/66.jpeg")] },
      ],
      urlsImagenes: [],
      protegidos: new Set<string>(),
    });

    assert.deepEqual(resultado.compartidaCon, ["Cabaña 5", "Cabaña 4"]);
  });

  it("no se cuenta a sí misma aunque la cabaña actual esté en propiedades", () => {
    const foto = url("3_y_4%2F66.jpeg");

    const resultado = clasificarFoto({
      url: foto,
      propiedadIdActual: "3",
      propiedades: [
        {
          id: "3",
          nombre: "Cabaña 3",
          fotos: [foto, url("3_y_4/66.jpeg")],
        },
        { id: "4", nombre: "Cabaña 4", fotos: [url("3_y_4/66.jpeg")] },
      ],
      urlsImagenes: [],
      protegidos: new Set<string>(),
    });

    assert.deepEqual(resultado.compartidaCon, ["Cabaña 4"]);
  });

  it("marca la foto que también figura en la galería de exteriores", () => {
    const resultado = clasificarFoto({
      url: url("exteriores_pileta_juegos/144.jpeg"),
      propiedadIdActual: "1",
      propiedades: [],
      urlsImagenes: [url("exteriores_pileta_juegos%2F144.jpeg")],
      protegidos: new Set<string>(),
    });

    assert.equal(resultado.enGaleriaExteriores, true);
  });

  it("marca la foto fija del sitio usando los paths protegidos", () => {
    const protegidos = obtenerPathsProtegidos([
      url("exteriores_pileta_juegos%2F144.jpeg"),
    ]);

    const resultado = clasificarFoto({
      url: url("exteriores_pileta_juegos/144.jpeg"),
      propiedadIdActual: "1",
      propiedades: [],
      urlsImagenes: [],
      protegidos,
    });

    assert.equal(resultado.fijaEnElSitio, true);
  });

  it("marca como externa una URL de otro sitio y no la compara", () => {
    assert.deepEqual(
      clasificarFoto({
        url: "https://otro-sitio.com/fotos/cabana.jpeg",
        propiedadIdActual: "1",
        propiedades: [
          {
            id: "2",
            nombre: "Cabaña 2",
            fotos: [url("cabanas/2/b.jpeg")],
          },
        ],
        urlsImagenes: [url("cabanas/2/b.jpeg")],
        protegidos: new Set<string>(),
      }),
      {
        path: null,
        compartidaCon: [],
        enGaleriaExteriores: false,
        fijaEnElSitio: false,
        externa: true,
      }
    );
  });
});
