import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CabanaCliente } from "../disponibilidad/respuesta-api";
import type { SeleccionEstadia } from "../disponibilidad/seleccion-estadia";
import {
  MENSAJE_NINGUNA_LIBRE,
  TITULO_CABANAS_DISPONIBLES,
  cabanaDesdeParametro,
  mensajeHuespedesCabana,
  mensajeNingunaConCapacidad,
  opcionesParaEstadia,
  type CabanaOpcion,
} from "./cabanas-para-estadia";

// Cabaña tal como la devuelve la API: capacidad y noches bloqueadas.
function cabanaApi(
  id: string,
  capacidad: number,
  bloqueadas: readonly string[] = [],
): CabanaCliente {
  return { id, capacidad, bloqueadas: new Set(bloqueadas) };
}

// Cabaña tal como la lista la página, con su nombre visible.
function propiedad(id: string, nombre: string, capacidad: number): CabanaOpcion {
  return { id, nombre, capacidad };
}

// Selección del calendario con las claves indicadas.
function seleccion(
  ingreso: string | null,
  salida: string | null,
): SeleccionEstadia {
  return { ingreso, salida };
}

describe("opcionesParaEstadia", () => {
  const cabanas = [cabanaApi("cabana-a", 4)];
  const propiedades = [propiedad("cabana-a", "Cabaña A", 4)];

  it("devuelve INCOMPLETO con la selección vacía, solo ingreso o solo salida", () => {
    const incompletas = [
      seleccion(null, null),
      seleccion("2026-11-10", null),
      seleccion(null, "2026-11-13"),
    ];

    for (const incompleta of incompletas) {
      assert.deepEqual(
        opcionesParaEstadia(incompleta, 2, cabanas, propiedades),
        { estado: "INCOMPLETO" },
      );
    }
  });

  it("devuelve INCOMPLETO con claves que no son fechas válidas", () => {
    for (const clave of ["2026-02-30", "abc"]) {
      assert.deepEqual(
        opcionesParaEstadia(seleccion(clave, "2026-11-13"), 2, cabanas, propiedades),
        { estado: "INCOMPLETO" },
        `El ingreso ${clave} debería ser inválido`,
      );
      assert.deepEqual(
        opcionesParaEstadia(seleccion("2026-11-10", clave), 2, cabanas, propiedades),
        { estado: "INCOMPLETO" },
        `La salida ${clave} debería ser inválida`,
      );
    }
  });

  it("devuelve INCOMPLETO con huéspedes 0, -1, 2.5, NaN e Infinity", () => {
    const invalidos = [0, -1, 2.5, Number.NaN, Number.POSITIVE_INFINITY];

    for (const huespedes of invalidos) {
      assert.deepEqual(
        opcionesParaEstadia(
          seleccion("2026-11-10", "2026-11-13"),
          huespedes,
          cabanas,
          propiedades,
        ),
        { estado: "INCOMPLETO" },
        `Los huéspedes ${huespedes} deberían ser inválidos`,
      );
    }
  });

  it("devuelve INCOMPLETO si la salida no es posterior al ingreso", () => {
    for (const salida of ["2026-11-10", "2026-11-09"]) {
      assert.deepEqual(
        opcionesParaEstadia(
          seleccion("2026-11-10", salida),
          2,
          cabanas,
          propiedades,
        ),
        { estado: "INCOMPLETO" },
        `La salida ${salida} no debería ser válida`,
      );
    }
  });

  it("devuelve INCOMPLETO con 31 noches y OK con exactamente 30", () => {
    assert.deepEqual(
      opcionesParaEstadia(
        seleccion("2026-11-01", "2026-12-02"),
        2,
        cabanas,
        propiedades,
      ),
      { estado: "INCOMPLETO" },
    );
    assert.deepEqual(
      opcionesParaEstadia(
        seleccion("2026-11-01", "2026-12-01"),
        2,
        cabanas,
        propiedades,
      ),
      {
        estado: "OK",
        opciones: [propiedad("cabana-a", "Cabaña A", 4)],
      },
    );
  });

  it("devuelve todas las cabañas libres con capacidad en el orden de propiedades", () => {
    // La API y la página llegan en órdenes distintos: manda el de la página.
    const deLaApi = [
      cabanaApi("cabana-b", 6),
      cabanaApi("cabana-a", 4),
      cabanaApi("cabana-c", 2),
    ];
    const deLaPagina = [
      propiedad("cabana-c", "Cabaña C", 2),
      propiedad("cabana-a", "Cabaña A", 4),
      propiedad("cabana-b", "Cabaña B", 6),
    ];

    assert.deepEqual(
      opcionesParaEstadia(
        seleccion("2026-11-10", "2026-11-13"),
        2,
        deLaApi,
        deLaPagina,
      ),
      {
        estado: "OK",
        opciones: [
          propiedad("cabana-c", "Cabaña C", 2),
          propiedad("cabana-a", "Cabaña A", 4),
          propiedad("cabana-b", "Cabaña B", 6),
        ],
      },
    );
  });

  it("no ofrece cabañas con una noche ocupada dentro de [ingreso, salida)", () => {
    const deLaApi = [
      cabanaApi("cabana-a", 4, ["2026-11-11"]),
      cabanaApi("cabana-b", 4, ["2026-11-10"]),
      cabanaApi("cabana-c", 4, ["2026-11-13"]),
      cabanaApi("cabana-d", 4),
    ];
    const deLaPagina = [
      propiedad("cabana-a", "Cabaña A", 4),
      propiedad("cabana-b", "Cabaña B", 4),
      propiedad("cabana-c", "Cabaña C", 4),
      propiedad("cabana-d", "Cabaña D", 4),
    ];

    assert.deepEqual(
      opcionesParaEstadia(
        seleccion("2026-11-10", "2026-11-13"),
        2,
        deLaApi,
        deLaPagina,
      ),
      {
        estado: "OK",
        // La noche del día de salida no cuenta: C sigue libre.
        opciones: [
          propiedad("cabana-c", "Cabaña C", 4),
          propiedad("cabana-d", "Cabaña D", 4),
        ],
      },
    );
  });

  it("devuelve NINGUNA_LIBRE si A está bloqueada el 11 y B el 12, aunque cada noche tenga una libre", () => {
    const cabanaA = cabanaApi("cabana-a", 4, ["2026-11-11"]);
    const cabanaB = cabanaApi("cabana-b", 4, ["2026-11-12"]);
    const deLaPagina = [
      propiedad("cabana-a", "Cabaña A", 4),
      propiedad("cabana-b", "Cabaña B", 4),
    ];

    // Cada noche del 10 al 12 tiene al menos una cabaña libre, pero ninguna
    // cabaña está libre todas las noches.
    for (const noche of ["2026-11-10", "2026-11-11", "2026-11-12"]) {
      const libres = [cabanaA, cabanaB].filter(
        (cabana) => !cabana.bloqueadas.has(noche),
      );
      assert.ok(
        libres.length >= 1,
        `La noche ${noche} debería tener alguna cabaña libre`,
      );
    }

    assert.deepEqual(
      opcionesParaEstadia(
        seleccion("2026-11-10", "2026-11-13"),
        2,
        [cabanaA, cabanaB],
        deLaPagina,
      ),
      {
        estado: "NINGUNA_LIBRE",
        mensaje: "Ninguna cabaña está libre en esas fechas, probá con otro rango.",
      },
    );
  });

  it("devuelve NINGUNA_CON_CAPACIDAD con la mayor capacidad libre cuando ninguna alcanza los 7 huéspedes", () => {
    const deLaApi = [cabanaApi("cabana-a", 2), cabanaApi("cabana-b", 3)];
    const deLaPagina = [
      propiedad("cabana-a", "Cabaña A", 2),
      propiedad("cabana-b", "Cabaña B", 3),
    ];

    assert.deepEqual(
      opcionesParaEstadia(
        seleccion("2026-11-10", "2026-11-13"),
        7,
        deLaApi,
        deLaPagina,
      ),
      {
        estado: "NINGUNA_CON_CAPACIDAD",
        mensaje:
          "Ninguno de los alojamientos disponibles tiene capacidad para más de 3 personas.",
      },
    );
  });

  it("informa la capacidad de la única cabaña libre", () => {
    const deLaApi = [cabanaApi("cabana-a", 2)];
    const deLaPagina = [propiedad("cabana-a", "Cabaña A", 2)];

    assert.deepEqual(
      opcionesParaEstadia(
        seleccion("2026-11-10", "2026-11-13"),
        4,
        deLaApi,
        deLaPagina,
      ),
      {
        estado: "NINGUNA_CON_CAPACIDAD",
        mensaje:
          "Ninguno de los alojamientos disponibles tiene capacidad para más de 2 personas.",
      },
    );
  });

  it("usa el singular cuando la mayor capacidad libre es 1", () => {
    const deLaApi = [cabanaApi("cabana-a", 1)];
    const deLaPagina = [propiedad("cabana-a", "Cabaña A", 1)];

    assert.deepEqual(
      opcionesParaEstadia(
        seleccion("2026-11-10", "2026-11-13"),
        2,
        deLaApi,
        deLaPagina,
      ),
      {
        estado: "NINGUNA_CON_CAPACIDAD",
        mensaje:
          "Ninguno de los alojamientos disponibles tiene capacidad para más de 1 persona.",
      },
    );
  });

  it("toma la mayor capacidad entre las libres y no la capacidad global mayor", () => {
    // Cabaña C tiene la capacidad más alta de la página, pero está ocupada.
    const deLaApi = [
      cabanaApi("cabana-a", 2),
      cabanaApi("cabana-b", 3),
      cabanaApi("cabana-c", 8, ["2026-11-11"]),
    ];
    const deLaPagina = [
      propiedad("cabana-a", "Cabaña A", 2),
      propiedad("cabana-b", "Cabaña B", 3),
      propiedad("cabana-c", "Cabaña C", 8),
    ];

    assert.deepEqual(
      opcionesParaEstadia(
        seleccion("2026-11-10", "2026-11-13"),
        5,
        deLaApi,
        deLaPagina,
      ),
      {
        estado: "NINGUNA_CON_CAPACIDAD",
        mensaje:
          "Ninguno de los alojamientos disponibles tiene capacidad para más de 3 personas.",
      },
    );
  });

  it("da OK cuando los huéspedes igualan la mayor capacidad libre", () => {
    const deLaApi = [cabanaApi("cabana-a", 2), cabanaApi("cabana-b", 3)];
    const deLaPagina = [
      propiedad("cabana-a", "Cabaña A", 2),
      propiedad("cabana-b", "Cabaña B", 3),
    ];

    assert.deepEqual(
      opcionesParaEstadia(
        seleccion("2026-11-10", "2026-11-13"),
        3,
        deLaApi,
        deLaPagina,
      ),
      {
        estado: "OK",
        opciones: [propiedad("cabana-b", "Cabaña B", 3)],
      },
    );
  });

  it("con una cabaña libre y otra ocupada de mayor capacidad informa solo la libre", () => {
    // Verificado en cabanas.ts: primero se filtran las libres y recién después
    // la capacidad entre las libres. Como A queda libre, no es NINGUNA_LIBRE y
    // la capacidad de B (ocupada) no cuenta para el mensaje.
    const deLaApi = [
      cabanaApi("cabana-a", 2),
      cabanaApi("cabana-b", 8, ["2026-11-11"]),
    ];
    const deLaPagina = [
      propiedad("cabana-a", "Cabaña A", 2),
      propiedad("cabana-b", "Cabaña B", 8),
    ];

    assert.deepEqual(
      opcionesParaEstadia(
        seleccion("2026-11-10", "2026-11-13"),
        5,
        deLaApi,
        deLaPagina,
      ),
      {
        estado: "NINGUNA_CON_CAPACIDAD",
        mensaje:
          "Ninguno de los alojamientos disponibles tiene capacidad para más de 2 personas.",
      },
    );
  });

  it("ignora las cabañas de la API que no están en propiedades", () => {
    const deLaApi = [
      cabanaApi("cabana-a", 4),
      cabanaApi("cabana-huerfana", 6),
    ];
    const deLaPagina = [propiedad("cabana-a", "Cabaña A", 4)];

    assert.deepEqual(
      opcionesParaEstadia(
        seleccion("2026-11-10", "2026-11-13"),
        2,
        deLaApi,
        deLaPagina,
      ),
      {
        estado: "OK",
        opciones: [propiedad("cabana-a", "Cabaña A", 4)],
      },
    );
  });

  it("ignora las propiedades sin datos en la API", () => {
    const deLaApi = [cabanaApi("cabana-a", 4)];
    const deLaPagina = [
      propiedad("cabana-a", "Cabaña A", 4),
      propiedad("cabana-sin-datos", "Cabaña Sin Datos", 6),
    ];

    assert.deepEqual(
      opcionesParaEstadia(
        seleccion("2026-11-10", "2026-11-13"),
        2,
        deLaApi,
        deLaPagina,
      ),
      {
        estado: "OK",
        opciones: [propiedad("cabana-a", "Cabaña A", 4)],
      },
    );
  });

  it("devuelve NINGUNA_LIBRE si no hay cabañas en común", () => {
    assert.deepEqual(
      opcionesParaEstadia(
        seleccion("2026-11-10", "2026-11-13"),
        2,
        [cabanaApi("cabana-a", 4)],
        [propiedad("cabana-b", "Cabaña B", 4)],
      ),
      {
        estado: "NINGUNA_LIBRE",
        mensaje: "Ninguna cabaña está libre en esas fechas, probá con otro rango.",
      },
    );
  });

  it("devuelve NINGUNA_LIBRE si la API no devuelve cabañas", () => {
    assert.deepEqual(
      opcionesParaEstadia(
        seleccion("2026-11-10", "2026-11-13"),
        2,
        [],
        [propiedad("cabana-a", "Cabaña A", 4)],
      ),
      {
        estado: "NINGUNA_LIBRE",
        mensaje: "Ninguna cabaña está libre en esas fechas, probá con otro rango.",
      },
    );
  });

  it("mantiene NINGUNA_LIBRE y OK igual que antes del cambio de mensaje", () => {
    // NINGUNA_LIBRE: la única cabaña está ocupada en una noche del rango.
    assert.deepEqual(
      opcionesParaEstadia(
        seleccion("2026-11-10", "2026-11-13"),
        2,
        [cabanaApi("cabana-a", 4, ["2026-11-10"])],
        [propiedad("cabana-a", "Cabaña A", 4)],
      ),
      { estado: "NINGUNA_LIBRE", mensaje: MENSAJE_NINGUNA_LIBRE },
    );

    // OK: hay una cabaña libre con capacidad suficiente.
    assert.deepEqual(
      opcionesParaEstadia(
        seleccion("2026-11-10", "2026-11-13"),
        4,
        [cabanaApi("cabana-a", 4)],
        [propiedad("cabana-a", "Cabaña A", 4)],
      ),
      {
        estado: "OK",
        opciones: [propiedad("cabana-a", "Cabaña A", 4)],
      },
    );
  });

  it("toma la capacidad de la API cuando difiere de propiedades", () => {
    const deLaApi = [cabanaApi("cabana-a", 6)];
    const deLaPagina = [propiedad("cabana-a", "Cabaña A", 2)];

    assert.deepEqual(
      opcionesParaEstadia(
        seleccion("2026-11-10", "2026-11-13"),
        4,
        deLaApi,
        deLaPagina,
      ),
      {
        estado: "OK",
        opciones: [propiedad("cabana-a", "Cabaña A", 6)],
      },
    );

    // La capacidad de la API también manda al filtrar por huéspedes.
    assert.deepEqual(
      opcionesParaEstadia(
        seleccion("2026-11-10", "2026-11-13"),
        4,
        [cabanaApi("cabana-a", 2)],
        [propiedad("cabana-a", "Cabaña A", 6)],
      ),
      {
        estado: "NINGUNA_CON_CAPACIDAD",
        mensaje:
          "Ninguno de los alojamientos disponibles tiene capacidad para más de 2 personas.",
      },
    );
  });

  it("no muta arreglos, cabañas ni conjuntos congelados", () => {
    const bloqueadasOcupada = Object.freeze(new Set(["2026-11-11"]));
    const ocupada = Object.freeze({
      id: "cabana-ocupada",
      capacidad: 6,
      bloqueadas: bloqueadasOcupada,
    });
    const bloqueadasLibre = Object.freeze(new Set<string>());
    const libre = Object.freeze({
      id: "cabana-libre",
      capacidad: 4,
      bloqueadas: bloqueadasLibre,
    });
    const deLaApi = Object.freeze([ocupada, libre]);
    const deLaPagina = Object.freeze([
      Object.freeze(propiedad("cabana-ocupada", "Cabaña Ocupada", 6)),
      Object.freeze(propiedad("cabana-libre", "Cabaña Libre", 4)),
    ]);

    assert.deepEqual(
      opcionesParaEstadia(
        seleccion("2026-11-10", "2026-11-13"),
        2,
        deLaApi,
        deLaPagina,
      ),
      {
        estado: "OK",
        opciones: [propiedad("cabana-libre", "Cabaña Libre", 4)],
      },
    );

    assert.equal(deLaApi.length, 2);
    assert.equal(deLaApi[0], ocupada);
    assert.equal(deLaApi[1], libre);
    assert.equal(deLaPagina.length, 2);
    assert.equal(bloqueadasOcupada.size, 1);
    assert.deepEqual([...bloqueadasOcupada], ["2026-11-11"]);
    assert.equal(bloqueadasLibre.size, 0);
  });
});

describe("textos del desplegable", () => {
  it("expone el título exacto del desplegable", () => {
    assert.equal(
      TITULO_CABANAS_DISPONIBLES,
      "Cabañas disponibles para tu estadía:",
    );
  });

  it("expone el aviso exacto de ninguna cabaña libre", () => {
    assert.equal(
      MENSAJE_NINGUNA_LIBRE,
      "Ninguna cabaña está libre en esas fechas, probá con otro rango.",
    );
  });

  it("concuerda el singular y el plural de mensajeNingunaConCapacidad", () => {
    assert.equal(
      mensajeNingunaConCapacidad(1),
      "Ninguno de los alojamientos disponibles tiene capacidad para más de 1 persona.",
    );
    assert.equal(
      mensajeNingunaConCapacidad(7),
      "Ninguno de los alojamientos disponibles tiene capacidad para más de 7 personas.",
    );
  });
});

describe("cabanaDesdeParametro", () => {
  const propiedades = [
    propiedad("cabana-a", "Cabaña A", 4),
    propiedad("cabana-b", "Cabaña B", 2),
  ];

  it("devuelve null si el parámetro falta, está vacío o son solo espacios", () => {
    for (const valor of [undefined, "", "   "]) {
      assert.equal(cabanaDesdeParametro(valor, propiedades), null);
    }
  });

  it("devuelve null si el arreglo de valores está vacío", () => {
    assert.equal(cabanaDesdeParametro([], propiedades), null);
  });

  it("devuelve null si el id no existe o no coincide exactamente", () => {
    for (const valor of ["cabana-inexistente", "CABANA-A", "Cabana-A"]) {
      assert.equal(cabanaDesdeParametro(valor, propiedades), null);
    }
  });

  it("devuelve el id cuando coincide exactamente, con o sin espacios alrededor", () => {
    assert.equal(cabanaDesdeParametro("cabana-a", propiedades), "cabana-a");
    assert.equal(
      cabanaDesdeParametro("  cabana-a  ", propiedades),
      "cabana-a",
    );
  });

  it("con un arreglo usa solo el primer elemento", () => {
    assert.equal(
      cabanaDesdeParametro(["cabana-a", "cabana-b"], propiedades),
      "cabana-a",
    );
    assert.equal(
      cabanaDesdeParametro(["cabana-inexistente", "cabana-a"], propiedades),
      null,
    );
  });

  it("devuelve null si la lista de propiedades está vacía", () => {
    assert.equal(cabanaDesdeParametro("cabana-a", []), null);
  });
});

describe("mensajeHuespedesCabana", () => {
  it("devuelve null con huéspedes entre 1 y la capacidad inclusive", () => {
    assert.equal(mensajeHuespedesCabana(1, 1), null);
    assert.equal(mensajeHuespedesCabana(4, 4), null);
    assert.equal(mensajeHuespedesCabana(3, 4), null);
  });

  it("pide una cantidad válida con 0, -1, 2.5, NaN e Infinity", () => {
    const invalidos = [0, -1, 2.5, Number.NaN, Number.POSITIVE_INFINITY];

    for (const huespedes of invalidos) {
      assert.equal(
        mensajeHuespedesCabana(huespedes, 4),
        "Indicá una cantidad de huéspedes válida.",
        `Los huéspedes ${huespedes} deberían ser inválidos`,
      );
    }
  });

  it("menciona la capacidad real cuando se supera en uno", () => {
    assert.equal(
      mensajeHuespedesCabana(5, 4),
      "Esta cabaña admite hasta 4 huéspedes.",
    );
  });

  it("usa el singular cuando la capacidad es 1", () => {
    assert.equal(
      mensajeHuespedesCabana(2, 1),
      "Esta cabaña admite hasta 1 huésped.",
    );
  });
});
