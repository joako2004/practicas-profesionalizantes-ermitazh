import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { NOCHES_MAX } from "../precios/calcular";
import {
  agruparNochesPorCabana,
  cabanasLibresParaRango,
  nochesOcupadasEnTodas,
  type CabanaDisponibilidad,
  type ResultadoCabanasLibres,
} from "./cabanas";
import {
  deClaveFecha,
  deTextoFecha,
  nochesDeRango,
} from "./noches";

// Construye el día indicado (clave "AAAA-MM-DD") a medianoche UTC.
function fecha(clave: string): Date {
  const dia = deClaveFecha(clave);
  if (dia === null) {
    throw new Error(`La clave ${clave} debería ser válida`);
  }
  return dia;
}

// Construye el día indicado en texto visible "DD/MM/AAAA" a medianoche UTC.
function fechaDeTexto(texto: string): Date {
  const dia = deTextoFecha(texto);
  if (dia === null) {
    throw new Error(`El texto ${texto} debería ser válido`);
  }
  return dia;
}

// Cabaña de prueba con un campo extra para comprobar la genericidad.
type CabanaDePrueba = CabanaDisponibilidad & { nombre: string };

// Construye una cabaña de prueba a partir de sus noches bloqueadas.
function cabana(
  id: string,
  nombre: string,
  capacidad: number,
  bloqueadas: readonly string[],
): CabanaDePrueba {
  return { id, nombre, capacidad, bloqueadas: new Set(bloqueadas) };
}

// Falla el test con un mensaje claro si el resultado no es ok.
function exigirOk<T extends CabanaDisponibilidad>(
  resultado: ResultadoCabanasLibres<T>,
): T[] {
  if (!resultado.ok) {
    throw new Error(`Se esperaba un resultado ok, se recibió ${resultado.motivo}`);
  }
  return resultado.cabanas;
}

// Indica si una cabaña sirve para las noches y huéspedes indicados.
function sirve(
  cabanaEvaluada: CabanaDisponibilidad,
  noches: readonly string[],
  huespedes: number,
): boolean {
  return (
    cabanaEvaluada.capacidad >= huespedes &&
    noches.every((clave) => !cabanaEvaluada.bloqueadas.has(clave))
  );
}

describe("agruparNochesPorCabana", () => {
  it("agrupa varias cabañas por propiedadId", () => {
    const filas = [
      { propiedadId: "a", fecha: fecha("2026-10-10") },
      { propiedadId: "b", fecha: fecha("2026-10-11") },
      { propiedadId: "a", fecha: fecha("2026-10-12") },
    ];

    const agrupadas = agruparNochesPorCabana(filas);

    assert.equal(agrupadas.size, 2);
    assert.deepEqual([...(agrupadas.get("a") ?? [])].sort(), ["2026-10-10", "2026-10-12"]);
    assert.deepEqual([...(agrupadas.get("b") ?? [])].sort(), ["2026-10-11"]);
  });

  it("colapsa las claves repetidas de una misma cabaña", () => {
    const filas = [
      { propiedadId: "a", fecha: fecha("2026-10-10") },
      { propiedadId: "a", fecha: fecha("2026-10-10") },
      { propiedadId: "a", fecha: fecha("2026-10-10") },
    ];

    const agrupadas = agruparNochesPorCabana(filas);

    assert.deepEqual([...(agrupadas.get("a") ?? [])], ["2026-10-10"]);
  });

  it("ignora las filas con fecha inválida y no crea la cabaña", () => {
    const filas = [
      { propiedadId: "a", fecha: new Date("x") },
      { propiedadId: "b", fecha: fecha("2026-10-11") },
    ];

    const agrupadas = agruparNochesPorCabana(filas);

    assert.equal(agrupadas.has("a"), false);
    assert.deepEqual([...(agrupadas.get("b") ?? [])], ["2026-10-11"]);
  });

  it("devuelve un Map vacío para una lista vacía", () => {
    const agrupadas = agruparNochesPorCabana([]);

    assert.ok(agrupadas instanceof Map);
    assert.equal(agrupadas.size, 0);
  });

  it("no muta las filas ni sus fechas", () => {
    const filas = [
      { propiedadId: "a", fecha: fecha("2026-10-10") },
      { propiedadId: "a", fecha: fecha("2026-10-11") },
    ];
    const instantes = filas.map((fila) => fila.fecha.getTime());

    agruparNochesPorCabana(filas);

    assert.equal(filas.length, 2);
    assert.deepEqual(
      filas.map((fila) => fila.fecha.getTime()),
      instantes,
    );
    assert.equal(filas[0].fecha.getTime(), Date.UTC(2026, 9, 10));
  });
});

describe("nochesOcupadasEnTodas", () => {
  it("devuelve un conjunto vacío si no hay cabañas", () => {
    const ocupadas = nochesOcupadasEnTodas([]);

    assert.ok(ocupadas instanceof Set);
    assert.equal(ocupadas.size, 0);
  });

  it("con una sola cabaña devuelve una copia distinta de su conjunto", () => {
    const unica = cabana("a", "A", 4, ["2026-10-11", "2026-10-12"]);

    const ocupadas = nochesOcupadasEnTodas([unica]);

    assert.notStrictEqual(ocupadas, unica.bloqueadas);
    assert.deepEqual([...ocupadas].sort(), ["2026-10-11", "2026-10-12"]);
  });

  it("calcula la intersección de dos cabañas", () => {
    const a = cabana("a", "A", 2, ["2026-10-10", "2026-10-11", "2026-10-12"]);
    const b = cabana("b", "B", 4, ["2026-10-11", "2026-10-12", "2026-10-13"]);

    const ocupadas = nochesOcupadasEnTodas([a, b]);

    assert.deepEqual([...ocupadas].sort(), ["2026-10-11", "2026-10-12"]);
  });

  it("calcula la intersección de tres cabañas", () => {
    const a = cabana("a", "A", 2, ["2026-10-10", "2026-10-11", "2026-10-12"]);
    const b = cabana("b", "B", 4, ["2026-10-11", "2026-10-12", "2026-10-13"]);
    const c = cabana("c", "C", 6, ["2026-10-11", "2026-10-14"]);

    const ocupadas = nochesOcupadasEnTodas([a, b, c]);

    assert.deepEqual([...ocupadas], ["2026-10-11"]);
  });

  it("devuelve vacío si las cabañas no comparten ninguna noche", () => {
    const a = cabana("a", "A", 2, ["2026-10-10"]);
    const b = cabana("b", "B", 4, ["2026-10-11"]);

    assert.equal(nochesOcupadasEnTodas([a, b]).size, 0);
  });

  it("devuelve vacío si alguna cabaña no tiene noches bloqueadas", () => {
    const a = cabana("a", "A", 2, ["2026-10-10", "2026-10-11"]);
    const b = cabana("b", "B", 4, []);

    assert.equal(nochesOcupadasEnTodas([a, b]).size, 0);
  });

  it("no muta los conjuntos de entrada", () => {
    const a = cabana("a", "A", 2, ["2026-10-10", "2026-10-11"]);
    const b = cabana("b", "B", 4, ["2026-10-11"]);
    const antesA = [...a.bloqueadas].sort();
    const antesB = [...b.bloqueadas].sort();

    const ocupadas = nochesOcupadasEnTodas([a, b]);
    ocupadas.add("2026-12-31");
    ocupadas.delete("2026-10-11");

    assert.deepEqual([...a.bloqueadas].sort(), antesA);
    assert.deepEqual([...b.bloqueadas].sort(), antesB);
  });
});

describe("cabanasLibresParaRango", () => {
  // Cabañas de ejemplo: capacidades 2, 5 y 6, sin noches bloqueadas.
  function cabanasDeEjemplo(): CabanaDePrueba[] {
    return [
      cabana("a", "A", 2, []),
      cabana("b", "B", 5, []),
      cabana("c", "C", 6, []),
    ];
  }

  it("devuelve las tres cabañas en orden y con los mismos objetos", () => {
    const cabanas = cabanasDeEjemplo();

    const libres = exigirOk(
      cabanasLibresParaRango(
        fechaDeTexto("10/10/2026"),
        fechaDeTexto("13/10/2026"),
        2,
        cabanas,
      ),
    );

    assert.equal(libres.length, 3);
    assert.strictEqual(libres[0], cabanas[0]);
    assert.strictEqual(libres[1], cabanas[1]);
    assert.strictEqual(libres[2], cabanas[2]);
    assert.deepEqual(
      libres.map((libre) => libre.nombre),
      ["A", "B", "C"],
    );
  });

  it("excluye la cabaña con la noche del 11/10/2026 bloqueada", () => {
    const cabanas = cabanasDeEjemplo();
    cabanas[1] = cabana("b", "B", 5, ["2026-10-11"]);

    const libres = exigirOk(
      cabanasLibresParaRango(
        fechaDeTexto("10/10/2026"),
        fechaDeTexto("13/10/2026"),
        1,
        cabanas,
      ),
    );

    assert.deepEqual(
      libres.map((libre) => libre.id),
      ["a", "c"],
    );
  });

  it("no excluye si está bloqueada la noche del día de salida (13/10/2026)", () => {
    const cabanas = cabanasDeEjemplo();
    cabanas[1] = cabana("b", "B", 5, ["2026-10-13"]);

    const libres = exigirOk(
      cabanasLibresParaRango(
        fechaDeTexto("10/10/2026"),
        fechaDeTexto("13/10/2026"),
        2,
        cabanas,
      ),
    );

    assert.deepEqual(
      libres.map((libre) => libre.id),
      ["a", "b", "c"],
    );
  });

  it("excluye si está bloqueada la noche del día de ingreso (10/10/2026)", () => {
    const unica = cabana("a", "A", 4, ["2026-10-10"]);

    assert.deepEqual(
      cabanasLibresParaRango(
        fechaDeTexto("10/10/2026"),
        fechaDeTexto("13/10/2026"),
        2,
        [unica],
      ),
      { ok: false, motivo: "NINGUNA_LIBRE" },
    );
  });

  it("da NINGUNA_LIBRE si A bloquea el 11/10/2026 y B el 12/10/2026", () => {
    const a = cabana("a", "A", 2, ["2026-10-11"]);
    const b = cabana("b", "B", 4, ["2026-10-12"]);

    const resultado = cabanasLibresParaRango(
      fechaDeTexto("10/10/2026"),
      fechaDeTexto("13/10/2026"),
      1,
      [a, b],
    );

    // Ninguna cabaña sirve para el rango completo...
    assert.deepEqual(resultado, { ok: false, motivo: "NINGUNA_LIBRE" });
    // ...aunque cada noche individual tiene alguna cabaña libre.
    assert.equal(nochesOcupadasEnTodas([a, b]).size, 0);
  });

  it("da NINGUNA_CON_CAPACIDAD con el número de huéspedes pedido", () => {
    const cabanas = [cabana("a", "A", 2, []), cabana("b", "B", 3, [])];

    assert.deepEqual(
      cabanasLibresParaRango(
        fechaDeTexto("10/10/2026"),
        fechaDeTexto("13/10/2026"),
        5,
        cabanas,
      ),
      { ok: false, motivo: "NINGUNA_CON_CAPACIDAD", huespedes: 5 },
    );
  });

  it("acepta la cabaña con capacidad exactamente igual a los huéspedes", () => {
    const cabanas = [cabana("a", "A", 2, []), cabana("b", "B", 3, [])];

    const libres = exigirOk(
      cabanasLibresParaRango(
        fechaDeTexto("10/10/2026"),
        fechaDeTexto("13/10/2026"),
        3,
        cabanas,
      ),
    );

    assert.deepEqual(
      libres.map((libre) => libre.id),
      ["b"],
    );
  });

  it("con 2 huéspedes devuelve las cabañas de capacidad 2 y 3", () => {
    const cabanas = [cabana("a", "A", 2, []), cabana("b", "B", 3, [])];

    const libres = exigirOk(
      cabanasLibresParaRango(
        fechaDeTexto("10/10/2026"),
        fechaDeTexto("13/10/2026"),
        2,
        cabanas,
      ),
    );

    assert.deepEqual(
      libres.map((libre) => libre.id),
      ["a", "b"],
    );
  });

  it("prioriza NINGUNA_LIBRE sobre NINGUNA_CON_CAPACIDAD", () => {
    const unica = cabana("a", "A", 1, ["2026-10-10", "2026-10-11", "2026-10-12"]);

    assert.deepEqual(
      cabanasLibresParaRango(
        fechaDeTexto("10/10/2026"),
        fechaDeTexto("13/10/2026"),
        10,
        [unica],
      ),
      { ok: false, motivo: "NINGUNA_LIBRE" },
    );
  });

  it("da NINGUNA_LIBRE si la lista de cabañas está vacía", () => {
    assert.deepEqual(
      cabanasLibresParaRango(
        fechaDeTexto("10/10/2026"),
        fechaDeTexto("13/10/2026"),
        1,
        [],
      ),
      { ok: false, motivo: "NINGUNA_LIBRE" },
    );
  });

  it("rechaza una salida igual al ingreso antes que los huéspedes inválidos", () => {
    assert.deepEqual(
      cabanasLibresParaRango(
        fechaDeTexto("10/10/2026"),
        fechaDeTexto("10/10/2026"),
        0,
        cabanasDeEjemplo(),
      ),
      { ok: false, motivo: "RANGO_INVALIDO" },
    );
  });

  it("rechaza una salida anterior al ingreso antes que los huéspedes inválidos", () => {
    assert.deepEqual(
      cabanasLibresParaRango(
        fechaDeTexto("11/10/2026"),
        fechaDeTexto("10/10/2026"),
        Number.NaN,
        cabanasDeEjemplo(),
      ),
      { ok: false, motivo: "RANGO_INVALIDO" },
    );
  });

  it("rechaza fechas inválidas antes que los huéspedes inválidos", () => {
    assert.deepEqual(
      cabanasLibresParaRango(
        new Date("x"),
        fechaDeTexto("13/10/2026"),
        Number.POSITIVE_INFINITY,
        cabanasDeEjemplo(),
      ),
      { ok: false, motivo: "RANGO_INVALIDO" },
    );
    assert.deepEqual(
      cabanasLibresParaRango(
        fechaDeTexto("10/10/2026"),
        new Date("x"),
        Number.POSITIVE_INFINITY,
        cabanasDeEjemplo(),
      ),
      { ok: false, motivo: "RANGO_INVALIDO" },
    );
  });

  it("rechaza más de NOCHES_MAX noches antes que los huéspedes inválidos", () => {
    assert.deepEqual(
      cabanasLibresParaRango(
        fechaDeTexto("01/10/2026"),
        fechaDeTexto("01/11/2026"),
        -1,
        cabanasDeEjemplo(),
      ),
      { ok: false, motivo: "EXCEDE_NOCHES_MAX", maximo: NOCHES_MAX },
    );
  });

  it("acepta exactamente NOCHES_MAX noches", () => {
    const unica = cabana("a", "A", 2, []);

    const libres = exigirOk(
      cabanasLibresParaRango(
        fechaDeTexto("01/10/2026"),
        fechaDeTexto("31/10/2026"),
        2,
        [unica],
      ),
    );

    assert.equal(libres.length, 1);
  });

  it("rechaza huéspedes 0, -1, 1.5, NaN e Infinity", () => {
    const invalidos = [0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY];

    for (const huespedes of invalidos) {
      assert.deepEqual(
        cabanasLibresParaRango(
          fechaDeTexto("10/10/2026"),
          fechaDeTexto("13/10/2026"),
          huespedes,
          cabanasDeEjemplo(),
        ),
        { ok: false, motivo: "HUESPEDES_INVALIDOS" },
        `Los huéspedes ${huespedes} deberían ser inválidos`,
      );
    }
  });

  it("es coherente con el calendario general del 10/10/2026 al 13/10/2026", () => {
    const todasBloqueadas = ["2026-10-10", "2026-10-11", "2026-10-12"];
    const cabanas = [
      cabana("a", "A", 2, todasBloqueadas),
      cabana("b", "B", 4, todasBloqueadas),
      cabana("c", "C", 6, todasBloqueadas),
    ];
    const ingreso = fechaDeTexto("10/10/2026");
    const salida = fechaDeTexto("13/10/2026");

    const ocupadas = nochesOcupadasEnTodas(cabanas);
    for (const clave of nochesDeRango(ingreso, salida)) {
      assert.equal(ocupadas.has(clave), true, `La noche ${clave} debería estar ocupada en todas`);
    }

    assert.deepEqual(cabanasLibresParaRango(ingreso, salida, 2, cabanas), {
      ok: false,
      motivo: "NINGUNA_LIBRE",
    });
  });

  it("cumple la propiedad de consistencia en varios rangos y huéspedes", () => {
    const cabanas = [
      cabana("a", "A", 2, ["2026-10-11"]),
      cabana("b", "B", 4, ["2026-10-12"]),
      cabana("c", "C", 6, ["2026-10-20", "2026-11-02"]),
      cabana("d", "D", 3, []),
    ];
    const rangos: { ingreso: string; salida: string }[] = [
      { ingreso: "2026-10-10", salida: "2026-10-11" },
      { ingreso: "2026-10-10", salida: "2026-10-13" },
      { ingreso: "2026-10-15", salida: "2026-10-18" },
      { ingreso: "2026-10-31", salida: "2026-11-03" },
    ];
    const cantidades = [1, 2, 3, 4, 7];

    for (const rango of rangos) {
      const ingreso = fecha(rango.ingreso);
      const salida = fecha(rango.salida);
      const noches = nochesDeRango(ingreso, salida);

      for (const huespedes of cantidades) {
        const resultado = cabanasLibresParaRango(ingreso, salida, huespedes, cabanas);
        if (!resultado.ok) {
          continue;
        }

        const devueltas = new Set(resultado.cabanas.map((libre) => libre.id));
        for (const cabanaEvaluada of cabanas) {
          const deberiaServir = sirve(cabanaEvaluada, noches, huespedes);
          assert.equal(
            devueltas.has(cabanaEvaluada.id),
            deberiaServir,
            `La cabaña ${cabanaEvaluada.id} no coincide para ${rango.ingreso} → ${rango.salida} con ${huespedes} huéspedes`,
          );
          if (deberiaServir) {
            // La cabaña devuelta no tiene bloqueos en el rango y alcanza la capacidad.
            assert.equal(
              noches.some((clave) => cabanaEvaluada.bloqueadas.has(clave)),
              false,
            );
            assert.ok(cabanaEvaluada.capacidad >= huespedes);
          }
        }
      }
    }
  });

  it("no muta la lista de cabañas, sus conjuntos ni las fechas", () => {
    const cabanas = [
      cabana("a", "A", 2, ["2026-10-11"]),
      cabana("b", "B", 5, ["2026-10-12", "2026-10-20"]),
      cabana("c", "C", 6, ["2026-10-11"]),
    ];
    const ingreso = fechaDeTexto("10/10/2026");
    const salida = fechaDeTexto("13/10/2026");
    const instanteIngreso = ingreso.getTime();
    const instanteSalida = salida.getTime();
    const conjuntosAntes = cabanas.map((una) => una.bloqueadas);
    const contenidosAntes = cabanas.map((una) => [...una.bloqueadas].sort());
    const ordenAntes = cabanas.map((una) => una.id);

    cabanasLibresParaRango(ingreso, salida, 2, cabanas);
    agruparNochesPorCabana(
      cabanas.map((una) => ({ propiedadId: una.id, fecha: ingreso })),
    );
    nochesOcupadasEnTodas(cabanas);

    assert.equal(ingreso.getTime(), instanteIngreso);
    assert.equal(salida.getTime(), instanteSalida);
    assert.deepEqual(
      cabanas.map((una) => una.id),
      ordenAntes,
    );
    assert.deepEqual(
      cabanas.map((una) => una.bloqueadas),
      conjuntosAntes,
    );
    assert.deepEqual(
      cabanas.map((una) => [...una.bloqueadas].sort()),
      contenidosAntes,
    );
  });
});
