import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  DIAS_SEMANA_CORTOS,
  MESES,
  armarMes,
  etiquetaMes,
  mesAnterior,
  mesDeClave,
  mesEnRango,
  mesSiguiente,
  type MesGrilla,
} from "./grilla";
import { aClaveFecha, deClaveFecha, sumarDias } from "./noches";

// Construye el día indicado (clave "AAAA-MM-DD") a medianoche UTC.
function fecha(clave: string): Date {
  const dia = deClaveFecha(clave);
  if (dia === null) {
    throw new Error(`La clave ${clave} debería ser válida`);
  }
  return dia;
}

// Devuelve todas las claves de la grilla en orden de lectura.
function clavesDe(grilla: MesGrilla): string[] {
  return grilla.semanas.flat().map((dia) => dia.clave);
}

// Días de cada mes de los años de prueba, con febrero bisiesto en 2028.
const DIAS_POR_MES: Readonly<Record<number, readonly number[]>> = {
  2026: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
  2027: [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
  2028: [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
};

const ANIOS_DE_PRUEBA = [2026, 2027, 2028] as const;

describe("constantes del calendario", () => {
  it("define los doce meses en orden y de 1 a 12", () => {
    assert.equal(MESES.length, 12);
    assert.equal(MESES[0], "enero");
    assert.equal(MESES[10], "noviembre");
    assert.equal(MESES[11], "diciembre");
  });

  it("define los días de la semana con lunes primero", () => {
    assert.deepEqual(
      [...DIAS_SEMANA_CORTOS],
      ["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"],
    );
  });
});

describe("armarMes", () => {
  it("arma 6 semanas de 7 casilleros con 42 claves distintas y consecutivas", () => {
    const grilla = armarMes(2026, 11);

    assert.equal(grilla.anio, 2026);
    assert.equal(grilla.mes, 11);
    assert.equal(grilla.semanas.length, 6);
    for (const semana of grilla.semanas) {
      assert.equal(semana.length, 7);
    }

    const claves = clavesDe(grilla);
    assert.equal(claves.length, 42);
    assert.equal(new Set(claves).size, 42, "no debería haber claves repetidas");

    for (let i = 1; i < claves.length; i += 1) {
      assert.equal(
        aClaveFecha(sumarDias(fecha(claves[i - 1]), 1)),
        claves[i],
        `la clave ${claves[i]} debería ser el día siguiente de ${claves[i - 1]}`,
      );
    }
  });

  it("empieza en lunes y termina en domingo en todos los meses de 2026 a 2028", () => {
    for (const anio of ANIOS_DE_PRUEBA) {
      for (let mes = 1; mes <= 12; mes += 1) {
        const claves = clavesDe(armarMes(anio, mes));
        assert.equal(
          fecha(claves[0]).getUTCDay(),
          1,
          `${anio}-${mes} debería empezar en lunes`,
        );
        assert.equal(
          fecha(claves[41]).getUTCDay(),
          0,
          `${anio}-${mes} debería terminar en domingo`,
        );
      }
    }
  });

  it("marca delMes en la cantidad exacta de días del mes, incluido el bisiesto", () => {
    for (const anio of ANIOS_DE_PRUEBA) {
      for (let mes = 1; mes <= 12; mes += 1) {
        const grilla = armarMes(anio, mes);
        const delMes = grilla.semanas.flat().filter((dia) => dia.delMes);
        const esperados = DIAS_POR_MES[anio][mes - 1];
        assert.equal(
          delMes.length,
          esperados,
          `${anio}-${mes} debería tener ${esperados} días del mes`,
        );
      }
    }
  });

  it("asigna mes, año y número de día correctos a los casilleros del mes", () => {
    for (const anio of ANIOS_DE_PRUEBA) {
      for (let mes = 1; mes <= 12; mes += 1) {
        const grilla = armarMes(anio, mes);
        for (const dia of grilla.semanas.flat()) {
          if (!dia.delMes) {
            continue;
          }
          assert.equal(Number(dia.clave.slice(0, 4)), anio);
          assert.equal(Number(dia.clave.slice(5, 7)), mes);
          assert.equal(
            dia.dia,
            Number(dia.clave.slice(8, 10)),
            `el día de ${dia.clave} debería coincidir con la clave`,
          );
        }
      }
    }
  });

  it("ubica noviembre de 2026, que empieza en domingo, con relleno de octubre", () => {
    const grilla = armarMes(2026, 11);

    assert.deepEqual(
      grilla.semanas[0].map((dia) => dia.clave),
      [
        "2026-10-26",
        "2026-10-27",
        "2026-10-28",
        "2026-10-29",
        "2026-10-30",
        "2026-10-31",
        "2026-11-01",
      ],
    );
    assert.equal(grilla.semanas[0][6].delMes, true);
    assert.equal(grilla.semanas[0][5].delMes, false);
    assert.equal(
      grilla.semanas[0].findIndex((dia) => dia.delMes),
      6,
      "el primer día de noviembre debería estar en el índice 6 de la semana 0",
    );
    assert.equal(clavesDe(grilla)[41], "2026-12-06");
  });

  it("arma febrero de 2027, que empieza lunes, sin relleno al inicio", () => {
    const grilla = armarMes(2027, 2);
    const claves = clavesDe(grilla);

    assert.equal(claves[0], "2027-02-01");
    assert.equal(claves[41], "2027-03-14");

    const marzo = grilla.semanas
      .flat()
      .filter((dia) => dia.clave >= "2027-03-01" && dia.clave <= "2027-03-14");
    assert.equal(marzo.length, 14);
    for (const dia of marzo) {
      assert.equal(dia.delMes, false, `${dia.clave} no pertenece a febrero`);
    }
  });

  it("arma febrero de 2028, bisiesto y con inicio en martes", () => {
    const grilla = armarMes(2028, 2);
    const claves = clavesDe(grilla);

    assert.equal(claves[0], "2028-01-31");
    assert.equal(claves[41], "2028-03-12");

    const bisiesto = grilla.semanas
      .flat()
      .find((dia) => dia.clave === "2028-02-29");
    assert.equal(bisiesto?.delMes, true, "el 29/02/2028 debería ser del mes");
    assert.equal(bisiesto?.dia, 29);
  });

  it("arma diciembre de 2026 cruzando el año", () => {
    const grilla = armarMes(2026, 12);
    const claves = clavesDe(grilla);

    assert.equal(claves[0], "2026-11-30");
    assert.equal(claves[41], "2027-01-10");

    const primeroDeEnero = grilla.semanas
      .flat()
      .find((dia) => dia.clave === "2027-01-01");
    assert.equal(primeroDeEnero?.delMes, false);
  });

  it("arma enero de 2027 con relleno de diciembre y de febrero", () => {
    const claves = clavesDe(armarMes(2027, 1));

    assert.equal(claves[0], "2026-12-28");
    assert.equal(claves[41], "2027-02-07");
  });

  it("acepta los bordes del rango soportado, 2000-01 y 2100-12", () => {
    const primero = armarMes(2000, 1);
    const ultimo = armarMes(2100, 12);

    assert.equal(clavesDe(primero).length, 42);
    assert.equal(clavesDe(ultimo).length, 42);
    assert.equal(clavesDe(primero)[0], "1999-12-27");
    assert.equal(clavesDe(ultimo)[41], "2101-01-09");
  });

  it("lanza RangeError con año o mes inválidos", () => {
    const casos: ReadonlyArray<readonly [string, () => void]> = [
      ["mes 0", () => armarMes(2026, 0)],
      ["mes 13", () => armarMes(2026, 13)],
      ["mes 1.5", () => armarMes(2026, 1.5)],
      ["mes NaN", () => armarMes(2026, Number.NaN)],
      ["año 1999", () => armarMes(1999, 1)],
      ["año 2101", () => armarMes(2101, 1)],
      ["año 2026.5", () => armarMes(2026.5, 1)],
    ];

    for (const [nombre, ejecutar] of casos) {
      assert.throws(ejecutar, RangeError, nombre);
    }
  });
});

describe("mesDeClave", () => {
  it("devuelve el año y el mes de una clave válida", () => {
    assert.deepEqual(mesDeClave("2026-11-15"), { anio: 2026, mes: 11 });
    assert.deepEqual(mesDeClave("2028-02-29"), { anio: 2028, mes: 2 });
  });

  it("devuelve null para claves inválidas", () => {
    const invalidas = ["2026-02-30", "15/11/2026", "", "2026-13-01"];

    for (const clave of invalidas) {
      assert.equal(mesDeClave(clave), null, `La clave ${clave} debería ser inválida`);
    }
  });
});

describe("mesSiguiente y mesAnterior", () => {
  it("avanza y retrocede un mes dentro del mismo año", () => {
    assert.deepEqual(mesSiguiente(2026, 11), { anio: 2026, mes: 12 });
    assert.deepEqual(mesAnterior(2026, 11), { anio: 2026, mes: 10 });
  });

  it("cruza el cambio de año en diciembre y enero", () => {
    assert.deepEqual(mesSiguiente(2026, 12), { anio: 2027, mes: 1 });
    assert.deepEqual(mesAnterior(2027, 1), { anio: 2026, mes: 12 });
  });

  it("lanza RangeError con mes inválido o año no entero", () => {
    assert.throws(() => mesSiguiente(2026, 0), RangeError);
    assert.throws(() => mesSiguiente(2026, 13), RangeError);
    assert.throws(() => mesSiguiente(2026, 1.5), RangeError);
    assert.throws(() => mesSiguiente(2026.5, 1), RangeError);

    assert.throws(() => mesAnterior(2026, 0), RangeError);
    assert.throws(() => mesAnterior(2026, 13), RangeError);
    assert.throws(() => mesAnterior(2026, Number.NaN), RangeError);
    assert.throws(() => mesAnterior(Number.NaN, 1), RangeError);
  });
});

describe("etiquetaMes", () => {
  it("devuelve el nombre del mes capitalizado y el año", () => {
    assert.equal(etiquetaMes(2026, 11), "Noviembre de 2026");
    assert.equal(etiquetaMes(2028, 2), "Febrero de 2028");
    assert.equal(etiquetaMes(2026, 1), "Enero de 2026");
  });

  it("lanza RangeError con mes inválido", () => {
    assert.throws(() => etiquetaMes(2026, 0), RangeError);
    assert.throws(() => etiquetaMes(2026, 13), RangeError);
    assert.throws(() => etiquetaMes(2026, 1.5), RangeError);
  });
});

describe("mesEnRango", () => {
  const DESDE = "2026-10-31";
  const HASTA = "2028-04-30";

  it("detecta solapamiento con la ventana de ejemplo", () => {
    assert.equal(mesEnRango(2026, 10, DESDE, HASTA), true, "octubre 2026 entra por el 31");
    assert.equal(mesEnRango(2026, 9, DESDE, HASTA), false, "septiembre 2026 queda antes");
    assert.equal(mesEnRango(2028, 4, DESDE, HASTA), true, "abril 2028 entra hasta el 30");
    assert.equal(mesEnRango(2028, 5, DESDE, HASTA), false, "mayo 2028 queda después");
  });

  it("funciona con una ventana de un solo día", () => {
    assert.equal(mesEnRango(2026, 11, "2026-11-15", "2026-11-15"), true);
    assert.equal(mesEnRango(2026, 10, "2026-11-15", "2026-11-15"), false);
    assert.equal(mesEnRango(2026, 12, "2026-11-15", "2026-11-15"), false);
  });

  it("devuelve false si la ventana es inválida o está invertida", () => {
    assert.equal(mesEnRango(2026, 11, "2026-12-01", "2026-11-01"), false);
    assert.equal(mesEnRango(2026, 11, "2026-02-30", "2026-12-01"), false);
    assert.equal(mesEnRango(2026, 11, "2026-11-01", "2026-13-01"), false);
    assert.equal(mesEnRango(2026, 11, "", "2026-12-01"), false);
  });

  it("lanza RangeError con mes inválido", () => {
    assert.throws(() => mesEnRango(2026, 0, DESDE, HASTA), RangeError);
    assert.throws(() => mesEnRango(2026, 13, DESDE, HASTA), RangeError);
  });
});
