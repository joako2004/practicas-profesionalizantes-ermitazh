import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { cabanasLibresParaRango } from "./cabanas";
import {
  VENTANA_DIAS,
  aCabanasDisponibilidad,
  armarDisponibilidad,
  calcularVentana,
} from "./dto";
import { aClaveFecha, deClaveFecha, sumarDias } from "./noches";

// Construye el día indicado (clave "AAAA-MM-DD") a medianoche UTC.
function fecha(clave: string): Date {
  const dia = deClaveFecha(clave);
  if (dia === null) {
    throw new Error(`La clave ${clave} debería ser válida`);
  }
  return dia;
}

// Construye un instante UTC exacto, sin depender de la zona del sistema.
function instante(
  anio: number,
  mes: number,
  dia: number,
  hora = 0,
  minuto = 0,
  segundo = 0,
  milisegundo = 0,
): Date {
  return new Date(
    Date.UTC(anio, mes - 1, dia, hora, minuto, segundo, milisegundo),
  );
}

// Arma una ventana de prueba a partir de dos claves.
function ventanaDe(
  desde: string,
  hasta: string,
): { desde: Date; hasta: Date } {
  return { desde: fecha(desde), hasta: fecha(hasta) };
}

describe("calcularVentana", () => {
  it("por defecto cubre VENTANA_DIAS noches con hasta inclusivo", () => {
    const { desde, hasta } = calcularVentana(fecha("2026-10-31"));

    assert.equal(VENTANA_DIAS, 548);
    assert.equal(aClaveFecha(desde), "2026-10-31");
    assert.equal(
      hasta.getTime(),
      sumarDias(desde, VENTANA_DIAS - 1).getTime(),
    );
  });

  it("con dias = 1, desde y hasta son el mismo día", () => {
    const { desde, hasta } = calcularVentana(fecha("2026-10-31"), 1);

    assert.equal(aClaveFecha(desde), "2026-10-31");
    assert.equal(aClaveFecha(hasta), "2026-10-31");
    assert.equal(desde.getTime(), hasta.getTime());
  });

  it("normaliza hoy a la medianoche UTC de su día UTC", () => {
    const { desde, hasta } = calcularVentana(
      instante(2026, 10, 31, 15, 30, 45, 123),
      2,
    );

    assert.equal(aClaveFecha(desde), "2026-10-31");
    assert.equal(desde.getUTCHours(), 0);
    assert.equal(desde.getUTCMinutes(), 0);
    assert.equal(desde.getUTCSeconds(), 0);
    assert.equal(desde.getUTCMilliseconds(), 0);
    assert.equal(aClaveFecha(hasta), "2026-11-01");
  });

  it("no muta la fecha de hoy", () => {
    const hoy = instante(2026, 10, 31, 15, 30, 45, 123);
    const antes = hoy.getTime();

    calcularVentana(hoy);

    assert.equal(hoy.getTime(), antes);
  });

  it("lanza RangeError con cantidades de días inválidas", () => {
    const invalidas = [0, -3, 1.5, Number.NaN, Number.POSITIVE_INFINITY];

    for (const dias of invalidas) {
      assert.throws(
        () => calcularVentana(fecha("2026-10-31"), dias),
        RangeError,
        `dias = ${dias} debería ser inválido`,
      );
    }
  });

  it("lanza RangeError si hoy es inválida", () => {
    assert.throws(() => calcularVentana(new Date(Number.NaN)), RangeError);
  });

  it("atraviesa el fin de año y el febrero bisiesto de 2028", () => {
    assert.equal(
      aClaveFecha(calcularVentana(fecha("2027-12-31"), 3).hasta),
      "2028-01-02",
    );
    assert.equal(
      aClaveFecha(calcularVentana(fecha("2028-02-27"), 3).hasta),
      "2028-02-29",
    );
    assert.equal(
      aClaveFecha(calcularVentana(fecha("2028-02-28"), 2).hasta),
      "2028-02-29",
    );
    assert.equal(
      aClaveFecha(calcularVentana(fecha("2028-02-28"), 3).hasta),
      "2028-03-01",
    );
  });
});

describe("armarDisponibilidad", () => {
  it("incluye una cabaña activa sin filas con bloqueadas vacío", () => {
    const dto = armarDisponibilidad(
      [{ id: "a", capacidad: 2 }],
      [],
      ventanaDe("2026-11-10", "2026-11-12"),
    );

    assert.deepEqual(dto.cabanas, [
      { id: "a", capacidad: 2, bloqueadas: [] },
    ]);
  });

  it("ordena las noches bloqueadas aunque lleguen desordenadas", () => {
    const dto = armarDisponibilidad(
      [{ id: "a", capacidad: 2 }],
      [
        { propiedadId: "a", fecha: fecha("2026-11-12") },
        { propiedadId: "a", fecha: fecha("2026-11-10") },
        { propiedadId: "a", fecha: fecha("2026-11-11") },
      ],
      ventanaDe("2026-11-10", "2026-11-12"),
    );

    assert.deepEqual(dto.cabanas[0].bloqueadas, [
      "2026-11-10",
      "2026-11-11",
      "2026-11-12",
    ]);
  });

  it("colapsa las noches repetidas", () => {
    const dto = armarDisponibilidad(
      [{ id: "a", capacidad: 2 }],
      [
        { propiedadId: "a", fecha: fecha("2026-11-11") },
        { propiedadId: "a", fecha: fecha("2026-11-11") },
        { propiedadId: "a", fecha: fecha("2026-11-11") },
      ],
      ventanaDe("2026-11-10", "2026-11-12"),
    );

    assert.deepEqual(dto.cabanas[0].bloqueadas, ["2026-11-11"]);
  });

  it("incluye los extremos de la ventana y excluye lo de afuera", () => {
    const dto = armarDisponibilidad(
      [{ id: "a", capacidad: 2 }],
      [
        { propiedadId: "a", fecha: fecha("2026-11-09") },
        { propiedadId: "a", fecha: fecha("2026-11-10") },
        { propiedadId: "a", fecha: fecha("2026-11-12") },
        { propiedadId: "a", fecha: fecha("2026-11-13") },
      ],
      ventanaDe("2026-11-10", "2026-11-12"),
    );

    assert.deepEqual(dto.cabanas[0].bloqueadas, [
      "2026-11-10",
      "2026-11-12",
    ]);
  });

  it("ignora las filas de propiedades que no están en la lista", () => {
    const dto = armarDisponibilidad(
      [{ id: "a", capacidad: 2 }],
      [
        { propiedadId: "a", fecha: fecha("2026-11-11") },
        { propiedadId: "inactiva", fecha: fecha("2026-11-11") },
      ],
      ventanaDe("2026-11-10", "2026-11-12"),
    );

    assert.deepEqual(dto.cabanas, [
      { id: "a", capacidad: 2, bloqueadas: ["2026-11-11"] },
    ]);
  });

  it("ignora las fechas inválidas sin romper", () => {
    const dto = armarDisponibilidad(
      [{ id: "a", capacidad: 2 }],
      [
        { propiedadId: "a", fecha: new Date(Number.NaN) },
        { propiedadId: "a", fecha: new Date("no-es-una-fecha") },
        { propiedadId: "a", fecha: fecha("2026-11-11") },
      ],
      ventanaDe("2026-11-10", "2026-11-12"),
    );

    assert.deepEqual(dto.cabanas[0].bloqueadas, ["2026-11-11"]);
  });

  it("respeta el orden de entrada de las propiedades", () => {
    const dto = armarDisponibilidad(
      [
        { id: "b", capacidad: 4 },
        { id: "a", capacidad: 2 },
        { id: "c", capacidad: 6 },
      ],
      [],
      ventanaDe("2026-11-10", "2026-11-12"),
    );

    assert.deepEqual(
      dto.cabanas.map((cabana) => cabana.id),
      ["b", "a", "c"],
    );
  });

  it("con propiedades vacío devuelve cabanas vacío", () => {
    const dto = armarDisponibilidad(
      [],
      [{ propiedadId: "a", fecha: fecha("2026-11-11") }],
      ventanaDe("2026-11-10", "2026-11-12"),
    );

    assert.deepEqual(dto.cabanas, []);
  });

  it("no muta las propiedades ni las filas de entrada", () => {
    const propiedades = [
      { id: "a", capacidad: 2 },
      { id: "b", capacidad: 4 },
    ];
    const filas = [
      { propiedadId: "b", fecha: fecha("2026-11-12") },
      { propiedadId: "a", fecha: fecha("2026-11-10") },
    ];
    const propiedadesAntes = propiedades.map((una) => ({ ...una }));
    const filasAntes = filas.map((fila) => ({
      propiedadId: fila.propiedadId,
      instante: fila.fecha.getTime(),
    }));

    armarDisponibilidad(propiedades, filas, ventanaDe("2026-11-10", "2026-11-12"));

    assert.deepEqual(propiedades, propiedadesAntes);
    assert.deepEqual(
      filas.map((fila) => ({
        propiedadId: fila.propiedadId,
        instante: fila.fecha.getTime(),
      })),
      filasAntes,
    );
  });

  it("lanza RangeError si la ventana es inválida o está invertida", () => {
    const propiedades = [{ id: "a", capacidad: 2 }];

    assert.throws(
      () =>
        armarDisponibilidad(propiedades, [], {
          desde: new Date(Number.NaN),
          hasta: fecha("2026-11-12"),
        }),
      RangeError,
    );
    assert.throws(
      () =>
        armarDisponibilidad(propiedades, [], {
          desde: fecha("2026-11-10"),
          hasta: new Date(Number.NaN),
        }),
      RangeError,
    );
    assert.throws(
      () =>
        armarDisponibilidad(
          propiedades,
          [],
          ventanaDe("2026-11-12", "2026-11-10"),
        ),
      RangeError,
    );
  });

  it("devuelve la ventana en formato AAAA-MM-DD", () => {
    const dto = armarDisponibilidad(
      [],
      [],
      ventanaDe("2026-11-10", "2026-11-12"),
    );

    assert.equal(dto.ventana.desde, "2026-11-10");
    assert.equal(dto.ventana.hasta, "2026-11-12");
    assert.match(dto.ventana.desde, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(dto.ventana.hasta, /^\d{4}-\d{2}-\d{2}$/);
  });

  it("expone solo las claves públicas del DTO", () => {
    const dto = armarDisponibilidad(
      [{ id: "a", capacidad: 2 }],
      [{ propiedadId: "a", fecha: fecha("2026-11-11") }],
      ventanaDe("2026-11-10", "2026-11-12"),
    );

    assert.deepEqual(Object.keys(dto).sort(), ["cabanas", "ventana"]);
    assert.deepEqual(Object.keys(dto.ventana).sort(), ["desde", "hasta"]);
    assert.deepEqual(Object.keys(dto.cabanas[0]).sort(), [
      "bloqueadas",
      "capacidad",
      "id",
    ]);
  });
});

describe("aCabanasDisponibilidad", () => {
  it("convierte cada bloqueadas a Set y conserva id y capacidad", () => {
    const dto = armarDisponibilidad(
      [{ id: "a", capacidad: 4 }],
      [
        { propiedadId: "a", fecha: fecha("2026-11-11") },
        { propiedadId: "a", fecha: fecha("2026-11-12") },
      ],
      ventanaDe("2026-11-10", "2026-11-12"),
    );

    const cabanas = aCabanasDisponibilidad(dto);

    assert.equal(cabanas.length, 1);
    assert.equal(cabanas[0].id, "a");
    assert.equal(cabanas[0].capacidad, 4);
    assert.ok(cabanas[0].bloqueadas instanceof Set);
    assert.deepEqual([...cabanas[0].bloqueadas], [
      "2026-11-11",
      "2026-11-12",
    ]);
  });

  it("no devuelve ninguna cabaña libre si cada noche está bloqueada en una distinta", () => {
    const dto = armarDisponibilidad(
      [
        { id: "a", capacidad: 2 },
        { id: "b", capacidad: 2 },
      ],
      [
        { propiedadId: "a", fecha: fecha("2026-11-11") },
        { propiedadId: "b", fecha: fecha("2026-11-12") },
      ],
      ventanaDe("2026-11-10", "2026-11-12"),
    );

    const resultado = cabanasLibresParaRango(
      fecha("2026-11-10"),
      fecha("2026-11-13"),
      1,
      aCabanasDisponibilidad(dto),
    );

    if (resultado.ok) {
      assert.fail("Se esperaba NINGUNA_LIBRE");
    }
    assert.equal(resultado.motivo, "NINGUNA_LIBRE");
  });

  it("devuelve solo la tercera cabaña cuando está libre todo el rango", () => {
    const dto = armarDisponibilidad(
      [
        { id: "a", capacidad: 2 },
        { id: "b", capacidad: 2 },
        { id: "c", capacidad: 2 },
      ],
      [
        { propiedadId: "a", fecha: fecha("2026-11-11") },
        { propiedadId: "b", fecha: fecha("2026-11-12") },
      ],
      ventanaDe("2026-11-10", "2026-11-12"),
    );

    const resultado = cabanasLibresParaRango(
      fecha("2026-11-10"),
      fecha("2026-11-13"),
      1,
      aCabanasDisponibilidad(dto),
    );

    if (!resultado.ok) {
      assert.fail(`Se esperaba una cabaña libre, se recibió ${resultado.motivo}`);
    }
    assert.deepEqual(
      resultado.cabanas.map((cabana) => cabana.id),
      ["c"],
    );
  });
});
